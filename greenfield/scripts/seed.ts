/**
 * Greenfield seed script
 *
 * Generates ~50 startup opportunities via the Anthropic API and inserts them
 * into Supabase. For each opportunity, also generates a "build brief" — the
 * Markdown prompt a Pro user downloads to scaffold the MVP in Claude Code / Cursor.
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * Required env vars (loaded from .env):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ---------- config ----------------------------------------------------------

const SUPABASE_URL = required("VITE_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const ANTHROPIC_API_KEY = required("ANTHROPIC_API_KEY");

const GEN_MODEL = "claude-sonnet-4-6";
const BRIEF_MODEL = "claude-sonnet-4-6";

// (industry, audience) seed prompts — give the model diverse starting points
const SEED_CONTEXTS: { industry: string; audience: string; count: number }[] = [
  { industry: "Vertical SaaS",                 audience: "B2B",    count: 4 },
  { industry: "Developer Tools",               audience: "B2B",    count: 4 },
  { industry: "Healthcare & Med-Adjacent",     audience: "B2B",    count: 3 },
  { industry: "Climate & Energy",              audience: "B2B",    count: 3 },
  { industry: "Logistics & Supply Chain",      audience: "B2B",    count: 3 },
  { industry: "Construction & Skilled Trades", audience: "B2B",    count: 3 },
  { industry: "Legal & Compliance",            audience: "B2B",    count: 3 },
  { industry: "Education & Workforce",         audience: "B2C",    count: 3 },
  { industry: "Personal Finance",              audience: "B2C",    count: 3 },
  { industry: "Creator Economy",               audience: "B2C",    count: 3 },
  { industry: "Marketplace",                   audience: "B2B2C",  count: 3 },
  { industry: "AI Infrastructure",             audience: "B2B",    count: 3 },
  { industry: "Cybersecurity",                 audience: "B2B",    count: 3 },
  { industry: "Hospitality & Local Services",  audience: "B2B",    count: 3 },
  { industry: "Productized Services",          audience: "B2B",    count: 3 },
];

// ---------- enum vocabularies (kept in one place; used in prompts + filters) -

const VOCAB = {
  model_type: [
    "SaaS", "Marketplace", "Productized Service", "Transactional",
    "Subscription Content", "API / Usage-Based", "Hardware + Software",
  ],
  audience: ["B2B", "B2C", "B2B2C", "Prosumer"],
  revenue_ceiling: [
    "Side income ($0-100k ARR)",
    "Lifestyle ($100k-$1M ARR)",
    "Scale ($1M-$10M ARR)",
    "Venture ($10M+ ARR)",
  ],
  founder_path: ["Bootstrap", "Indie / Side project", "VC-backed", "Acquihire-bound"],
  difficulty: ["Easy", "Medium", "Hard", "Expert"],
  starting_capital: ["Under $1k", "$1k-$10k", "$10k-$100k", "$100k+"],
  time_to_launch: ["Days", "Weeks", "1-3 months", "3+ months"],
  build_stack_hint: ["No-code", "AI-coded (Claude/Cursor/Codex)", "Hybrid", "Traditional engineering"],
  moat: [
    "Distribution", "Network effects", "Proprietary data",
    "Capital intensity", "Regulatory access", "Brand & community",
    "Speed of execution",
  ],
  distribution_play: [
    "SEO content", "Cold outbound", "Partnerships",
    "Paid acquisition", "Community-led", "Marketplace flywheel",
    "Product-led growth", "Direct sales",
  ],
  demand_trend: ["Emerging", "Steady growth", "Accelerating", "Niche but durable"],
};

// ---------- tool definition for structured output --------------------------

const opportunityToolSchema = {
  name: "submit_opportunity",
  description:
    "Submit one fully-specified startup opportunity matching the Greenfield schema.",
  input_schema: {
    type: "object" as const,
    required: [
      "title", "one_liner", "the_gap", "the_play", "market_size_summary",
      "timing_rationale", "build_path", "model_type", "audience", "industry",
      "niche", "revenue_ceiling", "founder_path", "difficulty",
      "starting_capital", "time_to_launch", "build_stack_hint", "moat",
      "distribution_play", "demand_trend",
    ],
    properties: {
      title:               { type: "string", description: "3-6 words. Distinctive, not generic." },
      one_liner:           { type: "string", description: "One sentence, under 160 chars. What it is, who it's for." },
      the_gap:             { type: "string", description: "2-4 sentences. The unmet need / pain. Concrete, not abstract." },
      the_play:            { type: "string", description: "2-4 sentences. The approach, including what's non-obvious about it." },
      market_size_summary: { type: "string", description: "2-3 sentences with at least one dollar figure or unit number." },
      timing_rationale:    { type: "string", description: "2-3 sentences. Why now — a specific shift in tech, regulation, behavior, or cost curve." },
      build_path:          { type: "string", description: "3-5 sentences. Concrete first steps a founder would take in weeks 1-4." },
      model_type:          { type: "string", enum: VOCAB.model_type },
      audience:            { type: "string", enum: VOCAB.audience },
      industry:            { type: "string", description: "Use the industry passed in the user prompt." },
      niche:               { type: "string", description: "2-4 word subcategory." },
      revenue_ceiling:     { type: "string", enum: VOCAB.revenue_ceiling },
      founder_path:        { type: "string", enum: VOCAB.founder_path },
      difficulty:          { type: "string", enum: VOCAB.difficulty },
      starting_capital:    { type: "string", enum: VOCAB.starting_capital },
      time_to_launch:      { type: "string", enum: VOCAB.time_to_launch },
      build_stack_hint:    { type: "string", enum: VOCAB.build_stack_hint },
      moat:                { type: "string", enum: VOCAB.moat },
      distribution_play:   { type: "string", enum: VOCAB.distribution_play },
      demand_trend:        { type: "string", enum: VOCAB.demand_trend },
    },
  },
} as const;

type Opportunity = {
  title: string;
  one_liner: string;
  the_gap: string;
  the_play: string;
  market_size_summary: string;
  timing_rationale: string;
  build_path: string;
  model_type: string;
  audience: string;
  industry: string;
  niche: string;
  revenue_ceiling: string;
  founder_path: string;
  difficulty: string;
  starting_capital: string;
  time_to_launch: string;
  build_stack_hint: string;
  moat: string;
  distribution_play: string;
  demand_trend: string;
};

// ---------- prompts ---------------------------------------------------------

const SYSTEM_PROMPT = `You are an editor at Greenfield, a curated catalogue of startup
opportunities that nobody has built yet. Your job is to generate well-researched,
specific opportunity briefs — never vague trends, never copies of existing companies.

Rules for every opportunity:
- Specific over generic. "Compliance copilot for ISO 27001 audits at Series A-stage
  SaaS companies" beats "AI for compliance."
- Real demand signal. The gap and timing must reference an observable shift —
  a regulation, a cost curve change, a behavioral shift, a new API, etc.
- Honest difficulty. If something needs hardware, capital, or regulatory access,
  say so in 'starting_capital', 'difficulty', and 'moat'.
- No name-checking competitors. Describe the gap, not "like X but for Y."
- Use the controlled vocabulary exactly as provided for enum fields.
- Use the industry value the user provides verbatim.

You will respond by calling the submit_opportunity tool once per opportunity.`;

function userPromptFor(industry: string, audience: string, count: number, alreadySubmitted: string[]): string {
  const avoid = alreadySubmitted.length
    ? `\n\nAlready in the catalogue (do NOT duplicate or restate these): ${alreadySubmitted.join(", ")}.`
    : "";
  return `Generate ${count} distinct opportunities in industry "${industry}" targeting audience "${audience}".
Each must explore a different niche within the industry. Call the submit_opportunity tool ${count} times — once per opportunity.${avoid}`;
}

// ---------- core: generate opportunities ------------------------------------

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function generateOpportunitiesFor(
  ctx: (typeof SEED_CONTEXTS)[number],
  alreadySubmitted: string[],
): Promise<Opportunity[]> {
  const msg = await anthropic.messages.create({
    model: GEN_MODEL,
    max_tokens: 8000,
    system: [
      // cache the long static system prompt across calls
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    tools: [opportunityToolSchema],
    tool_choice: { type: "tool", name: "submit_opportunity" },
    messages: [{ role: "user", content: userPromptFor(ctx.industry, ctx.audience, ctx.count, alreadySubmitted) }],
  });

  const opps: Opportunity[] = [];
  for (const block of msg.content) {
    if (block.type === "tool_use" && block.name === "submit_opportunity") {
      opps.push(block.input as Opportunity);
    }
  }
  return opps;
}

async function generateBuildBrief(opp: Opportunity): Promise<string> {
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
          `Industry: ${opp.industry} / ${opp.niche}\nAudience: ${opp.audience}\n` +
          `Model: ${opp.model_type}\nStack hint: ${opp.build_stack_hint}\n` +
          `Difficulty: ${opp.difficulty}\nTime to launch: ${opp.time_to_launch}\n` +
          `Starting capital: ${opp.starting_capital}\nDistribution: ${opp.distribution_play}`,
      },
    ],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// ---------- main ------------------------------------------------------------

async function main() {
  console.log(`Generating opportunities across ${SEED_CONTEXTS.length} industries…\n`);

  const allTitles: string[] = [];
  const allOpps: Opportunity[] = [];

  for (const ctx of SEED_CONTEXTS) {
    process.stdout.write(`  ${ctx.industry.padEnd(36)} `);
    try {
      const opps = await generateOpportunitiesFor(ctx, allTitles);
      allOpps.push(...opps);
      allTitles.push(...opps.map((o) => o.title));
      console.log(`✓ ${opps.length}`);
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
    }
  }

  console.log(`\nGenerated ${allOpps.length} opportunities. Inserting…`);

  // de-dupe slugs in case the model produced collisions
  const seen = new Set<string>();
  const rows = allOpps
    .map((o, i) => {
      let slug = slugify(o.title);
      if (seen.has(slug)) slug = `${slug}-${i}`;
      seen.add(slug);
      return {
        ...o,
        slug,
        featured: i < 6,
        rank: i,
      };
    });

  const { data: inserted, error: insErr } = await supabase
    .from("opportunities")
    .insert(rows)
    .select("id, title");

  if (insErr) {
    console.error("Insert failed:", insErr.message);
    process.exit(1);
  }
  console.log(`Inserted ${inserted!.length} opportunities.\n`);

  console.log("Generating build briefs (one per opportunity)…");
  const briefRows: { opportunity_id: string; markdown: string; model: string }[] = [];
  for (let i = 0; i < allOpps.length; i++) {
    const opp = allOpps[i];
    const row = inserted![i];
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${allOpps.length}] ${opp.title.slice(0, 50).padEnd(50)} `);
    try {
      const md = await generateBuildBrief(opp);
      briefRows.push({ opportunity_id: row.id, markdown: md, model: BRIEF_MODEL });
      console.log(`✓ ${md.length} chars`);
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
    }
  }

  if (briefRows.length) {
    const { error: briefErr } = await supabase.from("build_briefs").insert(briefRows);
    if (briefErr) {
      console.error("Brief insert failed:", briefErr.message);
      process.exit(1);
    }
    console.log(`\nInserted ${briefRows.length} build briefs.`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
