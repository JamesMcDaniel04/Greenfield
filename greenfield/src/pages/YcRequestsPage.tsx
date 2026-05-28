import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import OpportunityRow from "@/components/opportunities/OpportunityRow";
import { publishedOpportunitiesFromRows } from "@/lib/catalogue";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { YC_RFS_BATCH } from "@/lib/yc-rfs";
import type { Opportunity } from "@/lib/types";

export default function YcRequestsPage() {
  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["yc-opportunities", isSupabaseConfigured],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return SAMPLE_OPPORTUNITIES.filter((o) => o.yc_rfs_slug);
      }
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .not("yc_rfs_slug", "is", null)
        .order("rank", { ascending: true });
      if (error) throw error;
      return publishedOpportunitiesFromRows(data as Opportunity[]).filter((o) => o.yc_rfs_slug);
    },
  });

  // Topics that have no Greenfield brief yet — shown as a small "coming soon" tail.
  const coveredSlugs = useMemo(() => new Set(opps.map((o) => o.yc_rfs_slug)), [opps]);
  const uncovered = YC_RFS_BATCH.items.filter((rfs) => !coveredSlugs.has(rfs.slug));

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-accent/[0.06] to-transparent">
        <div className="mx-auto w-full px-6 md:px-10 pt-10 pb-8 max-w-6xl">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-primary">YC Requests for Startups</p>
            <Badge variant="outline">{YC_RFS_BATCH.label}</Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight">
            Greenfield briefs seeded by YC's open requests.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Y Combinator publishes problem spaces they're actively seeking founders for. Each entry below is an original Greenfield opportunity — concrete product, market, and build path — written in response to one of YC's {YC_RFS_BATCH.items.length} current requests.
          </p>
          <a
            href={YC_RFS_BATCH.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            See YC's source list <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Catalogue rows — same component as the main browse page */}
      <section className="mx-auto w-full px-6 md:px-10 py-6 max-w-6xl">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm">
            <span className="font-medium">{isLoading ? "…" : opps.length}</span>
            <span className="text-muted-foreground"> YC-seeded opportunit{opps.length === 1 ? "y" : "ies"}</span>
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-${i}`} className="h-32 animate-pulse rounded-xl border bg-muted/40" />
            ))}
          </div>
        ) : opps.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <p className="font-display text-lg">No YC-seeded briefs yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Tag opportunities with a YC RFS slug in the admin to populate this view.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {opps.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)}
          </div>
        )}

        {/* Coverage tail: topics still without a brief */}
        {uncovered.length > 0 && !isLoading && (
          <div className="mt-10">
            <h2 className="font-display text-lg">No brief yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {uncovered.length} YC topic{uncovered.length === 1 ? "" : "s"} we haven't written a Greenfield brief for. Source descriptions live at ycombinator.com/rfs.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {uncovered.map((rfs) => (
                <li key={rfs.slug}>
                  <a
                    href={`${YC_RFS_BATCH.sourceUrl}#${rfs.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 px-4 py-3 text-sm hover:border-primary/30 hover:bg-card"
                  >
                    <span>
                      <span className="font-medium">{rfs.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">— {rfs.author}</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
