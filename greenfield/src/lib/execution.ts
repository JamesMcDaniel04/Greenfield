import type { Opportunity } from "@/lib/types";

export type AgentRole = "research" | "gtm" | "sales" | "marketing" | "engineering" | "mentor" | "evaluator";

export type ClaimedIdea = {
  /** Supabase idea_claims.id when persisted; absent in demo/localStorage mode. */
  claim_id?: string;
  opportunity_id: string;
  opportunity_slug: string;
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
  claimed_at: string;
};

export type AgentTool = {
  name: string;
  purpose: string;
};

export type AgentPlan = {
  role: AgentRole;
  name: string;
  tagline: string;
  summary: string;
  mission: string;
  instructions: string[];
  allowed_tools: AgentTool[];
  deliverables: string[];
  handoff: string;
  success_metric: string;
  workflow_slugs: string[];
  starter_prompt: string;
};

export type WorkflowStep = {
  owner: AgentRole;
  title: string;
  description: string;
};

export type WorkflowTemplate = {
  slug: string;
  title: string;
  one_liner: string;
  category: "Research" | "GTM" | "Sales" | "Marketing" | "Engineering" | "Mentor" | "Evaluator";
  stage: "Foundation" | "Launch" | "Revenue" | "Retention";
  primary_agent: AgentRole;
  support_agents: AgentRole[];
  setup_time: string;
  automation_level: "Manual-first" | "Agent-assisted" | "Automate later";
  objective: string;
  when_to_use: string;
  inputs: string[];
  outputs: string[];
  tool_surfaces: AgentTool[];
  steps: WorkflowStep[];
  implementation: {
    validated: string;
    agentic: string;
    automation: string;
  };
  metrics: string[];
  tags: string[];
  fit: {
    audiences?: string[];
    models?: string[];
    industries?: string[];
    distributions?: string[];
    founder_paths?: string[];
  };
};

export type WorkflowGuide = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export const AGENT_ROLE_ORDER: AgentRole[] = ["research", "gtm", "sales", "marketing", "engineering", "mentor", "evaluator"];

/**
 * Roles that operate on catalogue claims and BYO ideas/projects. The Career
 * surface (mentor + evaluator) is intentionally excluded from this list —
 * those roles are tied to submission subjects and surface only on /career.
 */
export const FOUNDER_AGENT_ROLES: AgentRole[] = ["research", "gtm", "sales", "marketing", "engineering"];

export const CAREER_AGENT_ROLES: AgentRole[] = ["mentor", "evaluator"];

export const AGENT_ROLE_LABEL: Record<AgentRole, string> = {
  research: "Research",
  gtm: "GTM",
  sales: "Sales",
  marketing: "Marketing",
  engineering: "Engineering",
  mentor: "Mentor",
  evaluator: "Evaluator",
};

export function claimFromOpportunity(opp: Opportunity): ClaimedIdea {
  return {
    opportunity_id: opp.id,
    opportunity_slug: opp.slug,
    title: opp.title,
    one_liner: opp.one_liner,
    audience: opp.audience,
    industry: opp.industry,
    niche: opp.niche,
    model_type: opp.model_type,
    distribution_play: opp.distribution_play,
    demand_trend: opp.demand_trend,
    founder_path: opp.founder_path,
    difficulty: opp.difficulty,
    starting_capital: opp.starting_capital,
    time_to_launch: opp.time_to_launch,
    claimed_at: new Date().toISOString(),
  };
}
