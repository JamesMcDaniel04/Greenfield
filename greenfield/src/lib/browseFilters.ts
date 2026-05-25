import type { Opportunity, Filters } from "@/lib/types";

export const MORE_FILTER_VOCAB = {
  timeToMvp: ["1 Week", "1 Month", "3+ Months"],
  buildMethods: ["Vibe Coding", "Low-Code", "Traditional Coding"],
  teamSizes: ["Solo", "Team"],
  founderBackgrounds: ["Non-Technical", "Technical", "Domain Expert"],
  domainLearningTimes: ["Less than 1 Month", "1 Month", "1-6 Months", "6+ Months", "Become insider first"],
  barriersToEntry: ["Laptop and internet", "Software + APIs", "Special Equipment / Licenses", "Heavy Infrastructure"],
  acquisitionChannels: ["Organic (SEO, Content, Social)", "Partnerships", "Outbound (Cold Email, LinkedIn)", "Paid (Meta, Google Ads)"],
} as const;

type OpportunityFacets = {
  timeToMvp: string;
  buildMethod: string;
  teamSize: string;
  founderBackground: string;
  domainLearningTime: string;
  barrierToEntry: string;
  acquisitionChannels: string[];
};

const DOMAIN_EXPERT_INDUSTRIES = new Set([
  "Accessibility & Compliance",
  "Climate & Energy",
  "Construction & Skilled Trades",
  "Energy & Grid Infrastructure",
  "Food & Agriculture",
  "Healthcare & Med-Adjacent",
  "Industrial & Drone Ops",
  "Legal & Compliance",
  "Logistics & Supply Chain",
  "Water & Utilities",
]);

const INSIDER_FIRST_INDUSTRIES = new Set([
  "Energy & Grid Infrastructure",
  "Healthcare & Med-Adjacent",
  "Water & Utilities",
]);

export function additionalFilterCount(filters: Filters): number {
  return (
    filters.timeToMvp.length +
    filters.buildMethods.length +
    filters.teamSizes.length +
    filters.founderBackgrounds.length +
    filters.domainLearningTimes.length +
    filters.barriersToEntry.length +
    filters.acquisitionChannels.length
  );
}

export function matchesBrowseFilters(opportunity: Opportunity, filters: Filters): boolean {
  const q = filters.q.trim().toLowerCase();
  const facets = deriveOpportunityFacets(opportunity);

  if (filters.industries.length && !filters.industries.includes(opportunity.industry)) return false;
  if (filters.audiences.length && !filters.audiences.includes(opportunity.audience)) return false;
  if (filters.difficulties.length && !filters.difficulties.includes(opportunity.difficulty)) return false;
  if (filters.modelTypes.length && !filters.modelTypes.includes(opportunity.model_type)) return false;
  if (filters.capitals.length && !filters.capitals.includes(opportunity.starting_capital)) return false;
  if (filters.times.length && !filters.times.includes(opportunity.time_to_launch)) return false;
  if (filters.stacks.length && !filters.stacks.includes(opportunity.build_stack_hint)) return false;
  if (filters.timeToMvp.length && !filters.timeToMvp.includes(facets.timeToMvp)) return false;
  if (filters.buildMethods.length && !filters.buildMethods.includes(facets.buildMethod)) return false;
  if (filters.teamSizes.length && !filters.teamSizes.includes(facets.teamSize)) return false;
  if (filters.founderBackgrounds.length && !filters.founderBackgrounds.includes(facets.founderBackground)) return false;
  if (filters.domainLearningTimes.length && !filters.domainLearningTimes.includes(facets.domainLearningTime)) return false;
  if (filters.barriersToEntry.length && !filters.barriersToEntry.includes(facets.barrierToEntry)) return false;
  if (
    filters.acquisitionChannels.length &&
    !filters.acquisitionChannels.some((channel) => facets.acquisitionChannels.includes(channel))
  ) return false;
  if (q) {
    const hay = `${opportunity.title} ${opportunity.one_liner} ${opportunity.the_gap} ${opportunity.industry} ${opportunity.niche ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function deriveOpportunityFacets(opportunity: Opportunity): OpportunityFacets {
  const founderBackground = deriveFounderBackground(opportunity);
  const barrierToEntry = deriveBarrierToEntry(opportunity);

  return {
    timeToMvp: deriveTimeToMvp(opportunity),
    buildMethod: deriveBuildMethod(opportunity),
    teamSize: deriveTeamSize(opportunity),
    founderBackground,
    domainLearningTime: deriveDomainLearningTime(opportunity, founderBackground, barrierToEntry),
    barrierToEntry,
    acquisitionChannels: deriveAcquisitionChannels(opportunity),
  };
}

function deriveTimeToMvp(opportunity: Opportunity) {
  if (opportunity.time_to_launch === "Weeks") return "1 Week";
  if (opportunity.time_to_launch === "1-3 months") return "1 Month";
  return "3+ Months";
}

function deriveBuildMethod(opportunity: Opportunity) {
  if (opportunity.build_stack_hint === "AI-coded (Claude/Cursor/Codex)") return "Vibe Coding";
  if (opportunity.build_stack_hint === "Traditional engineering") return "Traditional Coding";
  return "Low-Code";
}

function deriveTeamSize(opportunity: Opportunity) {
  if (
    opportunity.founder_path === "VC-backed" ||
    opportunity.model_type === "Hardware + Software" ||
    opportunity.difficulty === "Expert" ||
    opportunity.starting_capital === "$100k+" ||
    opportunity.time_to_launch === "3+ months"
  ) return "Team";
  if (opportunity.difficulty === "Hard" && opportunity.starting_capital === "$10k-$100k") return "Team";
  return "Solo";
}

function deriveFounderBackground(opportunity: Opportunity) {
  if (
    DOMAIN_EXPERT_INDUSTRIES.has(opportunity.industry) &&
    (opportunity.difficulty === "Hard" || opportunity.difficulty === "Expert" || opportunity.model_type === "Hardware + Software")
  ) return "Domain Expert";
  if (
    opportunity.build_stack_hint === "No-code" ||
    opportunity.build_stack_hint === "AI-coded (Claude/Cursor/Codex)" ||
    opportunity.model_type === "Productized Service"
  ) return "Non-Technical";
  return "Technical";
}

function deriveDomainLearningTime(
  opportunity: Opportunity,
  founderBackground: string,
  barrierToEntry: string,
) {
  if (INSIDER_FIRST_INDUSTRIES.has(opportunity.industry) || opportunity.model_type === "Hardware + Software") {
    return "Become insider first";
  }
  if (founderBackground === "Domain Expert") return "6+ Months";
  if (barrierToEntry === "Special Equipment / Licenses") return "1-6 Months";
  if (founderBackground === "Technical" && DOMAIN_EXPERT_INDUSTRIES.has(opportunity.industry)) return "1-6 Months";
  if (opportunity.build_stack_hint === "AI-coded (Claude/Cursor/Codex)" && opportunity.difficulty === "Easy") {
    return "Less than 1 Month";
  }
  return founderBackground === "Technical" ? "1 Month" : "Less than 1 Month";
}

function deriveBarrierToEntry(opportunity: Opportunity) {
  if (opportunity.model_type === "Hardware + Software" || opportunity.starting_capital === "$100k+") {
    return "Heavy Infrastructure";
  }
  if (DOMAIN_EXPERT_INDUSTRIES.has(opportunity.industry) || opportunity.starting_capital === "$10k-$100k") {
    return "Special Equipment / Licenses";
  }
  if (
    opportunity.build_stack_hint === "Traditional engineering" ||
    opportunity.build_stack_hint === "Hybrid" ||
    opportunity.model_type === "API / Usage-Based"
  ) return "Software + APIs";
  return "Laptop and internet";
}

function deriveAcquisitionChannels(opportunity: Opportunity) {
  const channels: string[] = [];

  if (opportunity.distribution_play === "Community-led" || opportunity.distribution_play === "Product-led growth") {
    channels.push("Organic (SEO, Content, Social)");
  }
  if (opportunity.distribution_play === "Partnerships") {
    channels.push("Partnerships");
  }
  if (opportunity.distribution_play === "Cold outbound" || opportunity.distribution_play === "Direct sales") {
    channels.push("Outbound (Cold Email, LinkedIn)");
  }
  if (
    opportunity.audience !== "B2B" ||
    opportunity.model_type === "Transactional" ||
    opportunity.model_type === "Marketplace"
  ) {
    channels.push("Paid (Meta, Google Ads)");
  }

  if (channels.length === 0) channels.push("Organic (SEO, Content, Social)");
  return [...new Set(channels)];
}
