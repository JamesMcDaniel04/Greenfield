import { ArrowUpRight, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Sparkline from "./Sparkline";
import { ycRfsUrl, type YcRfs } from "@/lib/yc-rfs";
import { cn } from "@/lib/utils";

type Props = { rfs: YcRfs; batchLabel: string };

/**
 * Catalogue-style row for a single YC Request for Startups topic.
 * Visually mirrors OpportunityRow so YC entries feel like part of the
 * same browsing surface, but the action links out to YC for the source.
 */
export default function YcRfsRow({ rfs, batchLabel }: Props) {
  const href = ycRfsUrl(rfs.slug);

  return (
    <div className={cn(
      "group grid grid-cols-[10rem_1fr_auto] items-center gap-6 rounded-xl border bg-card p-4 shadow-sm transition-all",
      "hover:border-primary/40 hover:shadow-md",
    )}>
      {/* Sparkline cell — same proportions as OpportunityRow */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-accent/[0.06] to-primary/[0.04]"
        aria-label={`Open ${rfs.title} on Y Combinator`}
      >
        <Sparkline seed={rfs.slug} trend="Accelerating" width={140} height={48} />
      </a>

      {/* Body */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="gap-1 bg-accent/90 text-accent-foreground hover:bg-accent">
            YC Request
          </Badge>
          <Badge variant="outline">{batchLabel}</Badge>
        </div>

        <h3 className="mt-2 font-display text-lg leading-snug">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:underline decoration-primary/40 underline-offset-4"
          >
            {rfs.title}
          </a>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{rfs.takeaway}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Button asChild size="sm">
            <a href={href} target="_blank" rel="noreferrer">
              Read on YC
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground/40">YC partner</span>{" "}
            <span className="text-foreground/80">{rfs.author}</span>
          </span>
        </div>
      </div>

      {/* Affordance corner */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="self-start text-muted-foreground transition-transform hover:translate-x-0.5 hover:-translate-y-0.5"
        aria-label="Open in new tab"
      >
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}
