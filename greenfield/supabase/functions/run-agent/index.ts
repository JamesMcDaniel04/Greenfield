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

const VALID_ROLES = new Set(["gtm", "sales", "marketing", "engineering"]);

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
  let body: { claim_id?: string; agent_role?: string; prompt?: string };
  try { body = await req.json(); } catch { return json({ error: "INVALID_INPUT" }, 400); }
  if (!body.claim_id || !body.agent_role || !body.prompt) {
    return json({ error: "INVALID_INPUT", details: "claim_id, agent_role, and prompt are required" }, 400);
  }
  if (!VALID_ROLES.has(body.agent_role)) {
    return json({ error: "INVALID_INPUT", details: "agent_role must be gtm | sales | marketing | engineering" }, 400);
  }

  // Ownership: caller must belong to the claim's team
  const { data: claim, error: claimErr } = await userClient
    .from("idea_claims")
    .select("id, opportunity_id, team_id, status, opportunities!inner(slug, title, one_liner, audience, industry, niche, model_type, distribution_play, demand_trend, founder_path, difficulty, starting_capital, time_to_launch)")
    .eq("id", body.claim_id)
    .maybeSingle();
  if (claimErr || !claim) return json({ error: "CLAIM_NOT_FOUND" }, 404);
  if (claim.status !== "active") return json({ error: "CLAIM_NOT_ACTIVE" }, 409);

  // Service-role client for writes the user can't perform via RLS
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Insert the run row (status=running) so the UI can show it immediately
  const { data: runRow, error: runErr } = await admin
    .from("agent_runs")
    .insert({
      claim_id: body.claim_id,
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
      agent_role: body.agent_role as "gtm" | "sales" | "marketing" | "engineering",
      prompt: body.prompt,
      claim,
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

const ROLE_PERSONAS: Record<string, { name: string; mission: (c: ClaimShape) => string }> = {
  gtm: {
    name: "GTM Agent",
    mission: (c) => `Define the initial market wedge for ${c.opportunities.title} so the founder has one segment, one promise, and one launch motion to run in the next ${c.opportunities.time_to_launch.toLowerCase()}.`,
  },
  sales: {
    name: "Sales Agent",
    mission: (c) => c.opportunities.audience.toLowerCase() === "b2b"
      ? `Turn ${c.opportunities.title} into live pipeline by recruiting design partners and revenue conversations inside ${(c.opportunities.niche ?? c.opportunities.industry).toLowerCase()}.`
      : `Turn ${c.opportunities.title} into monetizable demand through partnerships, waitlist conversion, and revenue-bearing customer conversations.`,
  },
  marketing: {
    name: "Marketing Agent",
    mission: (c) => `Build a repeatable narrative for ${c.opportunities.title} so every landing page, thread, and proof asset reinforces the same ${c.opportunities.distribution_play.toLowerCase()} wedge.`,
  },
  engineering: {
    name: "Engineering Agent",
    mission: (c) => `Ship the smallest viable version of ${c.opportunities.title} that proves the core workflow for ${c.opportunities.audience.toLowerCase()} buyers without broadening into a suite.`,
  },
};

type ClaimShape = {
  id: string;
  opportunity_id: string;
  opportunities: {
    slug: string;
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
};

function buildSystemPrompt(role: string, claim: ClaimShape): string {
  const persona = ROLE_PERSONAS[role];
  const opp = claim.opportunities;
  return [
    `You are the ${persona.name} for the startup idea "${opp.title}".`,
    "",
    `Mission: ${persona.mission(claim)}`,
    "",
    `Opportunity context (anchor every recommendation to these facts):`,
    `- One-liner: ${opp.one_liner}`,
    `- Audience: ${opp.audience} · Industry: ${opp.industry} · Niche: ${opp.niche ?? opp.industry}`,
    `- Business model: ${opp.model_type} · Distribution: ${opp.distribution_play}`,
    `- Founder path: ${opp.founder_path} · Capital: ${opp.starting_capital} · Launch window: ${opp.time_to_launch}`,
    `- Difficulty: ${opp.difficulty} · Demand trend: ${opp.demand_trend}`,
    "",
    "Tool use:",
    "- Call `read_opportunity_brief` first if you need the long-form briefing, gap, play, market, timing, or build path.",
    "- Call `read_signals` to see cited research already collected.",
    "- Call `web_search` for fresh external info — only when internal context is insufficient.",
    "- Call `fetch_url` to read a specific source web_search surfaced.",
    "- Call `save_note` to record explicit handoffs to the other agents or to bookmark a finding.",
    role === "gtm"         ? "- Call `find_competitors` when you need a competitor list for positioning or pricing." : "",
    role === "sales"       ? "- Call `find_companies` when you need a target-account list — falls back to web_search if Apollo isn't configured." : "",
    role === "marketing"   ? "- Call `keyword_volume` to ground content/SEO bets in real demand numbers." : "",
    role === "engineering" ? "- Call `search_github` to find open-source incumbents or reference implementations before designing." : "",
    "",
    "Output rules:",
    "- Return concrete work product, not generic advice.",
    "- Prefer bullets, tables, short scripts, and named next actions the founder can ship this week.",
    "- Cite any external claim with its source URL inline.",
    "- End with a `## Handoffs` section listing follow-ups for the other three agents (GTM / Sales / Marketing / Engineering), each as a one-line directive.",
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
  agent_role: "gtm" | "sales" | "marketing" | "engineering";
  prompt: string;
  claim: ClaimShape;
  // @ts-expect-error — Supabase service-role client typing is fine at runtime
  admin: ReturnType<typeof createClient>;
}): Promise<LoopResult> {
  const anthropic = new Anthropic({ apiKey: args.anthropicKey });
  const systemPrompt = buildSystemPrompt(args.agent_role, args.claim);
  // @ts-expect-error — Deno global at runtime
  const env = Deno.env;
  const toolCtx: ToolContext = {
    claim_id: args.claim.id,
    opportunity_id: args.claim.opportunity_id,
    opportunity_slug: args.claim.opportunities.slug,
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
