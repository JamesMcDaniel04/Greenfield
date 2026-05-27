import type { AgentRun, AgentRunStatus, AgentToolCall } from "@/lib/types";

/**
 * Hand-written canned agent outputs for demo mode. Anchored to the
 * `solo-cpa-workflow-os` opportunity so the demo storyline is coherent: one
 * idea claimed, four agents reporting in.
 *
 * Run-agent edge function returns the same shape live; in demo mode the
 * AgentRunDialog short-circuits to one of these.
 */

const NOW = new Date("2026-05-25T00:00:00Z").getTime();

function run(
  role: AgentRun["agent_role"],
  prompt: string,
  output_markdown: string,
  tool_calls: AgentToolCall[],
  minutesAgo: number,
  status: AgentRunStatus = "succeeded",
): AgentRun {
  const started = new Date(NOW - minutesAgo * 60_000).toISOString();
  const completed = new Date(NOW - (minutesAgo - 1) * 60_000).toISOString();
  return {
    id: `demo-${role}-${minutesAgo}`,
    claim_id: "demo-claim-solo-cpa-workflow-os",
    agent_role: role,
    status,
    prompt,
    output_markdown,
    tool_calls,
    model: "claude-sonnet-4-6",
    tokens_input: 4_200,
    tokens_output: 1_800,
    started_at: started,
    completed_at: status === "succeeded" || status === "failed" ? completed : null,
    error: null,
  };
}

const RESEARCH_OUTPUT = `# Landscape brief: Solo-CPA practice management (Q2 2026)

## Market structure
The solo-CPA tooling market splits cleanly into three tiers:
- **Firm-grade PM suites** — Karbon, Canopy, Jetpack Workflow. $50–$120/seat, optimized for 5+ headcount firms.
- **Single-purpose tools** — TaxDome (portals), Liscio (client comms), SmartVault (docs). $30–$80/seat. Most solo CPAs stack 2–3 of these.
- **Generic SaaS glue** — Karbon-replacers running on Notion + Calendly + Dropbox. No data, but every Reddit thread mentions some variant.

## Direct competitors (10 mapped)

| Vendor | Positioning | Solo-CPA signal |
|---|---|---|
| Karbon | "Firm-grade practice mgmt" | Recent price hike triggered LinkedIn pushback (Apr 2026) |
| Canopy | "All-in-one for accountants" | Acquired CPAcharge in 2024 — bundling payments |
| TaxDome | "Client portal first" | Strongest solo traction; expanding into workflows |
| Jetpack Workflow | "Recurring task templates" | Stagnant — 2 features shipped in 12 months |
| Liscio | "Secure client messaging" | Lost ground to TaxDome's portal |
| Financial Cents | "Project mgmt for accountants" | Mid-firm focused; weak solo onboarding |
| Aiwyn | "AI for accounting firms" | Top-down sales motion; not solo-accessible |
| Pixie | "Workflow automation for accountants" | UK-led, expanding to US |
| Truss | "Practice mgmt for tax pros" | Acquired by Bill.com in 2025 — likely sunset |
| Anchor | "Engagement letters + billing" | Adjacent — could bundle |

## Recent M&A and consolidation (24-month window)
- **Bill.com → Truss** (2025) — Bill is rolling Truss into its receivables platform; likely deprecation.
- **Canopy → CPAcharge** (2024) — payments inside the PM stack.
- **Thomson Reuters → SurePrep** (2024) — 1040 automation moved out of standalone reach.
- **Caseware → Adagio** (2025) — Canadian SMB consolidation; signal that mid-firm PM is acquiring solo-focused features.

**Read:** the solo end of the market is being abandoned by the consolidators (Bill, Canopy, Thomson Reuters) as they chase mid-firm ARPU. The wedge is real.

## Industry sizing
- **US public-practice CPAs:** ~89k solos (AICPA member roll, 2025).
- **Tax-prep software TAM (US):** $4.7B in 2025 (IDC), 7.2% CAGR.
- **Practice-mgmt sub-segment:** $620M (Gartner segmentation, 2025) — solo slice estimated at $140M.
- **Forrester** flagged "AI-assisted workflow automation in accounting" as a top-3 2026 SMB-software trend.

## Handoffs
- **GTM:** Karbon-displacement is the only positioning with current demand evidence — anchor the wedge there.
- **Sales:** prospect against firms that flagged Karbon's April 2026 price hike. Public LinkedIn signal — pullable.
- **Marketing:** mention "abandoned by the consolidators" implicitly; do not name Bill.com / Canopy in copy. Cite IDC + AICPA numbers in the founder post.
- **Engineering:** TaxDome is the toughest portal competitor — match magic-link UX before differentiating elsewhere.`;

const GTM_OUTPUT = `# Wedge plan: Solo CPAs running 1040 engagements out of multi-tool sprawl

## ICP (one buyer)
- **Solo CPA** with 80–250 active 1040 clients, billing $300–$1,200 per return.
- Running Karbon or nothing + Calendly + Dropbox + Gmail.
- Diversifying away from 1040 into year-round advisory but bottlenecked on document collection during Jan–Apr.

## Triggering event (why they'd switch now)
The CPA just survived a busy season where 30% of client-portal escalations were "where do I send the W-2 again?". They want one timeline per client, not one inbox per task.

## Initial offer
- $59/mo, billed annually
- Includes: client portal + 1040 timeline + email reminder automation
- No deferred-discount play, no per-client charges, no setup fee

## First channel
Niche newsletters and the r/Bookkeeping / r/Accounting subreddits — those are the only places solo CPAs actually congregate before tax season ramps.

## Week-1 plan
1. Cold-DM 30 solo CPAs on Bluesky + LinkedIn who recently complained about Karbon pricing
2. Offer the first 10 a $1/mo pilot — the price they pay is the right to talk to them monthly
3. Build a stripped landing page focused on "your 1040 timeline, one screen"

## Kill criterion
If 0 of the 30 cold DMs convert to a pilot conversation by end of week, the wedge is wrong. Pivot to bookkeepers (the adjacent persona) before broadening.

## Handoffs
- **Sales:** start with my outbound list (30 CPAs); track which Karbon complaint resonates most.
- **Marketing:** write landing-page copy around "one timeline per client" — keep the Karbon comparison implicit, not direct.
- **Engineering:** scope the 1040 timeline first; defer the 1120 / bookkeeping flows until 10 pilot CPAs say they need them.`;

const SALES_OUTPUT = `# Design-partner list + objection log starter

## 12 target accounts (cold-warm)

| Firm | Headcount | Signal | Hook |
|---|---|---|---|
| Smith & Hanks CPA, Austin | Solo | Posted about Karbon price hike on LinkedIn 4 days ago | "Your timeline gripe was the third one I read this week — happy to share what 10 others are switching to" |
| RiverlineTax, Boulder | Solo | Asked in r/Bookkeeping "what do you use to collect docs?" | "Saw your r/Bookkeeping post — here's the timeline we built for that exact problem" |
| Lerner Accounting, Brooklyn | Solo | Liked our launch tweet | "Noticed you've been following Greenfield — interested in a 15-min demo?" |
| (+ 9 more from the GTM agent's research) |  |  |  |

## Outreach sequence (5-touch, 9 days)

**Day 0 — LinkedIn message** (under 70 words, references the specific public signal)
**Day 2 — Email** (one-paragraph case for the 1040 timeline, no attachments)
**Day 4 — Reply with proof** (single screenshot of the timeline)
**Day 7 — Soft offer** ("$1/mo for 6 months in exchange for monthly feedback")
**Day 9 — Polite close** ("Closing the loop — let me know if the timing's off")

## Objection log (priming the response)

1. **"I already pay for Karbon."** → "Most pilot CPAs cancel Karbon at month 3. We migrate your client list for free."
2. **"I don't have time during tax season."** → "Setup takes 18 minutes. The first benefit shows up the day after."
3. **"My clients are non-technical."** → "Magic-link portal — no password, no app to download."

## Handoffs
- **GTM:** confirm the $59/mo price holds against the Karbon "we'll match" defense.
- **Marketing:** I'll need a 1-pager I can attach in Day 2 emails — same shape as the landing page.
- **Engineering:** I'm assuming the magic-link portal works on day 1. Flag if that's slipping.`;

const MARKETING_OUTPUT = `# Messaging house + week-1 launch asset pack

## Core positioning (one sentence)
A workspace for solo CPAs that organises the year around the **client engagement**, not the firm's internal hierarchy — so every document, deadline, and reminder lives on one timeline per client.

## Three-line story (use everywhere)
1. **The gap:** Solo CPAs run their practice on Karbon + Dropbox + Gmail + Calendly + Excel — five tools that don't share a timeline.
2. **The play:** One screen per client. Documents, deadlines, sign-offs, and reminders on a single timeline. AI handles the grunt work; you stay the operator.
3. **The pull:** $59/mo, annual, no per-client charges, no setup fee.

## Week-1 assets

- **Landing page hero**
  > **One timeline per client. The rest of your tools, retired.**
  > A practice-management workspace for solo CPAs, built around the 1040 engagement first.
- **Product screenshot (caption)** — "Day 1 of a 1040 engagement: document checklist, client reminders, your sign-off — one screen."
- **Founder LinkedIn post (90 words)** — anchored to "I built this because my dad's CPA still emails him a PDF checklist every January."
- **Tweet thread (5 tweets)** — opens with the Karbon price-hike screenshot, closes with the pilot link.
- **Reddit comment template** — for r/Bookkeeping / r/Accounting threads. Helpful first, link second.
- **Cold email v1** — three paragraphs, no logo, one CTA ("a 20-minute Loom walkthrough").

## Distribution channels (in order)
1. Niche newsletter sponsorships ($500-$1,500 per send)
2. Founder-led posts on LinkedIn + Bluesky
3. Reddit (manual, not automated; ban risk if you sound salesy)
4. Cold outbound (Sales agent's list)
5. SEO content — defer until pilot 5+

## Handoffs
- **Sales:** I'll have the 1-pager ready by Wednesday for the Day-2 emails.
- **Engineering:** product screenshot needs the magic-link portal in shot — confirm it ships in the demo build by Friday.
- **GTM:** pulling the Karbon comparison out of the hero copy per your "keep it implicit" note.`;

const ENG_OUTPUT = `# MVP scope + week-1 build sequence

## What ships in the MVP (everything else is out of scope)

1. **Auth + org** — Supabase email/password + Google. Each CPA is a one-person org.
2. **Clients CRUD** — name, email, tags, status. No imports yet.
3. **1040 engagement** — one engagement type only. Pre-seeded timeline of 11 steps.
4. **Document upload** — Supabase Storage, magic-link client portal.
5. **Email reminders** — Postmark, three templates (request docs, nudge, sign-off ready).
6. **Stripe Billing** — single $59/mo annual subscription.

## What's NOT in MVP
- Multiple engagement types (1120, bookkeeping) — every conversation defers these.
- QuickBooks integration — comes back via the GTM channel scorecard.
- Native mobile app.
- Document OCR / auto-categorisation.
- Team seats (we're solo-first).

## Stack
- **Frontend:** Next.js 14, Tailwind, shadcn/ui (matches the Greenfield brief).
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions). One service.
- **Email:** Postmark, server-only.
- **Payments:** Stripe Billing checkout link (no webhook flow in v1 — manual upgrade ops for first 50 customers).

## Data model (Postgres)
\`\`\`sql
clients (id, org_id, name, email, status, created_at)
engagements (id, client_id, type, status, opened_at)
engagement_steps (id, engagement_id, ordinal, kind, due_at, completed_at)
documents (id, engagement_id, storage_path, doc_type, uploaded_by, created_at)
portal_tokens (token, engagement_id, expires_at)
\`\`\`

## Instrumentation (so the rest of the team can see whether the wedge works)
- Time-to-first-document-uploaded per engagement
- Reminder open rate per template
- Days from engagement open → all-documents-collected

## Week-1 milestones
| Day | Ship |
|---|---|
| Mon | Auth + clients CRUD + Stripe link |
| Tue | 1040 engagement creation + seeded timeline |
| Wed | Document upload + magic-link portal |
| Thu | Email reminder loop (Postmark) |
| Fri | Two pilot CPAs end-to-end on staging |

## Handoffs
- **Sales:** magic-link portal will be live by Friday — confirmed for the Day 2 emails.
- **Marketing:** product screenshot will hit a clean staging account on Wednesday.
- **GTM:** instrumentation above gives you the channel scorecard inputs by week 2.`;

export const SAMPLE_AGENT_RUNS: AgentRun[] = [
  run(
    "research",
    "Map the competitive landscape, recent acquisitions, and industry sizing for solo-CPA practice management.",
    RESEARCH_OUTPUT,
    [
      {
        name: "landscape_competitors",
        input: { space: "solo CPA practice management software", depth: 12 },
        result: { candidates: 10 },
        duration_ms: 2_140,
      },
      {
        name: "find_acquisitions",
        input: { sector: "accounting practice management", since_year: 2024 },
        result: { deals: 4 },
        duration_ms: 1_780,
      },
      {
        name: "find_industry_reports",
        input: { topic: "tax practice management software US", fetch_top: true },
        result: { reports: 6, fetched_top: true },
        duration_ms: 3_220,
      },
    ],
    44,
  ),
  run(
    "gtm",
    "Give me the first wedge plan: ICP, offer, and one acquisition lane I can run this week.",
    GTM_OUTPUT,
    [
      {
        name: "read_opportunity_brief",
        input: {},
        result: { ok: true, summary: "Read 1840 chars of opportunity context." },
        duration_ms: 410,
      },
      {
        name: "read_signals",
        input: { limit: 10 },
        result: { count: 4, newest_days_ago: 8 },
        duration_ms: 220,
      },
      {
        name: "web_search",
        input: { query: "Karbon pricing complaints solo CPA 2026" },
        result: { results: 5, top_url: "https://www.reddit.com/r/Accounting/comments/abc123/" },
        duration_ms: 1_180,
      },
    ],
    32,
  ),
  run(
    "sales",
    "Build me a 12-account design-partner list and an outreach sequence I can start tomorrow.",
    SALES_OUTPUT,
    [
      {
        name: "read_opportunity_brief",
        input: {},
        result: { ok: true, summary: "Read opportunity + classification." },
        duration_ms: 380,
      },
      {
        name: "web_search",
        input: { query: "solo CPAs LinkedIn Karbon" },
        result: { results: 8, top_url: "https://www.linkedin.com/in/example-cpa/" },
        duration_ms: 1_410,
      },
      {
        name: "fetch_url",
        input: { url: "https://www.linkedin.com/in/example-cpa/" },
        result: { status: 200, length: 4_200, truncated: false },
        duration_ms: 920,
      },
      {
        name: "save_note",
        input: { kind: "handoff", title: "GTM → Sales: Karbon pricing defense" },
        result: { saved: true },
        duration_ms: 18,
      },
    ],
    24,
  ),
  run(
    "marketing",
    "I need a messaging house and a week-1 launch asset pack — landing page copy, founder post, cold email, reddit reply template.",
    MARKETING_OUTPUT,
    [
      {
        name: "read_opportunity_brief",
        input: {},
        result: { ok: true },
        duration_ms: 350,
      },
      {
        name: "read_signals",
        input: { limit: 5 },
        result: { count: 4, themes: ["consolidation", "burnout", "compliance"] },
        duration_ms: 240,
      },
    ],
    18,
  ),
  run(
    "engineering",
    "Scope the MVP. What ships week 1, what's deferred, and what's the minimum data model?",
    ENG_OUTPUT,
    [
      {
        name: "read_opportunity_brief",
        input: {},
        result: { ok: true, has_build_brief: true },
        duration_ms: 400,
      },
      {
        name: "save_note",
        input: { kind: "decision", title: "MVP: 1040 only, defer 1120 and bookkeeping" },
        result: { saved: true },
        duration_ms: 14,
      },
    ],
    11,
  ),
];

export function sampleRunsFor(
  agentRole: AgentRun["agent_role"],
  claimSlug: string,
): AgentRun[] {
  if (claimSlug !== "solo-cpa-workflow-os") return [];
  return SAMPLE_AGENT_RUNS.filter((r) => r.agent_role === agentRole);
}

/**
 * Generate a fresh synthetic run by reusing the canned output for the role.
 * Used by the demo-mode "Run agent" button so the UX has end-to-end motion.
 */
export function makeDemoRun(args: {
  agent_role: AgentRun["agent_role"];
  claim_id: string;
  prompt: string;
}): AgentRun {
  const canned = SAMPLE_AGENT_RUNS.find((r) => r.agent_role === args.agent_role);
  const now = new Date().toISOString();
  return {
    id: `demo-${Date.now()}-${args.agent_role}`,
    claim_id: args.claim_id,
    agent_role: args.agent_role,
    status: "succeeded",
    prompt: args.prompt,
    output_markdown: canned?.output_markdown ?? "_(Demo response unavailable for this role.)_",
    tool_calls: canned?.tool_calls ?? [],
    model: "claude-sonnet-4-6 (demo)",
    tokens_input: canned?.tokens_input ?? 0,
    tokens_output: canned?.tokens_output ?? 0,
    started_at: now,
    completed_at: now,
    error: null,
  };
}
