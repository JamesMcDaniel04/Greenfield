import {
  AGENT_ROLE_LABEL,
  type AgentPlan,
  type AgentRole,
  type AgentTool,
  type ClaimedIdea,
} from "@/lib/execution";

type AgentBase = Omit<AgentPlan, "mission" | "instructions" | "handoff" | "success_metric" | "starter_prompt">;

const BASE_TOOLS: Record<AgentRole, AgentTool[]> = {
  gtm: [
    { name: "Greenfield brief", purpose: "Use the claimed idea research and build path as the source of truth." },
    { name: "Customer interview notes", purpose: "Refine ICP and validate what pain is expensive enough to prioritize." },
    { name: "Public market sources", purpose: "Check competitor positioning, pricing, and category language." },
    { name: "Spreadsheet model", purpose: "Track channel tests, pricing assumptions, and weekly learnings." },
  ],
  sales: [
    { name: "CRM or Airtable", purpose: "Track design partners, pipeline stages, and next steps." },
    { name: "LinkedIn and company sites", purpose: "Find buyers, champions, and partner signals." },
    { name: "Lead list exports", purpose: "Work through Clay, Apollo, CSVs, or manually curated targets." },
    { name: "Email and call notes", purpose: "Send sequences and capture objections verbatim." },
  ],
  marketing: [
    { name: "Website CMS", purpose: "Publish landing pages, case studies, and launch assets quickly." },
    { name: "Community threads", purpose: "Mine Reddit, HN, X, and niche forums for language and objections." },
    { name: "Keyword or search exports", purpose: "Prioritize search surfaces and message tests with demand signals." },
    { name: "Email and social scheduler", purpose: "Turn one idea into repeatable distribution across channels." },
  ],
  engineering: [
    { name: "Build brief", purpose: "Scope the MVP surface and protect the first wedge from feature sprawl." },
    { name: "Docs and API references", purpose: "Choose the smallest viable integration surface." },
    { name: "Issue tracker", purpose: "Translate agent and founder requests into a concrete shipping sequence." },
    { name: "Database and logs", purpose: "Instrument the workflow that is actually being sold." },
  ],
};

export const AGENT_BASES: AgentBase[] = [
  {
    role: "gtm",
    name: "GTM Agent",
    tagline: "Owns wedge, ICP, pricing, and launch sequencing.",
    summary: "Turns a raw startup idea into a specific market entry plan with one buyer, one pain point, and one launch motion.",
    allowed_tools: BASE_TOOLS.gtm,
    deliverables: ["ICP memo", "Offer + pricing hypothesis", "Channel scorecard", "Weekly experiment brief"],
    workflow_slugs: ["icp-wedge-builder", "weekly-demand-signal-brief", "pricing-objection-map"],
  },
  {
    role: "sales",
    name: "Sales Agent",
    tagline: "Owns design partners, outbound, and revenue conversations.",
    summary: "Converts the idea into live buyer conversations, pipeline movement, and a repeatable proof of demand.",
    allowed_tools: BASE_TOOLS.sales,
    deliverables: ["Target account list", "Outreach sequences", "Call recap + next steps", "Objection log"],
    workflow_slugs: ["design-partner-recruiter", "founder-led-outbound-sprint", "case-study-extraction-engine"],
  },
  {
    role: "marketing",
    name: "Marketing Agent",
    tagline: "Owns narrative, proof, and content distribution.",
    summary: "Turns customer language and product proof into a launch narrative people can understand and repeat.",
    allowed_tools: BASE_TOOLS.marketing,
    deliverables: ["Messaging house", "Launch asset pack", "Customer proof snippets", "Content calendar"],
    workflow_slugs: ["customer-voice-miner", "launch-asset-repurposer", "competitor-change-monitor"],
  },
  {
    role: "engineering",
    name: "Engineering Agent",
    tagline: "Owns MVP scope, integration choices, and shipping sequence.",
    summary: "Protects the first product wedge and translates market pull into the smallest possible system that can ship.",
    allowed_tools: BASE_TOOLS.engineering,
    deliverables: ["MVP scope", "Data + integration map", "Delivery milestones", "Instrumentation checklist"],
    workflow_slugs: ["product-demo-to-build-brief", "integration-priority-board", "onboarding-friction-triage"],
  },
];

function b2bMotion(claim: ClaimedIdea) {
  return claim.audience.toLowerCase() === "b2b";
}

function nicheLabel(claim: ClaimedIdea) {
  return claim.niche ?? claim.industry;
}

function buildMission(role: AgentRole, claim: ClaimedIdea): string {
  if (role === "gtm") {
    return `Define the initial market wedge for ${claim.title} so the founder has one segment, one promise, and one launch motion to run in the next ${claim.time_to_launch.toLowerCase()}.`;
  }
  if (role === "sales") {
    return b2bMotion(claim)
      ? `Turn ${claim.title} into live pipeline by recruiting design partners and revenue conversations inside ${nicheLabel(claim).toLowerCase()}.`
      : `Turn ${claim.title} into monetizable demand through partnerships, waitlist conversion, and revenue-bearing customer conversations.`;
  }
  if (role === "marketing") {
    return `Build a repeatable narrative for ${claim.title} so every landing page, thread, and proof asset reinforces the same ${claim.distribution_play.toLowerCase()} wedge.`;
  }
  return `Ship the smallest viable version of ${claim.title} that proves the core workflow for ${claim.audience.toLowerCase()} buyers without broadening into a suite.`;
}

function buildInstructions(role: AgentRole, claim: ClaimedIdea): string[] {
  const shared = [
    `Anchor every decision to the claimed opportunity: ${claim.title}.`,
    `Keep the plan consistent with a ${claim.founder_path.toLowerCase()} path, ${claim.starting_capital.toLowerCase()} starting capital, and a ${claim.time_to_launch.toLowerCase()} launch window.`,
    `Prefer one narrow workflow, one measurable proof point, and one weekly operating cadence over broad strategy decks.`,
  ];

  if (role === "gtm") {
    return [
      ...shared,
      `Translate "${claim.one_liner}" into one core buyer persona, one triggering event, and one reason this buyer would switch now.`,
      `Use ${claim.distribution_play.toLowerCase()} as the default acquisition wedge unless evidence from sources or calls says otherwise.`,
      `End every weekly brief with one pricing experiment, one channel bet, and one kill criterion.`,
    ];
  }
  if (role === "sales") {
    return [
      ...shared,
      b2bMotion(claim)
        ? `Build an account list for ${nicheLabel(claim).toLowerCase()} teams who already feel this pain and can say yes to a pilot.`
        : `Build a partner and early-customer list that can create revenue before scaled acquisition exists.`,
      "Log objections verbatim and turn recurring objections into pricing, messaging, or product change requests.",
      "Escalate every pattern that blocks deal movement into a concrete handoff for GTM, Marketing, or Engineering.",
    ];
  }
  if (role === "marketing") {
    return [
      ...shared,
      `Rewrite the offer in the buyer's language, not founder language, and keep the story attached to ${claim.demand_trend.toLowerCase()} demand signals.`,
      "Repurpose every customer insight into landing-page copy, founder posts, proof snippets, and objection-handling assets.",
      "Prefer channels where the initial buyer already spends time before inventing a new audience-development motion.",
    ];
  }
  return [
    ...shared,
    `Scope the MVP around the highest-value workflow in ${nicheLabel(claim).toLowerCase()} and delay adjacent features.`,
    `Use ${claim.model_type.toLowerCase()} economics to decide what can stay manual behind the scenes in v1.`,
    "Instrument the path from first user action to proof-of-value so the team can see whether the wedge is working.",
  ];
}

function buildHandoff(role: AgentRole, claim: ClaimedIdea): string {
  if (role === "gtm") return `Hands the chosen wedge, pricing frame, and channel priorities to Sales and Marketing so ${claim.title} launches on one message.`;
  if (role === "sales") return `Feeds live objections, pilot requests, and close blockers back to GTM and Engineering so the offer tightens every week.`;
  if (role === "marketing") return `Turns call notes and customer proof into assets Sales can ship and GTM can test without waiting on a full campaign cycle.`;
  return `Converts market pull into one build sequence, then returns usage and onboarding friction back to the rest of the team.`;
}

function buildSuccessMetric(role: AgentRole, claim: ClaimedIdea): string {
  if (role === "gtm") return `One clear ICP, one differentiated offer, and one acquisition lane the founder can run for ${claim.title} every week.`;
  if (role === "sales") return b2bMotion(claim)
    ? "Qualified design-partner conversations and a live objection log that improves close rates week over week."
    : "Revenue-bearing customer or partner conversations that convert into early cash or launch distribution.";
  if (role === "marketing") return "A message stack and proof library that raises response rates, landing-page conversion, and founder consistency.";
  return "A shipped MVP surface tied to one proof-of-value event, with usage data visible to the rest of the team.";
}

function buildStarterPrompt(role: AgentRole, claim: ClaimedIdea): string {
  return [
    `You are the ${AGENT_ROLE_LABEL[role]} agent for the startup idea "${claim.title}".`,
    `Opportunity summary: ${claim.one_liner}`,
    `Audience: ${claim.audience}. Industry: ${claim.industry}. Niche: ${nicheLabel(claim)}.`,
    `Operate within a ${claim.founder_path.toLowerCase()} path, ${claim.starting_capital.toLowerCase()} budget, and ${claim.time_to_launch.toLowerCase()} launch window.`,
    `Your mission: ${buildMission(role, claim)}`,
    "Return concrete work products, not generic advice. Prefer bullets, tables, scripts, and next actions the founder can ship this week.",
  ].join("\n");
}

export function buildAgentTeam(claim: ClaimedIdea): AgentPlan[] {
  return AGENT_BASES.map((base) => ({
    ...base,
    mission: buildMission(base.role, claim),
    instructions: buildInstructions(base.role, claim),
    handoff: buildHandoff(base.role, claim),
    success_metric: buildSuccessMetric(base.role, claim),
    starter_prompt: buildStarterPrompt(base.role, claim),
  }));
}
