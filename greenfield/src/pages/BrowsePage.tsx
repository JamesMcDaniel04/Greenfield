import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import OpportunityCard from "@/components/opportunities/OpportunityCard";
import FilterSidebar from "@/components/opportunities/FilterSidebar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { emptyFilters, type Filters, type Opportunity } from "@/lib/types";

export default function BrowsePage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["opportunities", isSupabaseConfigured],
    queryFn: async () => {
      if (!isSupabaseConfigured) return SAMPLE_OPPORTUNITIES;
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("featured", { ascending: false })
        .order("rank", { ascending: true });
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  const industries = useMemo(() => {
    const set = new Set(opps.map((o) => o.industry));
    return [...set].sort();
  }, [opps]);

  const filtered = useMemo(() => filter(opps, filters), [opps, filters]);

  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="container-wide py-16 md:py-24">
          <p className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            Greenfield catalogue
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">
            Opportunities nobody has built — with the brief to ship them.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Each entry is a specific, unbuilt product backed by a real demand signal.
            Pro members get a download-ready Markdown brief that drops straight into
            Claude Code, Cursor, or Codex.
          </p>
        </div>
      </section>

      <section className="container-wide grid gap-10 py-10 md:grid-cols-[16rem_1fr]">
        <FilterSidebar filters={filters} setFilters={setFilters} industries={industries} />

        <div>
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">
              {isLoading ? "Loading…" : `${filtered.length} opportunit${filtered.length === 1 ? "y" : "ies"}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length !== opps.length && `of ${opps.length} total`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
              <p className="font-display text-lg">Nothing matches those filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing a few and see what's underneath.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 animate-fade-in">
              {filtered.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function filter(opps: Opportunity[], f: Filters): Opportunity[] {
  const q = f.q.trim().toLowerCase();
  return opps.filter((o) => {
    if (f.industries.length   && !f.industries.includes(o.industry))            return false;
    if (f.audiences.length    && !f.audiences.includes(o.audience))             return false;
    if (f.difficulties.length && !f.difficulties.includes(o.difficulty))        return false;
    if (f.modelTypes.length   && !f.modelTypes.includes(o.model_type))          return false;
    if (f.capitals.length     && !f.capitals.includes(o.starting_capital))      return false;
    if (f.times.length        && !f.times.includes(o.time_to_launch))           return false;
    if (f.stacks.length       && !f.stacks.includes(o.build_stack_hint))        return false;
    if (q) {
      const haystack = `${o.title} ${o.one_liner} ${o.the_gap} ${o.industry} ${o.niche ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
