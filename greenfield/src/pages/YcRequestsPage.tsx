import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { YC_RFS_BATCH, ycRfsUrl } from "@/lib/yc-rfs";

export default function YcRequestsPage() {
  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl">
      {/* Hero */}
      <header>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">External directory</p>
          <Badge variant="outline">{YC_RFS_BATCH.label}</Badge>
        </div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight">
          Y Combinator Requests for Startups
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {YC_RFS_BATCH.items.length} problem spaces YC is actively seeking founders for. Each entry below is our brief framing — for the full description and YC's reasoning, follow the link to the source.
        </p>
        <a
          href={YC_RFS_BATCH.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          ycombinator.com/rfs <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>

      {/* Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {YC_RFS_BATCH.items.map((rfs) => (
          <a
            key={rfs.slug}
            href={ycRfsUrl(rfs.slug)}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg leading-snug">{rfs.title}</h3>
              <ExternalLink className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-sm text-foreground/80">{rfs.takeaway}</p>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              YC partner: <span className="text-foreground/70">{rfs.author}</span>
            </p>
          </a>
        ))}
      </div>

      {/* Attribution footer */}
      <footer className="mt-12 rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
        Titles, authors, and topic structure are reproduced from{" "}
        <a href={YC_RFS_BATCH.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Y Combinator's RFS page
        </a>{" "}
        as factual reference. The 1-line framings are Greenfield's own commentary — for YC's actual descriptions and reasoning, please follow the source links above.
      </footer>
    </div>
  );
}
