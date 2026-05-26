import type { Opportunity } from "@/lib/types";
import { PRACTICE_OPPORTUNITY_SLUGS, PRACTICE_THEME_BY_SLUG } from "@/lib/researchedIdeas";

type PracticeTheme =
  | "openSourceMaintainers"
  | "jobSearchOps"
  | "researchWorkflow"
  | "teacherAdmin"
  | "freelancerBackOffice";

type PracticeThemeMeta = {
  label: string;
  icon: "git" | "briefcase" | "library" | "school" | "wallet";
  tools: string[];
  skills: string[];
  hiring_signal: string;
  hiring_context: string;
  thumbnail_class: string;
};

const PRACTICE_THEME_META: Record<PracticeTheme, PracticeThemeMeta> = {
  openSourceMaintainers: {
    label: "Maintainer Ops",
    icon: "git",
    tools: ["GitHub API", "Webhooks", "TypeScript"],
    skills: ["automation UX", "workflow state", "prompt guardrails"],
    hiring_signal: "High hiring signal",
    hiring_context: "Good training for devtools, internal tooling, and engineering-productivity work where GitHub automation and review workflows show up constantly.",
    thumbnail_class: "from-sky-100 via-cyan-50 to-white border-sky-200/80",
  },
  jobSearchOps: {
    label: "Career Ops",
    icon: "briefcase",
    tools: ["Auth", "Email parsing", "Search UI"],
    skills: ["personal SaaS UX", "CRUD flows", "agent assistance"],
    hiring_signal: "Good hiring signal",
    hiring_context: "Strong practice for product engineering roles that need clean auth, search, state management, and AI-assisted productivity workflows.",
    thumbnail_class: "from-amber-100 via-yellow-50 to-white border-amber-200/80",
  },
  researchWorkflow: {
    label: "Research Tools",
    icon: "library",
    tools: ["PDF parsing", "RAG", "Structured notes"],
    skills: ["document pipelines", "retrieval", "evaluation"],
    hiring_signal: "High hiring signal",
    hiring_context: "Useful training for teams building knowledge tooling, AI search, document intelligence, and internal research workflows.",
    thumbnail_class: "from-violet-100 via-fuchsia-50 to-white border-violet-200/80",
  },
  teacherAdmin: {
    label: "Teacher Admin",
    icon: "school",
    tools: ["Templates", "Forms", "Dashboard state"],
    skills: ["workflow design", "AI drafting", "lightweight ops tooling"],
    hiring_signal: "Good hiring signal",
    hiring_context: "Good practice for product roles building service workflows, document-heavy SaaS, and pragmatic AI features that help people finish work faster.",
    thumbnail_class: "from-emerald-100 via-lime-50 to-white border-emerald-200/80",
  },
  freelancerBackOffice: {
    label: "Client Ops",
    icon: "wallet",
    tools: ["Email workflows", "Billing logic", "Client portal"],
    skills: ["business rules", "inbox automation", "small-business UX"],
    hiring_signal: "Good hiring signal",
    hiring_context: "Good training for SaaS teams working on payments, CRM, invoicing, support automation, and other customer-operations surfaces.",
    thumbnail_class: "from-rose-100 via-orange-50 to-white border-rose-200/80",
  },
};

function slugFrom(input: Opportunity | string | null | undefined) {
  if (!input) return null;
  return typeof input === "string" ? input : input.slug;
}

export function isPracticeOpportunity(input: Opportunity | string | null | undefined) {
  const slug = slugFrom(input);
  return slug ? PRACTICE_OPPORTUNITY_SLUGS.has(slug) : false;
}

export function practiceMetaForOpportunity(input: Opportunity | string | null | undefined) {
  const slug = slugFrom(input);
  if (!slug) return null;
  const theme = PRACTICE_THEME_BY_SLUG.get(slug) as PracticeTheme | undefined;
  return theme ? { theme, ...PRACTICE_THEME_META[theme] } : null;
}
