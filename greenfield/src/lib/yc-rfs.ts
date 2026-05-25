/**
 * Y Combinator's Summer 2026 Requests for Startups, presented as a directory.
 *
 * The 1-liners below are our own characterisations of each topic — written to
 * help a Greenfield user decide if it interests them. For the actual RFS
 * descriptions (which are YC's work), every entry links to the source.
 *
 * Refresh this list when YC publishes a new RFS batch. The titles, anchors,
 * and authors are factual metadata. Source: https://www.ycombinator.com/rfs
 */

export type YcRfs = {
  slug: string;        // matches the YC anchor (used in our URL too)
  title: string;
  author: string;
  /** Greenfield's own 1-line take. NOT a copy of YC's description. */
  takeaway: string;
};

export const YC_RFS_BATCH = {
  label: "Summer 2026",
  sourceUrl: "https://www.ycombinator.com/rfs",
  items: [
    {
      slug: "ai-for-low-pesticide-agriculture",
      title: "AI for Low-Pesticide Agriculture",
      author: "Garry Tan",
      takeaway: "Computer vision and robotics that identify and remove pests selectively, so farms can stop blanket-spraying.",
    },
    {
      slug: "ai-native-discovery-engines",
      title: "AI-Native Discovery Engines",
      author: "Jon Xu",
      takeaway: "Search and recommendation built from scratch around how people actually want to find things in a post-Google internet.",
    },
    {
      slug: "ai-native-service-companies",
      title: "AI-Native Service Companies",
      author: "Gustaf Alströmer",
      takeaway: "Operate a labor-heavy service business (legal, accounting, claims) with AI doing 80% of the work and software margins as the prize.",
    },
    {
      slug: "ai-personalized-medicine",
      title: "AI Personalized Medicine",
      author: "Ankit Gupta",
      takeaway: "Tailor diagnostics, drug selection, and treatment plans to the individual patient using genome, history, and longitudinal data.",
    },
    {
      slug: "company-brain",
      title: "Company Brain",
      author: "Tom Blomfield",
      takeaway: "A persistent organisational knowledge layer that captures decisions and context so they survive turnover and scale.",
    },
    {
      slug: "counter-swarm-defense",
      title: "Counter-Swarm Defense",
      author: "Tyler Bosmeny",
      takeaway: "Detection and neutralisation systems for cheap drone and unmanned-vehicle swarms — a category US adversaries are racing on.",
    },
    {
      slug: "dynamic-software-interfaces",
      title: "Dynamic Software Interfaces",
      author: "Ankit Gupta",
      takeaway: "UIs that reconfigure themselves to the user and the task, rather than presenting one frozen layout to everyone.",
    },
    {
      slug: "electronics-in-space",
      title: "Electronics in Space",
      author: "Philip Johnston",
      takeaway: "Radiation-tolerant chips, modules, and assemblies built for the cost and reliability demands of the new orbital economy.",
    },
    {
      slug: "hardware-supply-chain",
      title: "Hardware Supply Chain",
      author: "Nicolas Dessaigne",
      takeaway: "Rebuild the long, opaque, China-dependent supply chains for physical goods with shorter, more transparent alternatives.",
    },
    {
      slug: "industrial-capabilities-in-space",
      title: "Industrial Capabilities in Space",
      author: "Adi Oltean",
      takeaway: "Manufacturing, assembly, refining, and other industrial processes performed in orbit rather than on Earth.",
    },
    {
      slug: "inference-chips-for-agent-workflows",
      title: "Inference Chips for Agent Workflows",
      author: "Diana Hu",
      takeaway: "Silicon optimised for the long-running, branchy, multi-step inference patterns that agent systems actually use.",
    },
    {
      slug: "saas-challengers",
      title: "SaaS Challengers",
      author: "Jared Friedman",
      takeaway: "The next-generation rival to one entrenched SaaS incumbent (Salesforce, SAP, Workday), with AI as the wedge.",
    },
    {
      slug: "software-for-agents",
      title: "Software for Agents",
      author: "Aaron Epstein",
      takeaway: "Tools, infrastructure, and developer products built for AI agents as the primary user — not for humans.",
    },
    {
      slug: "startups-selling-to-huge-companies",
      title: "Startups That Want to Sell to Huge Companies",
      author: "Harshita Arora & Brad Flora",
      takeaway: "Enterprise-grade products for Fortune 500 buyers — long sales cycles, six-figure contracts, less crowded competition.",
    },
    {
      slug: "supply-chain-for-semiconductors",
      title: "Supply Chain 2.0 for Semiconductors",
      author: "Diana Hu",
      takeaway: "Domestic-and-allied supply chains for the chips that underpin AI, defense, and modern electronics.",
    },
    {
      slug: "ai-operating-system-for-companies",
      title: "The AI Operating System for Companies",
      author: "Diana Hu",
      takeaway: "The orchestration layer where AI agents, data, and workflows live — the OS for a company that runs on AI.",
    },
  ] satisfies YcRfs[],
} as const;

export function ycRfsUrl(slug: string): string {
  return `${YC_RFS_BATCH.sourceUrl}#${slug}`;
}
