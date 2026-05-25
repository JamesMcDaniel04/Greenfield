import type { Opportunity } from "@/lib/types";

/**
 * Demo-mode fixtures. These are shown when Supabase isn't configured
 * (no .env), so the UI is fully clickable without any backend setup.
 *
 * All opportunities below are original, written by hand for demo purposes.
 */

function makeOpp(o: Omit<Opportunity, "id" | "created_at" | "updated_at" | "cover_image_url"> & { id?: string }): Opportunity {
  const now = new Date("2026-04-01T00:00:00Z").toISOString();
  return {
    id: o.id ?? o.slug,
    cover_image_url: null,
    created_at: now,
    updated_at: now,
    ...o,
  };
}

export const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  makeOpp({
    slug: "solo-cpa-workflow-os",
    title: "Workflow OS for solo CPAs",
    one_liner: "A practice-management layer for one-person accounting firms that absorbs the 30+ tools they're cobbling together today.",
    the_gap: "Solo CPAs (~60k in the US) run their entire practice on a Frankenstein of QuickBooks, Karbon, Calendly, Dropbox, and shared inboxes. Off-the-shelf practice management was built for 50-seat firms and feels insulting at 1 seat. The annualised tax-prep burnout is real and the churn rate to packaged services like 1-800Accountant keeps growing.",
    the_play: "A single workspace built around the solo's actual unit of work — the client engagement. Document collection, deadlines, sign-offs, and billing live on one timeline per client. AI does the busy work (categorising statements, drafting client-portal reminders) but the CPA stays the operator. Price under what they pay for Calendly + Karbon combined.",
    market_size_summary: "~60k solo CPAs in the US plus another ~40k bookkeepers operating like solos. At $59/mo blended ARPU, the addressable revenue is ~$70M ARR — small enough that the incumbents won't bother and large enough to be a real business.",
    timing_rationale: "Two compounding shifts: (1) document-understanding models are finally accurate enough to categorise messy bank exports without supervision, and (2) the post-COVID rise in solo-practitioner firms (up 18% since 2021) is creating a buyer cohort that didn't exist at scale before.",
    build_path: "Week 1-2: scope a single jobs-to-be-done — the 1040 engagement — and build a working timeline for that one workflow. Week 3-4: paid pilot with 10 CPAs at $1/mo (yes, $1) to earn the right to ship monthly. Month 2: open up document automation. Resist the temptation to ship 'a CRM' — that's where every competitor died.",
    model_type: "SaaS",
    audience: "B2B",
    industry: "Vertical SaaS",
    niche: "Accounting practice management",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Medium",
    starting_capital: "$1k-$10k",
    time_to_launch: "1-3 months",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    moat: "Brand & community",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    featured: true,
    rank: 1,
  }),

  makeOpp({
    slug: "legacy-parts-marketplace",
    title: "Marketplace for legacy industrial parts",
    one_liner: "An eBay for obsolete factory components — the bushings, sensors, and proprietary boards that keep 30-year-old production lines alive.",
    the_gap: "When a part on a 1996 packaging line fails, plant managers spend days calling brokers and trawling forums. The OEM is gone, the replacement is back-ordered six months, and downtime costs $40k/hour. Today the 'market' is private Rolodexes and a handful of dusty broker websites.",
    the_play: "Aggregate the supply side first — buy from estate sales, plant decommissionings, and small brokers — then list with verified compatibility data. Charge a take-rate on the sell side. Trust is the entire moat: photos, serial validation, return guarantees that brokers can't match.",
    market_size_summary: "MRO (maintenance, repair, operations) spending in US manufacturing is ~$50B/year. The 'obsolete and hard-to-source' slice is informally estimated at 3-5% — call it $1.5B of GMV up for grabs.",
    timing_rationale: "Boomer-run brokers are retiring without succession plans, freeing up supply. Meanwhile, supply-chain anxiety post-2022 made every plant manager willing to pay a premium for in-stock parts.",
    build_path: "Don't build a marketplace; build a brokerage. Buy and resell from week one to learn what actually sells. Listings, payments, escrow can wait until you have $50k of revenue proving the demand is real. Most marketplaces die from supply, not demand.",
    model_type: "Marketplace",
    audience: "B2B",
    industry: "Logistics & Supply Chain",
    niche: "Industrial MRO",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Hard",
    starting_capital: "$10k-$100k",
    time_to_launch: "3+ months",
    build_stack_hint: "Hybrid",
    moat: "Proprietary data",
    distribution_play: "Cold outbound",
    demand_trend: "Niche but durable",
    featured: true,
    rank: 2,
  }),

  makeOpp({
    slug: "synthetic-test-data-api",
    title: "Synthetic test-data API for regulated industries",
    one_liner: "Generate compliant, realistic test data on demand — for HIPAA, PCI, and GDPR engineering teams who can't safely use production snapshots.",
    the_gap: "Every regulated engineering team has the same problem: prod data can't leave prod, but staging needs realistic data to be useful. Today they either build a fragile in-house anonymiser or test against toy data and ship bugs that only appear in production shapes.",
    the_play: "An API that takes a schema (or a sample) and returns realistic-looking but fully synthetic rows that preserve statistical shape, foreign-key integrity, and edge cases. Usage-based pricing. Charge per million rows generated.",
    market_size_summary: "Test-data-management is a ~$1B category dominated by enterprise tools (Delphix, Tonic) priced for the Fortune 500. The Series B-to-D tier — call it 8k companies — has the pain and no good answer at their price point.",
    timing_rationale: "LLMs hit the quality bar for realistic categorical generation in mid-2024. The state-data-residency wave (NY, CA, EU) is making 'just use prod' increasingly illegal.",
    build_path: "Start with three schemas — Stripe, FHIR, and a generic Postgres dump — and a CLI. Free tier capped at 100k rows/mo to seed the dev-side adoption. Sell to the team's security lead, not the engineer.",
    model_type: "API / Usage-Based",
    audience: "B2B",
    industry: "Developer Tools",
    niche: "Test data infrastructure",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "VC-backed",
    difficulty: "Hard",
    starting_capital: "$10k-$100k",
    time_to_launch: "1-3 months",
    build_stack_hint: "Traditional engineering",
    moat: "Proprietary data",
    distribution_play: "Product-led growth",
    demand_trend: "Accelerating",
    featured: true,
    rank: 3,
  }),

  makeOpp({
    slug: "shift-worker-schedule-control",
    title: "Schedule-control app for hourly workers",
    one_liner: "A consumer app that lets hourly workers swap, drop, and predict shifts across all the apps their employer makes them juggle.",
    the_gap: "The average multi-job hourly worker juggles 3-5 employer apps (Kronos, Deputy, 7shifts, etc.). Trading shifts is a group-chat ordeal. The worker has zero leverage and zero visibility into what their schedule will look like next week.",
    the_play: "A worker-side aggregator that connects (officially or via scraping) to the major employer scheduling apps, then unifies schedule view, shift-swap requests, and 'I want more hours' signaling. Free for workers, monetise via job-matching to higher-paying employers.",
    market_size_summary: "~78M hourly workers in the US. Even at $0 ARPU and a 1% conversion to a $5 referral fee on each shift swap or job match, the bottoms-up unit economics work at modest scale.",
    timing_rationale: "Predictive-scheduling laws (NYC, SF, Oregon, Chicago) are creating regulatory tailwind that punishes employers who don't publish schedules in advance — which is exactly the data this app needs.",
    build_path: "Pick ONE city and ONE employer (e.g. Starbucks in Seattle) to start. Build the connector, the swap UX, and a Discord for the first 200 workers. Geographic expansion second, employer expansion second-and-a-half.",
    model_type: "Transactional",
    audience: "B2C",
    industry: "Education & Workforce",
    niche: "Workforce tooling",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "VC-backed",
    difficulty: "Hard",
    starting_capital: "$10k-$100k",
    time_to_launch: "3+ months",
    build_stack_hint: "Traditional engineering",
    moat: "Network effects",
    distribution_play: "Community-led",
    demand_trend: "Accelerating",
    featured: false,
    rank: 4,
  }),

  makeOpp({
    slug: "soc2-readiness-as-a-service",
    title: "SOC 2 readiness — done for you, in 30 days",
    one_liner: "A productized service that takes a Series A-stage startup from zero policies to audit-ready in a single month, flat fee.",
    the_gap: "Compliance automation tools (Vanta, Drata) sell to companies that already know what they're doing. The startup that just landed its first enterprise lead and needs SOC 2 next quarter doesn't want a dashboard — they want someone to do it for them.",
    the_play: "Hire two ex-compliance-consultants part time. Sell a 30-day engagement for $15k flat. You build the policies, you run the gap assessment, you sit through the audit. Use Vanta or Drata internally as a tool. Margin is 60%+ at scale.",
    market_size_summary: "~5,000 US startups raise Series A each year. Maybe 20% (1,000) need SOC 2 within 18 months. Capture 5% (50/year) at $15k each = $750k ARR with two people. Cap is real but the path there is concrete.",
    timing_rationale: "Procurement teams at mid-market buyers have institutionalised SOC 2 as a checklist item — even for 5-person AI startups. The pain has moved from 'someday' to 'this quarter'.",
    build_path: "Sign your first contract before you write any code (no code is needed — you'll use Vanta + Google Docs). Build a Notion playbook from contract 1 and refine through contract 5. Hire your first delivery person at contract 8.",
    model_type: "Productized Service",
    audience: "B2B",
    industry: "Productized Services",
    niche: "Compliance & security",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Easy",
    starting_capital: "Under $1k",
    time_to_launch: "Weeks",
    build_stack_hint: "No-code",
    moat: "Speed of execution",
    distribution_play: "Partnerships",
    demand_trend: "Steady growth",
    featured: true,
    rank: 5,
  }),

  makeOpp({
    slug: "residential-battery-aggregator",
    title: "Residential battery virtual power plant",
    one_liner: "Aggregate the home batteries your neighbours already bought into a grid-scale asset, and pay them when the utility buys back power.",
    the_gap: "Tens of thousands of homes have Tesla Powerwalls and similar units sitting at 95% charge most days. Utilities will pay for that storage capacity during peak events, but the homeowner has no way to participate alone.",
    the_play: "Build software that orchestrates discharge across thousands of homes, sign a power purchase agreement with one utility, and revenue-share with the homeowners (typically $1,000-2,500/year per home). Spin up one geography at a time.",
    market_size_summary: "~700k Powerwall-equivalent units in the US, growing 50%+ YoY. If even 5% participate at $1,500/year net revenue to the operator, that's $50M ARR ceiling per platform.",
    timing_rationale: "FERC Order 2222 (now in implementation) forces wholesale grid operators to let distributed assets bid into the same markets as utility-scale generation. This regulatory unlock didn't exist 24 months ago.",
    build_path: "Start in Texas — the most liberal market for distributed energy resources. Sign a letter of intent with a retail electricity provider before writing any code. The hard part is the utility contracts, not the software.",
    model_type: "Hardware + Software",
    audience: "B2B2C",
    industry: "Climate & Energy",
    niche: "Distributed energy resources",
    revenue_ceiling: "Venture ($10M+ ARR)",
    founder_path: "VC-backed",
    difficulty: "Expert",
    starting_capital: "$100k+",
    time_to_launch: "3+ months",
    build_stack_hint: "Traditional engineering",
    moat: "Regulatory access",
    distribution_play: "Partnerships",
    demand_trend: "Accelerating",
    featured: false,
    rank: 6,
  }),

  makeOpp({
    slug: "prompt-observability-for-pms",
    title: "Prompt observability for non-engineers",
    one_liner: "LangSmith-grade visibility into your AI features, but the UI is built for the PM and the support lead — not the ML engineer.",
    the_gap: "Every AI product has two audiences for observability: engineers (well served by Langfuse, LangSmith, Arize) and everyone else (PMs, support, ops) who currently get nothing and have to ping an engineer to ask 'why did the bot do X?'.",
    the_play: "Reuse the existing OpenTelemetry-style traces but visualise them as a 'conversation review' UX — searchable, taggable, annotatable by non-engineers. Sell to the team that's already paying $200/mo for Langfuse, as the 'business user' seat.",
    market_size_summary: "Conservative TAM: every company on Langfuse/LangSmith (~10k orgs) will add 2-5 non-engineer seats. At $40/seat/mo that's $10-25M ARR with a focused wedge.",
    timing_rationale: "AI feature ownership is shifting from ML teams to product teams in 2025-26. The product owner needs the same data the engineer has, in a form they can actually consume.",
    build_path: "Be opinionated about one integration first — Langfuse. Build a Chrome extension that overlays your UX on their dashboard, validate demand, then move standalone. Saves you a year of building infra you don't need.",
    model_type: "SaaS",
    audience: "B2B",
    industry: "AI Infrastructure",
    niche: "LLM observability",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Medium",
    starting_capital: "$1k-$10k",
    time_to_launch: "1-3 months",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    moat: "Speed of execution",
    distribution_play: "Product-led growth",
    demand_trend: "Emerging",
    featured: false,
    rank: 7,
  }),

  makeOpp({
    slug: "rare-disease-trial-matchmaker",
    title: "Trial matchmaker for rare-disease patients",
    one_liner: "A patient-side platform that surfaces clinical trials a person actually qualifies for, with the steps to apply — for the ~30M Americans living with a rare disease.",
    the_gap: "Clinicaltrials.gov is a database, not a product. Patients with rare diseases (each with under 200k US sufferers) often qualify for trials but never find out — and trial sponsors fail enrollment at brutal rates (~80% of trials miss their target dates).",
    the_play: "Patient-facing free tool that takes a diagnosis, location, and a short questionnaire, and returns matched trials with apply-now flows. Monetize by selling qualified-lead packages to sponsors (a model already validated by Antidote and similar — but with a wedge into rare diseases specifically).",
    market_size_summary: "~$8B is spent each year on clinical-trial patient recruitment. The rare-disease slice (where matching is hardest) is ~$1.5B. Lead-gen pricing per enrolled patient ranges $500-$5,000 depending on phase and indication.",
    timing_rationale: "FDA's increased focus on rare-disease drug development (10x in approvals since 2010) has created a recruitment crunch — and patient advocacy communities are now organised enough on Facebook/Discord that channel access is real.",
    build_path: "Pick ONE rare disease (e.g. POTS, FSHD, or NMOSD) with an active patient community. Build the matcher for that one. Get 1,000 patients in, prove the lead-gen unit economics with ONE sponsor, then expand.",
    model_type: "Marketplace",
    audience: "B2B2C",
    industry: "Healthcare & Med-Adjacent",
    niche: "Clinical trial recruitment",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "VC-backed",
    difficulty: "Hard",
    starting_capital: "$100k+",
    time_to_launch: "3+ months",
    build_stack_hint: "Traditional engineering",
    moat: "Network effects",
    distribution_play: "Community-led",
    demand_trend: "Accelerating",
    featured: false,
    rank: 8,
  }),

  makeOpp({
    slug: "permit-tracker-for-trades",
    title: "Permit tracker for residential contractors",
    one_liner: "End the call-the-clerk's-office loop: a single dashboard tracking every permit a contractor has pending across every municipality they work in.",
    the_gap: "Residential GCs and electricians work across dozens of municipalities, each with its own portal, paperwork, and inspection scheduling. The status of any given permit is opaque until they call. Average permit cycle drags 30-50% longer than it should because nobody is actively pushing.",
    the_play: "Scrape the (publicly accessible) municipal permit portals daily, surface status changes, push notifications when inspections are scheduled, and let the contractor reply to municipal requests from one place. Charge per active permit or flat per seat.",
    market_size_summary: "~700k residential contractors in the US averaging 30 active permits each. At $30/mo per seat, the natural-monopoly ceiling is ~$250M ARR if execution is clean.",
    timing_rationale: "Most municipalities switched to digital permit portals in 2020-2023 (COVID forcing function). The portals are uniformly bad but they exist — making scraping possible at last.",
    build_path: "Pick a metro (e.g. Austin) and the top 3 municipalities by permit volume. Onboard 20 contractors. Don't try to build a CRM. The product is the dashboard and the notifications — period.",
    model_type: "SaaS",
    audience: "B2B",
    industry: "Construction & Skilled Trades",
    niche: "Permit & licensing workflow",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Medium",
    starting_capital: "$1k-$10k",
    time_to_launch: "1-3 months",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    moat: "Proprietary data",
    distribution_play: "Cold outbound",
    demand_trend: "Steady growth",
    featured: false,
    rank: 9,
  }),

  makeOpp({
    slug: "podcast-clip-licensing",
    title: "Clip-licensing platform for podcasters",
    one_liner: "Let podcasters charge $5-50 per use when brands, journalists, or TikTokers want to embed a 30-second clip of their show.",
    the_gap: "Podcasters give away the most quotable 60 seconds of their show every time someone TikToks it — and they have no idea who's using it. Brands and journalists actually want to license clips properly but have no infrastructure to do so.",
    the_play: "Upload episode → automatic clip detection + transcript → public, embeddable library where each clip has a 'license this clip' button. Take 15% of every transaction. Free tier for creators, paid tier with analytics.",
    market_size_summary: "~5M active podcasters globally. Even 1% adoption at $200/year ARPU is $10M ARR — modest but achievable, with optional upside from clip-licensing GMV.",
    timing_rationale: "Audio-AI for speaker diarisation, transcript-aligned clipping, and 'highlight detection' all crossed the quality threshold in 2024. The friction that prevented this product is gone.",
    build_path: "Build for one specific niche first — true-crime, or business podcasts. Onboard 50 shows with hands-on white glove. Watch the licensing transactions for 60 days before opening it up.",
    model_type: "Transactional",
    audience: "B2C",
    industry: "Creator Economy",
    niche: "Podcast tooling",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    founder_path: "Indie / Side project",
    difficulty: "Medium",
    starting_capital: "$1k-$10k",
    time_to_launch: "Weeks",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    moat: "Brand & community",
    distribution_play: "Community-led",
    demand_trend: "Emerging",
    featured: false,
    rank: 10,
  }),

  makeOpp({
    slug: "hvac-cert-prep-platform",
    title: "Certification-prep platform for HVAC techs",
    one_liner: "A mobile-first study + practice-exam platform for HVAC certifications (EPA 608, NATE, journeyman) — the certifications themselves gate $10/hr to $30/hr wage jumps.",
    the_gap: "There are 350k HVAC techs in the US, and the gap between certified and uncertified is measured in dollars per hour. The current options are 1990s-era PDF textbooks and a few clunky desktop test-prep tools. No mobile-first option exists.",
    the_play: "Tight, mobile-first, gamified study + simulated exams for the top 5 HVAC certifications. $29/mo or $99 one-time. Distribution via the existing HVAC-tech YouTube and TikTok creators — they desperately need products to recommend to their audience.",
    market_size_summary: "Vocational test-prep is a fragmented $2B+ market and HVAC is one of the larger underserved verticals. At 5% capture of the 350k US population at $99 one-time per cert, ~$1.7M per cert is achievable.",
    timing_rationale: "The trades skill-shortage narrative is mainstream now — boomer techs are retiring at 2x the rate of replacement, and pay is finally rising. Demand for cert prep is a leading indicator.",
    build_path: "Don't build a course platform. Build a question bank + spaced-repetition engine + simulated exams for ONE cert (EPA 608). 500 paying users on cert 1 before you start cert 2.",
    model_type: "Subscription Content",
    audience: "B2C",
    industry: "Education & Workforce",
    niche: "Vocational certification",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    founder_path: "Indie / Side project",
    difficulty: "Easy",
    starting_capital: "Under $1k",
    time_to_launch: "Weeks",
    build_stack_hint: "No-code",
    moat: "Distribution",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    featured: false,
    rank: 11,
  }),

  makeOpp({
    slug: "smb-freight-visibility",
    title: "Last-mile freight visibility for SMBs",
    one_liner: "Project44 for the long tail: track-and-trace for the small importer who ships 5-50 containers a year and gets ignored by enterprise logistics software.",
    the_gap: "If you import 500 containers a year, you have project44 or FourKites. If you import 25, you have an Excel spreadsheet and a 6 AM phone call with your customs broker. The 'no-visibility' threshold cuts off around the $5M-revenue importer.",
    the_play: "Tap the same AIS/EDI/carrier APIs that enterprise tools use, package it for the SMB importer at $99-499/mo. Sell through customs brokers as a value-add they can offer their downmarket clients.",
    market_size_summary: "~100k SMB importers in the US receive 5-100 containers/year. At $200/mo average, the addressable market is ~$240M ARR.",
    timing_rationale: "Three structural shifts: container carriers all opened APIs (2022-23), customs brokers are losing margin and looking for tech-driven value-adds, and tariff uncertainty has made visibility worth paying for.",
    build_path: "Sign 3 customs brokers as channel partners BEFORE writing code. Build a working track-and-trace for ONE carrier (e.g. Maersk). Onboard 10 of each broker's clients. Expand to more carriers and brokers from there.",
    model_type: "SaaS",
    audience: "B2B",
    industry: "Logistics & Supply Chain",
    niche: "Freight visibility",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    founder_path: "Bootstrap",
    difficulty: "Medium",
    starting_capital: "$10k-$100k",
    time_to_launch: "1-3 months",
    build_stack_hint: "Traditional engineering",
    moat: "Distribution",
    distribution_play: "Partnerships",
    demand_trend: "Steady growth",
    featured: false,
    rank: 12,
  }),
];

/**
 * A few sample build briefs so the Pro flow is demoable. Keyed by opportunity slug.
 * Only includes briefs for 3 of the 12 opportunities — the others show the empty
 * "Generate brief" state so users can see both paths.
 */
export const SAMPLE_BUILD_BRIEFS: Record<string, string> = {
  "solo-cpa-workflow-os": `## Overview
A practice-management workspace for solo CPAs, organised around the client engagement rather than the firm's internal hierarchy. The MVP target is a working timeline for the 1040 (personal tax return) engagement, with document collection, deadline tracking, and client-portal reminders.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage) — no separate API layer needed for MVP
- **Documents:** Supabase Storage for raw uploads; pgvector for semantic search inside docs
- **Email:** Postmark for client-portal magic links + reminder emails
- **Payments:** Stripe Billing, monthly subscription at $59
- **Hosting:** Vercel

## Data model
- \`organizations\` — one per CPA firm (typically 1 user)
- \`clients\` — the CPA's clients
- \`engagements\` — \`belongs_to client\`, \`engagement_type enum('1040', '1120', 'bookkeeping', ...)\`
- \`engagement_steps\` — the timeline events (request_documents, review, sign, file)
- \`documents\` — \`belongs_to engagement\`, with extracted metadata (form_type, tax_year, amount)
- \`client_portal_tokens\` — short-lived magic-link tokens for clients

## Core flows
1. CPA creates a client → creates a 1040 engagement → system seeds the standard 1040 timeline
2. CPA clicks "request documents" on a step → templated email with magic-link to client portal
3. Client uploads documents to portal → CPA gets a notification → document auto-tagged by form type
4. CPA reviews → marks step complete → next step's reminders auto-schedule

## Week-1 milestones
- Auth + org creation
- Client CRUD
- Engagement creation with a hard-coded 1040 timeline
- Document upload to engagement
- Deployed to staging with one paying pilot CPA

## Week-2 to launch
- Client portal (magic-link auth, upload UI, status view)
- Email templating + scheduling (Postmark)
- Document auto-tagging (call Anthropic with the PDF, extract form_type, tax_year, employer)
- Stripe Billing for $59/mo subscription
- 10 paying pilot CPAs at $1/mo to ship monthly

## Risks & open questions
- **Risk:** CPAs are extremely habit-formed; expect slow conversion off existing tools. Counter with a one-call onboarding included in the $59.
- **Open:** Should documents flow back into QuickBooks? (Defer to v2.)
- **Open:** Multi-client portal vs. per-client portals? Single client portal is simpler and matches the user mental model.`,

  "soc2-readiness-as-a-service": `## Overview
A productized SOC 2 readiness engagement for early-stage startups: 30 days, $15k flat, ending in a Type I report. You operate the engagement using Vanta or Drata as your internal tooling — the customer is not buying software, they're buying the outcome.

## Stack
You're a service business. Your "stack" is operational, not technical.
- **Internal tooling:** Vanta Trust Pricing or Drata Starter ($7-15k/year)
- **Customer-facing:** Notion playbook, Google Workspace for delivery
- **CRM / pipeline:** HubSpot Starter or Attio
- **Billing:** Stripe Invoicing (not Subscriptions) — one-time invoices
- **Scheduling:** Cal.com for the kickoff and 4 weekly working sessions

## Data model
N/A — your "data" is a Notion playbook with one page per customer and structured fields for control status.

## Core flows
1. **Sales call** (30 min, sell the outcome not the process)
2. **Kickoff** (90 min, day 1) — credentials access, policy gap assessment, schedule check
3. **Week 1-2 working sessions** — policies authored, controls implemented
4. **Week 3 evidence gathering** — Vanta populated, observation period started
5. **Week 4 audit hand-off** — to your auditor partner (CyberGuard, Strike Graph, etc.)
6. **Day 60-90** — auditor delivers Type I report

## Week-1 milestones (of YOUR business)
- Sign 2 letters of intent at $15k
- Write the Notion playbook from your existing compliance knowledge
- Sign a reseller agreement with Vanta or Drata
- Sign a referral agreement with one auditor (10% commission to them)

## Week-2 to launch
- Land your first contract; deliver it yourself
- Post a public case study after delivery
- Add a self-serve booking page on the website

## Risks & open questions
- **Risk:** Vanta/Drata may try to compete with you by offering "concierge". So far they haven't because the gross margin is bad for them. Move fast.
- **Open:** Type I vs. Type II? Start with Type I (point-in-time) — it's a 30-day engagement. Type II requires a 3-month observation, much longer sales cycle. Add as v2 offering.`,

  "synthetic-test-data-api": `## Overview
A usage-based API that takes a database schema (or a sample of real data) and returns realistic-looking synthetic rows that preserve statistical shape and referential integrity. Sold to engineering teams in regulated industries (healthcare, fintech, payments) who can't safely use production snapshots in staging.

## Stack
- **API:** FastAPI (Python) or Hono (TypeScript) — synchronous for small requests, queued for large
- **Generation engine:** Mix of Claude 4.5 Haiku (for categorical fields) and SDV / Gretel-style stat-preserving generators
- **Storage:** Postgres for accounts, S3 for generated payloads
- **Async jobs:** SQS + worker fleet
- **Hosting:** Fly.io or Railway for the API; Modal for the GPU workers
- **Auth:** API keys, rate-limited per key
- **Billing:** Stripe Metered Billing — \`rows_generated\` events posted nightly

## Data model
- \`accounts\` — customer org
- \`api_keys\` — \`account_id\`, prefix, hashed secret, scope (free/paid)
- \`schemas\` — saved schemas with field-level synthesis configs
- \`generations\` — log row per API call (rows, latency, model used, cost)
- \`usage_events\` — daily aggregate pushed to Stripe

## Core flows
1. Sign up → API key issued → free tier (100k rows/mo)
2. \`POST /v1/generate\` with \`{ schema, rows }\` → returns NDJSON or signed S3 URL
3. \`POST /v1/learn\` with sample rows → produces a fitted synthesizer config they can name and reuse
4. Usage exceeds free tier → automatic conversion to paid, Stripe Metered records each row

## Week-1 milestones
- Working CLI for one schema (Stripe-like payments) generating realistic transactions
- Account + API key system
- Hosted demo page that generates 100 rows in <2s

## Week-2 to launch
- Three pre-built schemas live (Stripe, FHIR, generic Postgres dump)
- Async generation for >10k row requests
- Stripe metered billing wired
- Docs site + Postman collection

## Risks & open questions
- **Risk:** Quality of generated data is the entire product. Build an automated eval suite from day 1 (statistical distance to source, FK integrity, edge case coverage).
- **Risk:** Tonic.ai and Gretel are real competitors. The wedge is price and DX — be 10x cheaper at <100M rows/mo than Tonic and 10x easier to integrate.
- **Open:** Self-hosted enterprise tier? Probably yes by year 2.`,
};
