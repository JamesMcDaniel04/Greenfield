// Controlled vocabularies — kept in sync with scripts/seed.ts
// Used to render filter checkboxes and validate values.

export const VOCAB = {
  audience: ["B2B", "B2C", "B2B2C", "Prosumer"],
  difficulty: ["Easy", "Medium", "Hard", "Expert"],
  model_type: [
    "SaaS", "Marketplace", "Productized Service", "Transactional",
    "Subscription Content", "API / Usage-Based", "Hardware + Software",
  ],
  starting_capital: ["Under $1k", "$1k-$10k", "$10k-$100k", "$100k+"],
  time_to_launch: ["Days", "Weeks", "1-3 months", "3+ months"],
  build_stack_hint: ["No-code", "AI-coded (Claude/Cursor/Codex)", "Hybrid", "Traditional engineering"],
} as const;

export const DIFFICULTY_TONE: Record<string, string> = {
  Easy:   "bg-emerald-50  text-emerald-800 border-emerald-200",
  Medium: "bg-amber-50    text-amber-800   border-amber-200",
  Hard:   "bg-orange-50   text-orange-800  border-orange-200",
  Expert: "bg-rose-50     text-rose-800    border-rose-200",
};
