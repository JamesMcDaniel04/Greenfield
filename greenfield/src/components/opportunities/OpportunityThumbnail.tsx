import {
  BriefcaseBusiness, FileSearch, GitBranch, GraduationCap, Wallet,
} from "lucide-react";

import Sparkline from "@/components/opportunities/Sparkline";
import { practiceMetaForOpportunity } from "@/lib/practiceIdeas";
import type { Opportunity } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  opp: Opportunity;
  compact?: boolean;
};

const ICONS = {
  git: GitBranch,
  briefcase: BriefcaseBusiness,
  library: FileSearch,
  school: GraduationCap,
  wallet: Wallet,
} as const;

export default function OpportunityThumbnail({ opp, compact = false }: Props) {
  const practiceMeta = practiceMetaForOpportunity(opp);

  if (!practiceMeta) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/[0.04] to-accent/[0.06]">
        <Sparkline seed={opp.slug} trend={opp.demand_trend} width={compact ? 140 : 240} height={compact ? 48 : 96} />
      </div>
    );
  }

  const Icon = ICONS[practiceMeta.icon];
  const tools = compact ? practiceMeta.tools.slice(0, 2) : practiceMeta.tools;

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-lg border bg-gradient-to-br px-3 py-2",
        practiceMeta.thumbnail_class,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/75 shadow-sm">
          <Icon className="h-4 w-4 text-slate-700" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          Practice Build
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-slate-800">{practiceMeta.label}</p>
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
