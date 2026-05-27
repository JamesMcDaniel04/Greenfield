/**
 * run-agent — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/run-agent
 * Body: { claim_id, agent_role, prompt }
 *
 * Synchronous execution: claim ownership check -> insert agent_runs row ->
 * Anthropic tool-use loop (read_opportunity_brief / read_signals / web_search /
 * fetch_url / save_note) -> store final Markdown + tool trace -> return.
 *
 * Deploy:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase secrets set BRAVE_API_KEY=...    # optional; web_search degrades if missing
 *   supabase functions deploy run-agent
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error
import Anthropic from "npm:@anthropic-ai/sdk@0.40.1";

import { toolsForRole, executeTool, type ToolContext, type ToolDefinition } from "./tools.ts";

const MODEL          = "claude-sonnet-4-6";
const MAX_TOKENS     = 4_000;
const MAX_ITERATIONS = 8;

const VALID_ROLES = new Set(["research", "gtm", "sales", "marketing", "engineering"]);
type AgentRole = "research" | "gtm" | "sales" | "marketing" | "engineering";

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
  // @ts-expect-error
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

  if (!ANTHROPIC_API_KEY) return json({ error: "Server missing ANTHROPIC_API_KEY" }, 500);

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "UNAUTHENTICATED" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  // Parse + validate
  let body: {
    claim_id?: string;
    user_idea_id?: string;
    user_project_id?: string;
    agent_role?: string;
    prompt?: string;
  };
  try { body = await req.json(); } catch { return json({ error: "INVALID_INPUT" }, 400); }
  if (!body.agent_role || !body.prompt) {
    return json({ error: "INVALID_INPUT", details: "agent_role and prompt are required" }, 400);
  }
  const subjectFkCount =
    (body.claim_id ? 1 : 0) +
    (body.user_idea_id ? 1 : 0) +
    (body.user_project_id ? 1 : 0);
  if (subjectFkCount !== 1) {
    return json({ error: "INVALID_INPUT", details: "exactly one of claim_id, user_idea_id, user_project_id is required" }, 400);
  }
  if (!VALID_ROLES.has(body.agent_role)) {
    return json({ error: "INVALID_INPUT", details: "agent_role must be research | gtm | sales | marketing | engineering" }, 400);
  }

  // Service-role client for writes the user can't perform via RLS
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Resolve the subject. For catalogue claims we fetch the joined opportunity;
  // for BYO subjects we fetch the row + verify team membership.
  const resolved = await resolveSubject(userClient, body);
  if ("error" in resolved) return json({ error: resolved.error }, resolved.status);
  const subject = resolved.subject;

  // BYO enforcement: plan must unlock BYO, and the team must have monthly quota.
  if (subject.kind !== "claim") {
    const gate = await checkByoQuota(admin, subject.team_id);
    if ("error" in gate) return json({ error: gate.error }, 403);
  }

  // Insert the run row (status=running) so the UI can show it immediately
  const subjectFk =
    subject.kind === "claim"        ? { claim_id: subject.id } :
    subject.kind === "user_idea"    ? { user_idea_id: subject.id } :
                                      { user_project_id: subject.id };
  const { data: runRow, error: runErr } = await admin
    .from("agent_runs")
    .insert({
      ...subjectFk,
      agent_role: body.agent_role,
      status: "running",
      prompt: body.prompt,
      model: MODEL,
    })
    .select("id")
    .single();
  if (runErr || !runRow) return json({ error: "INTERNAL", details: runErr?.message }, 500);

  try {
    const result = await runAgentLoop({
      anthropicKey: ANTHROPIC_API_KEY,
      agent_role: body.agent_role as AgentRole,
      prompt: body.prompt,
      subject,
      admin,
    });

    await admin
      .from("agent_runs")
      .update({
        status: "succeeded",
        output_markdown: result.output_markdown,
        tool_calls: result.tool_calls,
        tokens_input: result.tokens_input,
        tokens_output: result.tokens_output,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);

    return json({
      run_id: runRow.id,
      output_markdown: result.output_markdown,
      tool_calls: result.tool_calls,
    }, 200);
  } catch (e) {
    const message = (e as Error).message;
    await admin
      .from("agent_runs")
      .update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRow.id);
    return json({ error: "AGENT_FAILED", details: message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Persona builder — small, deterministic. Mirrors src/lib/agentTeam.ts
// without importing it (edge functions can't reach the React tree).
// ─────────────────────────────────────────────────────────────────────────

const ROLE_PERSONAS: Record<string, { name: string; mission: (s: Subject) => string }> = {
  research: {
    name: "Research Agent",
    mission: (s) => `Build the upstream evidence base for ${s.title}: who else operates in ${(s.niche ?? s.industry).toLowerCase()}, what has been acquired or merged in the last 24 months, and which industry signals justify acting now.`,
  },
  gtm: {
    name: "GTM Agent",
    mission: (s) => `Define the initial market wedge for ${s.title} so the founder has one segment, one promise, and one launch motion to run in the next ${s.time_to_launch.toLowerCase()}.`,
  },
  sales: {
    name: "Sales Agent",
    mission: (s) => s.audience.toLowerCase() === "b2b"
      ? `Turn ${s.title} into live pipeline by recruiting design partners and revenue conversations inside ${(s.niche ?? s.industry).toLowerCase()}.`
      : `Turn ${s.title} into monetizable demand through partnerships, waitlist conversion, and revenue-bearing customer conversations.`,
  },
  marketing: {
    name: "Marketing Agent",
    mission: (s) => `Build a repeatable narrative for ${s.title} so every landing page, thread, and proof asset reinforces the same ${s.distribution_play.toLowerCase()} wedge.`,
  },
  engineering: {
    name: "Engineering Agent",
    mission: (s) => `Ship the smallest viable version of ${s.title} that proves the core workflow for ${s.audience.toLowerCase()} buyers without broadening into a suite.`,
  },
};

/**
 * Normalized subject the persona builder and tool layer both work against.
 * Catalogue claims, user_ideas, and user_projects all collapse to this shape.
 */
type Subject = {
  kind: "claim" | "user_idea" | "user_project";
  id: string;                  // claim.id | user_idea.id | user_project.id
  team_id: string;
  /** Present only for catalogue claims — used by tools that look up signals/briefs. */
  opportunity_id: string | null;
  opportunity_slug: string | null;

  title: string;
  one_liner: string;
  audience: string;
  industry: string;
  niche: string | null;
  model_type: string;
  distribution_play: string;
  demand_trend: string;
  founder_path: string;
  difficulty: string;
  starting_capital: string;
  time_to_launch: string;
};

const FALLBACK = "unspecified";

function normFallback(v: string | null | undefined): string {
  return v && v.trim() ? v : FALLBACK;
}

// @ts-expect-error — supabase-js client typing is fine at runtime
async function resolveSubject(
  userClient: ReturnType<typeof createClient>,
  body: { claim_id?: string; user_idea_id?: string; user_project_id?: string },
): Promise<{ subject: Subject } | { error: string; status: number }> {
  if (body.claim_id) {
    const { data, error } = await userClient
      .from("idea_claims")
      .select("id, opportunity_id, team_id, status, opportunities!inner(slug, title, one_liner, audience, industry, niche, model_type, distribution_play, demand_trend, founder_path, difficulty, starting_capital, time_to_launch)")
      .eq("id", body.claim_id)
      .maybeSingle();
    if (error || !data) return { error: "CLAIM_NOT_FOUND", status: 404 };
    if (data.status !== "active") return { error: "CLAIM_NOT_ACTIVE", status: 409 };
    const o = data.opportunities as Record<string, string | null>;
    return {
      subject: {
        kind: "claim",
        id: data.id as string,
        team_id: data.team_id as string,
        opportunity_id: data.opportunity_id as string,
        opportunity_slug: (o.slug as string) ?? null,
        title: normFallback(o.title),
        one_liner: normFallback(o.one_liner),
        audience: normFallback(o.audience),
        industry: normFallback(o.industry),
        niche: o.niche,
        model_type: normFallback(o.model_type),
        distribution_play: normFallback(o.distribution_play),
        demand_trend: normFallback(o.demand_trend),
        founder_path: normFallback(o.founder_path),
        difficulty: normFallback(o.difficulty),
        starting_capital: normFallback(o.starting_capital),
        time_to_launch: normFallback(o.time_to_launch),
      },
    };
  }

  // BYO: user_idea or user_project — RLS gates visibility to team members.
  const table = body.user_idea_id ? "user_ideas" : "user_projects";
  const id = (body.user_idea_id ?? body.user_project_id) as string;
  const titleCol = body.user_idea_id ? "one_liner" : "summary";
  const { data, error } = await userClient
    .from(table)
    .select(`id, team_id, title, ${titleCol}, audience, industry, niche, model_type, distribution_play, demand_trend, founder_path, starting_capital, time_to_launch`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { error: "SUBJECT_NOT_FOUND", status: 404 };
  const row = data as Record<string, string | null>;
  return {
    subject: {
      kind: body.user_idea_id ? "user_idea" : "user_project",
      id: row.id as string,
      team_id: row.team_id as string,
      opportunity_id: null,
      opportunity_slug: null,
      title: normFallback(row.title),
      one_liner: normFallback(row[titleCol] as string | null),
      audience: normFallback(row.audience),
      industry: normFallback(row.industry),
      niche: row.niche,
      model_type: normFallback(row.model_type),
      distribution_play: normFallback(row.distribution_play),
      demand_trend: normFallback(row.demand_trend),
      founder_path: normFallback(row.founder_path),
      difficulty: FALLBACK,
      starting_capital: normFallback(row.starting_capital),
      time_to_launch: normFallback(row.time_to_launch),
    },
  };
}

// @ts-expect-error — supabase-js client typing is fine at runtime
async function checkByoQuota(
  admin: ReturnType<typeof createClient>,
  team_id: string,
): Promise<{ ok: true } | { error: string }> {
  const { data: team } = await admin
    .from("teams")
    .select("byo_runs_per_month_quota")
    .eq("id", team_id)
    .maybeSingle();
  const quota = (team?.byo_runs_per_month_quota as number | undefined) ?? 0;
  if (quota <= 0) return { error: "BYO_PLAN_REQUIRED" };

  const ym = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const { data: usage } = await admin
    .from("byo_usage_monthly")
    .select("runs_used")
    .eq("team_id", team_id)
    .eq("year_month", ym)
    .maybeSingle();
  const used = (usage?.runs_used as number | undefined) ?? 0;
  if (used >= quota) return { error: "BYO_QUOTA_EXCEEDED" };
  return { ok: true };
}

function buildSystemPrompt(role: string, subject: Subject): string {
  const persona = ROLE_PERSONAS[role];
  const subjectLabel =
    subject.kind === "claim"        ? "claimed opportunity" :
    subject.kind === "user_idea"    ? "user-submitted idea" :
                                      "user-submitted project";
  const briefHint = subject.kind === "claim"
    ? "- Call `read_opportunity_brief` first if you need the long-form briefing, gap, play, market, timing, or build path."
    : "- This subject was submitted by the founder, not from the catalogue. `read_opportunity_brief` will return a stub — work from the context above and external signals.";
  return [
    `You are the ${persona.name} for the ${subjectLabel} "${subject.title}".`,
    "",
    `Mission: ${persona.mission(subject)}`,
    "",
    `Context (anchor every recommendation to these facts):`,
    `- One-liner: ${subject.one_liner}`,
    `- Audience: ${subject.audience} · Industry: ${subject.industry} · Niche: ${subject.niche ?? subject.industry}`,
    `- Business model: ${subject.model_type} · Distribution: ${subject.distribution_play}`,
    `- Founder path: ${subject.founder_path} · Capital: ${subject.starting_capital} · Launch window: ${subject.time_to_launch}`,
    `- Difficulty: ${subject.difficulty} · Demand trend: ${subject.demand_trend}`,
    "",
    "Tool use:",
    briefHint,
    "- Call `read_signals` to see cited research already collected (catalogue subjects only).",
    "- Call `web_search` for fresh external info — only when internal context is insufficient.",
    "- Call `fetch_url` to read a specific source web_search surfaced.",
    "- Call `save_note` to record explicit handoffs to the other agents or to bookmark a finding.",
    role === "research"    ? "- Call `landscape_competitors` for a wide (10–15) competitor map; `find_acquisitions` for M&A in the last 24 months; `find_industry_reports` for sized market data from named research firms." : "",
    role === "gtm"         ? "- Call `find_competitors` when you need a competitor list for positioning or pricing." : "",
    role === "sales"       ? "- Call `find_companies` when you need a target-account list — falls back to web_search if Apollo isn't configured." : "",
    role === "marketing"   ? "- Call `keyword_volume` to ground content/SEO bets in real demand numbers." : "",
    role === "engineering" ? "- Call `search_github` to find open-source incumbents or reference implementations before designing." : "",
    "",
    "Output rules:",
    "- Return concrete work product, not generic advice.",
    "- Prefer bullets, tables, short scripts, and named next actions the founder can ship this week.",
    "- Cite any external claim with its source URL inline.",
    "- End with a `## Handoffs` section listing follow-ups for the other agents (Research / GTM / Sales / Marketing / Engineering), each as a one-line directive.",
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// The Anthropic tool-use loop
// ─────────────────────────────────────────────────────────────────────────

type LoopResult = {
  output_markdown: string;
  tool_calls: Array<{ name: string; input: unknown; result: unknown; duration_ms: number }>;
  tokens_input: number;
  tokens_output: number;
};

async function runAgentLoop(args: {
  anthropicKey: string;
  agent_role: AgentRole;
  prompt: string;
  subject: Subject;
  // @ts-expect-error — Supabase service-role client typing is fine at runtime
  admin: ReturnType<typeof createClient>;
}): Promise<LoopResult> {
  const anthropic = new Anthropic({ apiKey: args.anthropicKey });
  const systemPrompt = buildSystemPrompt(args.agent_role, args.subject);
  // @ts-expect-error — Deno global at runtime
  const env = Deno.env;
  const toolCtx: ToolContext = {
    claim_id: args.subject.kind === "claim" ? args.subject.id : null,
    opportunity_id: args.subject.opportunity_id,
    opportunity_slug: args.subject.opportunity_slug,
    admin: args.admin,
    env,
  };

  const availableTools: ToolDefinition[] = toolsForRole(args.agent_role);
  const tools = availableTools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const messages: Array<{ role: "user" | "assistant"; content: unknown }> = [
    { role: "user", content: args.prompt },
  ];
  const trace: LoopResult["tool_calls"] = [];
  let tokens_input = 0;
  let tokens_output = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        // long static persona — cached across the loop
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
      ],
      tools,
      messages,
    });
    tokens_input  += resp.usage?.input_tokens  ?? 0;
    tokens_output += resp.usage?.output_tokens ?? 0;

    // Stop conditions: end_turn (final assistant message) or no tool_use blocks
    const toolUses = (resp.content as Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }>)
      .filter((b) => b.type === "tool_use");

    if (resp.stop_reason === "end_turn" || toolUses.length === 0) {
      const text = (resp.content as Array<{ type: string; text?: string }>)
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text!)
        .join("\n")
        .trim();
      return { output_markdown: text, tool_calls: trace, tokens_input, tokens_output };
    }

    // Echo the assistant turn back into history, then resolve each tool_use
    messages.push({ role: "assistant", content: resp.content });

    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];
    for (const tu of toolUses) {
      const tool = availableTools.find((t) => t.name === tu.name);
      if (!tool) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id!,
          content: JSON.stringify({ error: `unknown tool ${tu.name}` }),
        });
        continue;
      }
      const { result, duration_ms } = await executeTool(tool, tu.input ?? {}, toolCtx);
      trace.push({ name: tu.name!, input: tu.input ?? {}, result, duration_ms });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id!,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  // Hit MAX_ITERATIONS — return whatever the last assistant text was, plus a note.
  return {
    output_markdown: `_(Agent hit the ${MAX_ITERATIONS}-iteration safety cap. Last partial output not collected.)_`,
    tool_calls: trace,
    tokens_input,
    tokens_output,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
