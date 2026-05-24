/**
 * generate-brief — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/generate-brief
 * Body: { opportunity_id: string, force?: boolean }
 *
 * Caller must be authenticated AND (Pro OR admin).
 * Returns { markdown, cached: boolean }.
 *
 * Caches every generated brief in `build_briefs` so subsequent calls are free.
 * Pass force=true (admin only) to regenerate.
 *
 * Deploy:
 *   supabase functions deploy generate-brief --no-verify-jwt=false
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime, not in tsc
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error — see above
import Anthropic from "npm:@anthropic-ai/sdk@0.40.1";

const BRIEF_MODEL = "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error — Deno global is available at runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // @ts-expect-error — Deno.env at runtime
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // @ts-expect-error
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  // @ts-expect-error
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

  if (!ANTHROPIC_API_KEY) return json({ error: "Server missing ANTHROPIC_API_KEY" }, 500);

  // Auth: use the caller's JWT to read their profile (RLS-safe)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await userClient
    .from("profiles")
    .select("is_pro, is_admin")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!profile || (!profile.is_pro && !profile.is_admin)) {
    return json({ error: "Pro subscription required" }, 403);
  }

  // Parse body
  let body: { opportunity_id?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.opportunity_id) return json({ error: "opportunity_id is required" }, 400);
  const force = !!body.force && profile.is_admin;

  // Service-role client for writes
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // Cache hit?
  if (!force) {
    const { data: cached } = await admin
      .from("build_briefs")
      .select("markdown")
      .eq("opportunity_id", body.opportunity_id)
      .maybeSingle();
    if (cached?.markdown) {
      return json({ markdown: cached.markdown, cached: true });
    }
  }

  // Fetch opportunity to feed the prompt
  const { data: opp, error: oppErr } = await admin
    .from("opportunities")
    .select(
      "title, one_liner, the_gap, the_play, industry, niche, audience, model_type, " +
      "build_stack_hint, difficulty, time_to_launch, starting_capital, distribution_play",
    )
    .eq("id", body.opportunity_id)
    .maybeSingle();
  if (oppErr || !opp) return json({ error: "Opportunity not found" }, 404);

  // Call Anthropic
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: BRIEF_MODEL,
    max_tokens: 4000,
    system:
      "You write implementation briefs that a founder can paste into Claude Code, Cursor, or Codex to scaffold an MVP. " +
      "Output ONLY Markdown — no preamble, no closing remarks. Structure: ## Overview, ## Stack, ## Data model, ## Core flows, ## Week-1 milestones, ## Week-2 to launch, ## Risks & open questions. Be specific and prescriptive.",
    messages: [
      {
        role: "user",
        content:
          `Write a build brief for this opportunity:\n\n` +
          `Title: ${opp.title}\nOne-liner: ${opp.one_liner}\n` +
          `The gap: ${opp.the_gap}\nThe play: ${opp.the_play}\n` +
          `Industry: ${opp.industry} / ${opp.niche ?? ""}\nAudience: ${opp.audience}\n` +
          `Model: ${opp.model_type}\nStack hint: ${opp.build_stack_hint}\n` +
          `Difficulty: ${opp.difficulty}\nTime to launch: ${opp.time_to_launch}\n` +
          `Starting capital: ${opp.starting_capital}\nDistribution: ${opp.distribution_play}`,
      },
    ],
  });

  const markdown = msg.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();

  if (!markdown) return json({ error: "Empty model output" }, 502);

  // Upsert into cache
  const { error: upErr } = await admin
    .from("build_briefs")
    .upsert(
      {
        opportunity_id: body.opportunity_id,
        markdown,
        model: BRIEF_MODEL,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "opportunity_id" },
    );
  if (upErr) {
    // Don't fail the request — still return the generated brief
    console.error("Cache upsert failed:", upErr.message);
  }

  return json({ markdown, cached: false });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
