import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import OpportunityRow from "@/components/opportunities/OpportunityRow";
import FilterChip from "@/components/opportunities/FilterChip";
import MoreFiltersDialog from "@/components/opportunities/MoreFiltersDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { additionalFilterCount, matchesBrowseFilters } from "@/lib/browseFilters";
import { publishedOpportunitiesFromRows } from "@/lib/catalogue";
import { useClaimedIdeas } from "@/lib/claims";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { VOCAB } from "@/lib/vocab";
import { emptyFilters, type Filters, type Opportunity } from "@/lib/types";

export default function BrowsePage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const { claims } = useClaimedIdeas();

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["opportunities", isSupabaseConfigured],
    queryFn: async () => {
      if (!isSupabaseConfigured) return SAMPLE_OPPORTUNITIES;
      // visible_opportunities view filters out actively-claimed-by-others rows
      // at the DB layer (security_invoker means RLS still applies per user).
      const { data, error } = await supabase
        .from("visible_opportunities")
        .select("*")
        .order("featured", { ascending: false })
        .order("rank", { ascending: true });
      if (error) throw error;
      return publishedOpportunitiesFromRows(data as Opportunity[]);
    },
  });

  // Demo-mode fallback: in localStorage mode the SQL view doesn't exist, so we
  // hide claimed-by-me slugs client-side. (In Supabase mode the view already
  // hides claimed-by-others; claimed-by-me stays visible so the user can find
  // their workspace from the catalogue.)
  const visibleOpps = useMemo(() => {
    if (isSupabaseConfigured) return opps;
    const claimedSlugs = new Set(claims.map((c) => c.opportunity_slug));
    return opps.filter((o) => !claimedSlugs.has(o.slug));
  }, [opps, claims]);

  const industries = useMemo(() => {
    return [...new Set(visibleOpps.map((o) => o.industry))].sort((a, b) => a.localeCompare(b));
  }, [visibleOpps]);

  const filtered = useMemo(() => visibleOpps.filter((opp) => matchesBrowseFilters(opp, filters)), [visibleOpps, filters]);

  const activeFilterCount =
    filters.industries.length + filters.audiences.length + filters.difficulties.length +
    filters.modelTypes.length + filters.capitals.length + filters.times.length + filters.stacks.length +
    additionalFilterCount(filters);

  return (
    <>
      {/* Page header */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.05] to-transparent">
        <div className="px-6 md:px-10 pt-10 pb-8 max-w-6xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
            Catalogue
          </p>
          <h1 className="font-display text-3xl md:text-4xl leading-tight">
            Opportunities nobody has built — with the brief to ship them.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Each entry is a specific, unbuilt product backed by a real demand signal. Pro members get a download-ready Markdown brief that drops straight into Claude Code, Cursor, or Codex.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="px-6 md:px-10 py-3 max-w-6xl flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9 pr-3 text-sm"
              placeholder="Search opportunities…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              label="Industry"
              options={industries}
              selected={filters.industries}
              onChange={(v) => setFilters({ ...filters, industries: v })}
            />
            <FilterChip
              label="Audience"
              options={VOCAB.audience}
              selected={filters.audiences}
              onChange={(v) => setFilters({ ...filters, audiences: v })}
            />
            <FilterChip
              label="Difficulty"
              options={VOCAB.difficulty}
              selected={filters.difficulties}
              onChange={(v) => setFilters({ ...filters, difficulties: v })}
            />
            <FilterChip
              label="Model"
              options={VOCAB.model_type}
              selected={filters.modelTypes}
              onChange={(v) => setFilters({ ...filters, modelTypes: v })}
            />
            <FilterChip
              label="Capital"
              options={VOCAB.starting_capital}
              selected={filters.capitals}
              onChange={(v) => setFilters({ ...filters, capitals: v })}
            />
            <FilterChip
              label="Launch"
              options={VOCAB.time_to_launch}
              selected={filters.times}
              onChange={(v) => setFilters({ ...filters, times: v })}
            />
            <FilterChip
              label="Build approach"
              options={VOCAB.build_stack_hint}
              selected={filters.stacks}
              onChange={(v) => setFilters({ ...filters, stacks: v })}
            />
            <MoreFiltersDialog
              filters={filters}
              setFilters={setFilters}
              activeCount={additionalFilterCount(filters)}
            />

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setFilters({ ...emptyFilters, q: filters.q })}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-6 md:px-10 py-6 max-w-6xl">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm">
            <span className="font-medium">{isLoading ? "…" : filtered.length}</span>
            <span className="text-muted-foreground">
              {" "}opportunit{filtered.length === 1 ? "y" : "ies"}
              {filtered.length !== visibleOpps.length && visibleOpps.length > 0 && (
                <> · filtered from {visibleOpps.length}</>
              )}
              {claims.length > 0 && (
                <> · {claims.length} hidden (claimed by you)</>
              )}
            </span>
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skel-${i}`} className="h-32 animate-pulse rounded-xl border bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => setFilters({ ...emptyFilters, q: "" })} />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {filtered.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)}
          </div>
        )}
      </section>
    </>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <p className="font-display text-lg">Nothing matches those filters.</p>
      <p className="mt-1 text-sm text-muted-foreground">Try clearing a few and see what's underneath.</p>
      <Button variant="outline" className="mt-4" onClick={onClear}>Clear all filters</Button>
    </div>
  );
}
