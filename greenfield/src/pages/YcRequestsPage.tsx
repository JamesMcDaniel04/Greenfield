import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import YcRfsRow from "@/components/opportunities/YcRfsRow";
import { YC_RFS_BATCH } from "@/lib/yc-rfs";

export default function YcRequestsPage() {
  return (
    <>
      {/* Page header — same shape as BrowsePage hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-accent/[0.06] to-transparent">
        <div className="px-6 md:px-10 pt-10 pb-8 max-w-6xl">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">External directory</p>
            <Badge variant="outline">{YC_RFS_BATCH.label}</Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight">
            YC Requests for Startups
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {YC_RFS_BATCH.items.length} problem spaces Y Combinator is actively seeking founders for this batch.
            Each entry below is our brief framing — for the full description and YC's reasoning, follow the link to the source.
          </p>
          <a
            href={YC_RFS_BATCH.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            ycombinator.com/rfs <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* List — same row layout as the catalogue */}
      <section className="px-6 md:px-10 py-6 max-w-6xl">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm">
            <span className="font-medium">{YC_RFS_BATCH.items.length}</span>
            <span className="text-muted-foreground"> requests</span>
          </p>
        </div>

        <div className="space-y-3 animate-fade-in">
          {YC_RFS_BATCH.items.map((rfs) => (
            <YcRfsRow key={rfs.slug} rfs={rfs} batchLabel={YC_RFS_BATCH.label} />
          ))}
        </div>

        {/* Attribution */}
        <p className="mt-10 rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
          Titles, authors, and topic structure are referenced from{" "}
          <a href={YC_RFS_BATCH.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Y Combinator's RFS page
          </a>. The 1-line framings are Greenfield's own commentary — follow the source links for YC's actual descriptions and reasoning.
        </p>
      </section>
    </>
  );
}
