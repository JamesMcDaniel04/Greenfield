import type { PlanTier } from "@/lib/types";

export type PricingTier = {
  plan: PlanTier;
  name: string;
  /** Display price like "$197". */
  priceLabel: string;
  per: string;
  /** Optional sub-line under the price (e.g. "That's just $16/month"). */
  priceFootnote?: string;
  tagline: string;
  features: string[];
  /** True for the visually highlighted "recommended" tier. */
  highlight?: boolean;
  /** True when the tier sells by contact rather than self-serve checkout. */
  contactOnly?: boolean;
  cta: string;
  seat_limit: number;
  claims_per_week_quota: number;
  /** Lifetime claim cap, if any (Entrepreneur is gated this way; others use weekly). */
  claims_per_year_cap?: number;
};

export const TIERS: PricingTier[] = [
  {
    plan: "scout",
    name: "Scout",
    priceLabel: "$97",
    per: "/ year",
    priceFootnote: "About $8/month",
    tagline: "For founders searching for the right idea.",
    features: [
      "All 3,000+ opportunities and full briefs",
      "Every filter — method, audience, capital, time",
      "Special categories including YC Requests",
      "New opportunities added weekly",
    ],
    cta: "Get instant access",
    seat_limit: 1,
    claims_per_week_quota: 0,
  },
  {
    plan: "entrepreneur",
    name: "Entrepreneur",
    priceLabel: "$197",
    per: "/ year",
    priceFootnote: "About $16/month",
    highlight: true,
    tagline: "For serious founders ready to build.",
    features: [
      "Everything in Scout",
      "1 idea claim per year — exclusive to you",
      "Claimed ideas disappear from everyone else's catalogue",
      "Run GTM, Sales, Marketing, and Engineering agents on your claimed idea",
      "Additional claims available for purchase",
    ],
    cta: "Get instant access",
    seat_limit: 1,
    claims_per_week_quota: 1,
    claims_per_year_cap: 1,
  },
  {
    plan: "venture_studio",
    name: "Venture Studio",
    priceLabel: "$12,000",
    per: "/ year",
    priceFootnote: "$1,000/month",
    tagline: "For teams launching multiple startups in parallel.",
    features: [
      "Everything in Entrepreneur",
      "Up to 5 team seats, shared workspace",
      "10 idea claims per week, pooled across the team",
      "Custom weekly research requests",
      "Priority support and dedicated onboarding",
    ],
    contactOnly: true,
    cta: "Contact sales",
    seat_limit: 5,
    claims_per_week_quota: 10,
  },
  {
    plan: "university",
    name: "University & Accelerator",
    priceLabel: "Custom",
    per: "",
    tagline: "For programs and institutions.",
    features: [
      "Bulk student or cohort account creation",
      "Workshops and mentoring",
      "Curriculum support and integration",
      "Co-branded reporting and analytics",
    ],
    contactOnly: true,
    cta: "Contact us",
    seat_limit: 25,
    claims_per_week_quota: 50,
  },
];

export const TIER_BY_PLAN: Record<PlanTier, PricingTier> = TIERS.reduce(
  (acc, t) => {
    acc[t.plan] = t;
    return acc;
  },
  {} as Record<PlanTier, PricingTier>,
);

/** Tiers shown side-by-side at the top of the pricing grid (not University). */
export const SELF_SERVE_TIERS = TIERS.filter((t) => t.plan !== "university");

export function planAllowsClaiming(plan: PlanTier): boolean {
  return (TIER_BY_PLAN[plan]?.claims_per_week_quota ?? 0) > 0;
}
