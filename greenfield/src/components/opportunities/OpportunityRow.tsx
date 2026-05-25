import { Link } from "react-router-dom";
import { ArrowUpRight, Rocket, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Sparkline from "./Sparkline";
import type { Opportunity } from "@/lib/types";
import { DIFFICULTY_TONE } from "@/lib/vocab";
import { cn } from "@/lib/utils";

export default function OpportunityRow({ opp }: { opp: Opportunity }) {
  return (
    <Link
      to={`/opportunity/${opp.slug}`}
      className={cn(
        "group grid grid-cols-[10rem_1fr_auto] items-center gap-6 rounded-xl border bg-card p-4 shadow-sm transition-all",
        "hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/[0.04] to-accent/[0.06]">
        <Sparkline seed={opp.slug} trend={opp.demand_trend} width={140} height={48} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {opp.yc_rfs_slug && (
            <Badge className="gap-1 bg-accent/90 text-accent-foreground hover:bg-accent">
              <Rocket className="h-3 w-3" />
              YC Request
            </Badge>
          )}
          {opp.featured && !opp.yc_rfs_slug && (
            <Badge variant="default" className="gap-1 bg-accent/90 text-accent-foreground hover:bg-accent">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          <Badge variant="soft">{opp.industry}</Badge>
          {opp.niche && <Badge variant="outline">{opp.niche}</Badge>}
        </div>

        <h3 className="mt-2 font-display text-lg leading-snug">{opp.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{opp.one_liner}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className={cn("rounded-full border px-2 py-0.5 font-medium", DIFFICULTY_TONE[opp.difficulty] ?? "bg-muted")}>
            {opp.difficulty}
          </span>
          <Meta label="Audience"  value={opp.audience} />
          <Meta label="Capital"   value={opp.starting_capital} />
          <Meta label="Launch"    value={opp.time_to_launch} />
          <Meta label="Model"     value={opp.model_type} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="text-xs font-medium text-muted-foreground">{opp.demand_trend}</span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-foreground/40">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </span>
  );
}
