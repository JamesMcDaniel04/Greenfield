import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import OpportunityThumbnail from "@/components/opportunities/OpportunityThumbnail";
import { isPracticeOpportunity, practiceMetaForOpportunity } from "@/lib/practiceIdeas";
import type { Opportunity } from "@/lib/types";
import { DIFFICULTY_TONE } from "@/lib/vocab";
import { cn } from "@/lib/utils";

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  const practiceMeta = practiceMetaForOpportunity(opp);
  const isPractice = isPracticeOpportunity(opp);

  return (
    <Link
      to={`/opportunity/${opp.slug}`}
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="h-28">
        <OpportunityThumbnail opp={opp} />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {isPractice && (
            <Badge className="bg-slate-900 text-white hover:bg-slate-900">Practice build</Badge>
          )}
          <Badge variant="soft">{opp.industry}</Badge>
          <Badge variant="outline">{opp.audience}</Badge>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <h3 className="mt-3 font-display text-lg leading-snug">{opp.title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{opp.one_liner}</p>

      <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-xs">
        <span className={cn("rounded-full border px-2 py-0.5 font-medium", DIFFICULTY_TONE[opp.difficulty] ?? "bg-muted")}>
          {opp.difficulty}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{practiceMeta ? practiceMeta.hiring_signal : opp.demand_trend}</span>
        </div>
      </div>
    </Link>
  );
}
