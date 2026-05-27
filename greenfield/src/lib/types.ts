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

export type PlanTier = "scout" | "entrepreneur" | "builder" | "career" | "venture_studio" | "university";

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
  /** Exactly one of claim_id, user_idea_id, or user_project_id is non-null. */
  claim_id: string | null;
  user_idea_id?: string | null;
  user_project_id?: string | null;
  submission_id?: string | null;
  agent_role: "research" | "gtm" | "sales" | "marketing" | "engineering" | "mentor" | "evaluator";
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
  owner_role: "research" | "gtm" | "sales" | "marketing" | "engineering" | "mentor" | "evaluator";
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

/**
 * Shared shape across user_ideas / user_projects — the minimum set of context
 * fields the agent persona builder needs. Both BYO entities and ClaimedIdea
 * satisfy this so `buildAgentTeam` works for all three.
 */
export type AgentSubjectContext = {
  title: string;
  one_liner: string;
  audience: string | null;
  industry: string | null;
  niche: string | null;
  model_type: string | null;
  distribution_play: string | null;
  demand_trend: string | null;
  founder_path: string | null;
  starting_capital: string | null;
  time_to_launch: string | null;
};

export type UserIdea = {
  id: string;
  team_id: string;
  created_by: string;

  title: string;
  one_liner: string;

  the_gap: string | null;
  the_play: string | null;
  market_size_summary: string | null;
  timing_rationale: string | null;
  build_path: string | null;

  model_type: string | null;
  audience: string | null;
  industry: string | null;
  niche: string | null;
  founder_path: string | null;
  starting_capital: string | null;
  time_to_launch: string | null;
  distribution_play: string | null;
  demand_trend: string | null;

  created_at: string;
  updated_at: string;
};

export type ProjectStage = "prototype" | "live" | "scaling";

export type UserProject = {
  id: string;
  team_id: string;
  created_by: string;

  title: string;
  summary: string;
  stage: ProjectStage;

  repo_url: string | null;
  deploy_url: string | null;
  current_metrics: Record<string, unknown>;
  build_brief_md: string | null;

  model_type: string | null;
  audience: string | null;
  industry: string | null;
  niche: string | null;
  founder_path: string | null;
  starting_capital: string | null;
  time_to_launch: string | null;
  distribution_play: string | null;
  demand_trend: string | null;

  created_at: string;
  updated_at: string;
};

export type ByoUsageRow = {
  team_id: string;
  year_month: string;
  runs_used: number;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────
// Career: tracks, projects, enrollments, submissions, evaluations, portfolio
// ─────────────────────────────────────────────────────────────────────────

export type RubricCriterion = {
  id: string;
  criterion: string;
  weight: number;
  pass_threshold: number;
  max: number;
};

export type RubricScore = {
  criterion_id: string;
  score: number;
  max: number;
  notes?: string;
};

export type AntiCheatQuestion = {
  id: string;
  prompt: string;
  min_words: number;
};

export type CareerTrack = {
  slug: string;
  title: string;
  target_role: string;
  summary: string;
  hero_promise: string;
  est_duration: string;
  project_count: number;
  is_active: boolean;
  created_at: string;
};

export type CareerProject = {
  slug: string;
  track_slug: string;
  ordinal: number;
  title: string;
  summary: string;
  hireable_skill: string;
  required_artifacts: string[];
  anti_cheat_questions: AntiCheatQuestion[];
  rubric: RubricCriterion[];
  starter_brief_md: string | null;
  is_active: boolean;
  created_at: string;
};

export type CareerEnrollmentStatus = "active" | "completed" | "paused" | "withdrawn";

export type CareerEnrollment = {
  id: string;
  user_id: string;
  track_slug: string;
  started_at: string;
  completed_at: string | null;
  status: CareerEnrollmentStatus;
};

export type CareerSubmissionStatus =
  | "draft"
  | "submitted"
  | "grading"
  | "passed"
  | "needs_revision"
  | "failed"
  | "withdrawn";

export type CareerSubmission = {
  id: string;
  enrollment_id: string;
  project_slug: string;
  repo_url: string | null;
  deploy_url: string | null;
  demo_url: string | null;
  written_answers: Record<string, string>;
  status: CareerSubmissionStatus;
  attempt_no: number;
  submitted_at: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HumanReviewState = "none" | "requested" | "in_review" | "approved" | "rejected";

export type CareerSubmissionEvaluation = {
  id: string;
  submission_id: string;
  evaluator_agent_run_id: string | null;
  rubric_scores: RubricScore[];
  overall_pass: boolean;
  model_feedback_md: string | null;
  human_reviewer_id: string | null;
  human_review_state: HumanReviewState;
  human_review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type CareerPortfolioProfile = {
  user_id: string;
  username: string;
  headline: string | null;
  bio: string | null;
  is_public: boolean;
  verified_track_slugs: string[];
  human_verified_track_slugs: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CareerUsageRow = {
  team_id: string;
  year_month: string;
  runs_used: number;
  updated_at: string;
};

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
