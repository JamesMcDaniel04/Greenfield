/**
 * A cited research signal — a public source (article, post, dataset entry) that
 * informs the opportunity's gap / market / timing case. Populated by the n8n
 * ingestion pipeline (TechCrunch RSS, Reddit, X, Hacker News, etc.) and
 * surfaced on the detail page so readers can audit how fresh the signal is.
 */
export type SourceType =
  | "techcrunch"
  | "reddit"
  | "x"
  | "hackernews"
  | "crunchbase"
  | "arxiv"
  | "github"
  | "blog"
  | "podcast"
  | "other";

export type SourceCitation = {
  id?: string;
  source_type: SourceType;
  url: string;
  title: string;
  /** ISO timestamp of when the source itself was published. */
  published_at: string;
  /** ISO timestamp of when we ingested it. */
  ingested_at?: string;
  /** Short factual snippet — author, subreddit, channel, etc. NOT a quote of body content. */
  snippet?: string;
};

export type Opportunity = {
  id: string;
  slug: string;
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
  niche: string | null;

  revenue_ceiling: string;
  founder_path: string;
  difficulty: string;
  starting_capital: string;
  time_to_launch: string;
  build_stack_hint: string;
  moat: string;
  distribution_play: string;
  demand_trend: string;

  featured: boolean;
  rank: number;
  cover_image_url: string | null;

  /** Slug of a YC Request for Startups topic this opportunity is seeded by. */
  yc_rfs_slug: string | null;

  /** Cited sources / signals that inform this opportunity. Newest first. */
  sources: SourceCitation[];

  created_at: string;
  updated_at: string;
};

export type PlanTier = "scout" | "entrepreneur" | "venture_studio" | "university";

export type Team = {
  id: string;
  name: string;
  plan: PlanTier;
  claims_per_week_quota: number;
  seat_limit: number;
  stripe_subscription_id: string | null;
  created_at: string;
};

export type TeamMember = {
  team_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

export type IdeaClaim = {
  id: string;
  opportunity_id: string;
  team_id: string;
  claimed_by: string;
  status: "active" | "released" | "expired";
  claimed_at: string;
  released_at: string | null;
  expires_at: string | null;
};

export type AgentRunStatus = "queued" | "running" | "succeeded" | "failed";

export type AgentToolCall = {
  /** Tool name e.g. "web_search". */
  name: string;
  /** What the model passed to the tool. */
  input: Record<string, unknown>;
  /** What the tool returned. May contain { error } when a tool failed. */
  result: unknown;
  /** Milliseconds the tool took to execute. */
  duration_ms?: number;
};

export type AgentRun = {
  id: string;
  claim_id: string;
  agent_role: "gtm" | "sales" | "marketing" | "engineering";
  status: AgentRunStatus;
  prompt: string;
  output_markdown: string | null;
  tool_calls: AgentToolCall[];
  model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
};

export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type WorkflowStepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

export type WorkflowStep = {
  id: string;
  workflow_run_id: string;
  ordinal: number;
  owner_role: "gtm" | "sales" | "marketing" | "engineering";
  title: string;
  description: string;
  status: WorkflowStepStatus;
  agent_run_id: string | null;
  output_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
};

export type WorkflowRun = {
  id: string;
  claim_id: string;
  workflow_slug: string;
  workflow_title: string;
  status: WorkflowRunStatus;
  current_step: number;
  step_count: number;
  started_by: string | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  steps?: WorkflowStep[];
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  is_admin: boolean;
  pro_since: string | null;
  stripe_customer_id: string | null;
  personal_team_id: string | null;
  plan: PlanTier;
  created_at: string;
};

export type SavedRow = { user_id: string; opportunity_id: string; created_at: string };

export type BuildBrief = {
  opportunity_id: string;
  markdown: string;
  model: string | null;
  generated_at: string;
};

export type Filters = {
  q: string;
  industries: string[];
  audiences: string[];
  difficulties: string[];
  modelTypes: string[];
  capitals: string[];
  times: string[];
  stacks: string[];
  timeToMvp: string[];
  buildMethods: string[];
  teamSizes: string[];
  founderBackgrounds: string[];
  domainLearningTimes: string[];
  barriersToEntry: string[];
  acquisitionChannels: string[];
};

export const emptyFilters: Filters = {
  q: "",
  industries: [],
  audiences: [],
  difficulties: [],
  modelTypes: [],
  capitals: [],
  times: [],
  stacks: [],
  timeToMvp: [],
  buildMethods: [],
  teamSizes: [],
  founderBackgrounds: [],
  domainLearningTimes: [],
  barriersToEntry: [],
  acquisitionChannels: [],
};
