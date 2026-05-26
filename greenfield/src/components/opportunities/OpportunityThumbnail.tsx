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
      <div className="flex h-full items-center justify-center rounded-xl border border-transparent bg-gradient-to-br from-primary/[0.04] to-accent/[0.06]">
        <Sparkline seed={opp.slug} trend={opp.demand_trend} width={compact ? 140 : 240} height={compact ? 48 : 96} />
      </div>
    );
  }

  const Icon = ICONS[practiceMeta.icon];
  const tools = compact ? practiceMeta.tools.slice(0, 2) : practiceMeta.tools.slice(0, 2);
  const skillLine = compact ? practiceMeta.skills[0] : practiceMeta.skills.slice(0, 2).join(" · ");

  if (compact) {
    return (
      <div
        className={cn(
          "h-full overflow-hidden rounded-[20px] border shadow-sm",
          practiceMeta.thumbnail_class,
        )}
      >
        <div className="flex h-full items-center gap-3 bg-white/68 px-2.5 py-2 backdrop-blur-[2px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/90 bg-white shadow-sm">
            <Icon className="h-[18px] w-[18px] text-slate-700" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
              Practice
            </span>
            <p className="mt-1 truncate text-sm font-semibold leading-none text-slate-900">
              {practiceMeta.label}
            </p>
            <p className="mt-1 truncate text-[11px] leading-none text-slate-600">
              {tools.join(" • ")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full overflow-hidden rounded-[22px] border shadow-sm",
        practiceMeta.thumbnail_class,
      )}
    >
      <div className="flex h-full flex-col justify-between bg-white/62 p-4 backdrop-blur-[2px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-white shadow-sm">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            Practice
          </span>
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Skill Track
            </p>
            <p className="mt-1 font-display text-[1.05rem] leading-tight text-slate-900">
              {practiceMeta.label}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-white/70 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm"
              >
                {tool}
              </span>
            ))}
          </div>

          <p className="max-w-[14rem] text-[11px] leading-relaxed text-slate-600">
            {skillLine}
          </p>
        </div>
      </div>
    </div>
  );
}
