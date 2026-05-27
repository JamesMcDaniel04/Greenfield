/**
 * submit-project — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/submit-project
 * Body: { submission_id }
 *   — caller has already written repo_url / deploy_url / demo_url / written_answers
 *     onto the draft submission via the normal RLS-protected UPDATE.
 *
 * Flow:
 *   1. Auth + load submission + verify caller owns it (via enrollment).
 *   2. Load the project row (rubric, anti-cheat questions, required artifacts).
 *   3. Validate artifacts are present and each answer meets its min_words.
 *   4. Check career plan + monthly quota.
 *   5. Flip submission.status to 'grading'.
 *   6. Internally invoke run-agent with { submission_id, agent_role: 'evaluator',
 *      prompt: '<canonical evaluator prompt>' }.
 *   7. Parse the evaluator's JSON output -> career_submission_evaluations row.
 *   8. Update submission.status to 'passed' / 'needs_revision' and graded_at.
 *   9. Return the new evaluation.
 *
 * Deploy:
 *   supabase functions deploy submit-project
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error — Deno global at runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // @ts-expect-error
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  // @ts-expect-error
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "UNAUTHENTICATED" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { submission_id?: string };
  try { body = await req.json(); } catch { return json({ error: "INVALID_INPUT" }, 400); }
  if (!body.submission_id) return json({ error: "INVALID_INPUT", details: "submission_id required" }, 400);

  // Load submission + nested project + enrollment owner. RLS already restricts
  // reads to the owning learner; this also lets us pull the rubric in one round-trip.
  const { data: subRow, error: subErr } = await userClient
    .from("career_submissions")
    .select(`
      id, enrollment_id, project_slug, status, attempt_no,
      repo_url, deploy_url, demo_url, written_answers,
      career_enrollments!inner(id, user_id),
      career_projects!inner(slug, title, required_artifacts, anti_cheat_questions, rubric)
    `)
    .eq("id", body.submission_id)
    .maybeSingle();
  if (subErr || !subRow) return json({ error: "SUBMISSION_NOT_FOUND" }, 404);
  if ((subRow.career_enrollments as { user_id: string }).user_id !== userData.user.id) {
    return json({ error: "NOT_OWNER" }, 403);
  }
  if (subRow.status !== "draft" && subRow.status !== "needs_revision") {
    return json({ error: "SUBMISSION_NOT_DRAFT", details: `status=${subRow.status}` }, 409);
  }

  // Validate artifacts + anti-cheat answers
  const project = subRow.career_projects as Record<string, unknown>;
  const required = (project.required_artifacts as string[] | undefined) ?? [];
  const missing: string[] = [];
  for (const key of required) {
    const val = (subRow as Record<string, unknown>)[key];
    if (typeof val !== "string" || !val.trim()) missing.push(key);
  }
  if (missing.length) {
    return json({ error: "MISSING_ARTIFACTS", details: missing.join(", ") }, 400);
  }

  const questions = (project.anti_cheat_questions as Array<{ id: string; min_words: number }>) ?? [];
  const answers = (subRow.written_answers as Record<string, string>) ?? {};
  const shortAnswers: Array<{ id: string; needed: number; got: number }> = [];
  for (const q of questions) {
    const text = (answers[q.id] ?? "").trim();
    const words = text.length ? text.split(/\s+/).length : 0;
    if (words < (q.min_words ?? 0)) shortAnswers.push({ id: q.id, needed: q.min_words ?? 0, got: words });
  }
  if (shortAnswers.length) {
    return json({ error: "ANSWERS_TOO_SHORT", details: shortAnswers }, 400);
  }

  // Service-role for everything below — quota check, status flips, evaluator
  // run insertion, evaluation row creation.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Career plan + monthly quota
  const { data: prof } = await admin
    .from("profiles")
    .select("personal_team_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  const teamId = prof?.personal_team_id as string | undefined;
  if (!teamId) return json({ error: "NO_PERSONAL_TEAM" }, 409);
  const { data: team } = await admin
    .from("teams")
    .select("career_runs_per_month_quota")
    .eq("id", teamId)
    .maybeSingle();
  const quota = (team?.career_runs_per_month_quota as number | undefined) ?? 0;
  if (quota <= 0) return json({ error: "CAREER_PLAN_REQUIRED" }, 403);
  const ym = new Date().toISOString().slice(0, 7);
  const { data: usage } = await admin
    .from("career_usage_monthly")
    .select("runs_used")
    .eq("team_id", teamId)
    .eq("year_month", ym)
    .maybeSingle();
  const used = (usage?.runs_used as number | undefined) ?? 0;
  if (used >= quota) return json({ error: "CAREER_QUOTA_EXCEEDED" }, 403);

  // Flip the submission into grading
  await admin
    .from("career_submissions")
    .update({ status: "grading", submitted_at: new Date().toISOString() })
    .eq("id", subRow.id);

  // Invoke run-agent internally. Forward the caller's JWT so resolveSubmissionSubject's
  // RLS join still resolves the enrollment row.
  let agentResp: { run_id: string; output_markdown: string };
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/run-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        submission_id: subRow.id,
        agent_role: "evaluator",
        prompt: `Grade this submission against the rubric. Use read_project_brief, read_submission, and read_rubric to ground your judgment. Inspect the repo and deploy via fetch_url. Return strict JSON only.`,
      }),
    });
    const body = await r.json();
    if (!r.ok) {
      await admin
        .from("career_submissions")
        .update({ status: "draft", submitted_at: null })
        .eq("id", subRow.id);
      return json({ error: "EVALUATOR_FAILED", details: body }, 500);
    }
    agentResp = body as typeof agentResp;
  } catch (e) {
    await admin
      .from("career_submissions")
      .update({ status: "draft", submitted_at: null })
      .eq("id", subRow.id);
    return json({ error: "EVALUATOR_FAILED", details: (e as Error).message }, 500);
  }

  // Parse the evaluator's JSON output. We tolerate ```json fences around it.
  const parsed = extractJsonObject(agentResp.output_markdown);
  if (!parsed) {
    await admin
      .from("career_submissions")
      .update({ status: "needs_revision", graded_at: new Date().toISOString() })
      .eq("id", subRow.id);
    return json({
      error: "EVALUATOR_OUTPUT_UNPARSEABLE",
      details: "Evaluator did not return valid JSON. Marked as needs_revision.",
    }, 500);
  }
  const rubric_scores = (parsed.rubric_scores as unknown[]) ?? [];
  const overall_pass = parsed.overall_pass === true;
  const feedback_md = typeof parsed.feedback_md === "string" ? parsed.feedback_md : null;

  // Insert evaluation
  const { data: evalRow, error: evalErr } = await admin
    .from("career_submission_evaluations")
    .insert({
      submission_id: subRow.id,
      evaluator_agent_run_id: agentResp.run_id,
      rubric_scores,
      overall_pass,
      model_feedback_md: feedback_md,
    })
    .select("*")
    .single();
  if (evalErr) return json({ error: "INTERNAL", details: evalErr.message }, 500);

  // Update submission status. The portfolio trigger watches for status=passed.
  await admin
    .from("career_submissions")
    .update({
      status: overall_pass ? "passed" : "needs_revision",
      graded_at: new Date().toISOString(),
    })
    .eq("id", subRow.id);

  return json({ evaluation: evalRow, overall_pass }, 200);
});

/**
 * Pull the first JSON object out of a Markdown blob. Handles the common case
 * where the evaluator wraps its JSON in ```json fences.
 */
function extractJsonObject(md: string | null): Record<string, unknown> | null {
  if (!md) return null;
  const fenced = md.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : md;
  try {
    return JSON.parse(candidate.trim()) as Record<string, unknown>;
  } catch {
    // Try to slice from the first `{` to the last `}` as a last-ditch effort.
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first === -1 || last <= first) return null;
    try {
      return JSON.parse(candidate.slice(first, last + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
