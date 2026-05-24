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

  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  pro_since: string | null;
  stripe_customer_id: string | null;
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
};
