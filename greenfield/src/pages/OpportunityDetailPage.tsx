import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Sparkline from "@/components/opportunities/Sparkline";
import SaveButton from "@/components/opportunities/SaveButton";
import BuildBriefPanel from "@/components/opportunities/BuildBriefPanel";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import type { Opportunity } from "@/lib/types";
import { DIFFICULTY_TONE } from "@/lib/vocab";
import { cn } from "@/lib/utils";

export default function OpportunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: opp, isLoading, error } = useQuery({
    queryKey: ["opportunity", slug, isSupabaseConfigured],
    enabled: !!slug,
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return SAMPLE_OPPORTUNITIES.find((o) => o.slug === slug) ?? null;
      }
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Opportunity | null;
    },
  });

  if (isLoading) {
    return (
      <div className="px-6 md:px-10 py-10 max-w-3xl">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="px-6 py-20 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl">Opportunity not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or the link is wrong.</p>
        <Button asChild className="mt-6"><Link to="/">Back to catalogue</Link></Button>
      </div>
    );
  }

  return (
    <article className="px-6 md:px-10 py-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <SaveButton opportunityId={opp.id} />
      </div>

      {/* Hero */}
      <header className="mt-6">
        <h1 className="font-display text-3xl md:text-4xl leading-tight">{opp.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {opp.featured && (
            <Badge className="bg-accent/90 text-accent-foreground hover:bg-accent">Featured</Badge>
          )}
          <Badge variant="soft">{opp.industry}</Badge>
          {opp.niche && <Badge variant="outline">{opp.niche}</Badge>}
          <Badge variant="outline">{opp.audience}</Badge>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", DIFFICULTY_TONE[opp.difficulty] ?? "bg-muted")}>
            {opp.difficulty}
          </span>
        </div>

        <p className="mt-5 text-lg text-foreground/80">{opp.one_liner}</p>
      </header>

      <Separator className="my-8" />

      {/* Long-form sections */}
      <Section title="The gap"        body={opp.the_gap} />
      <Section title="The play"       body={opp.the_play} />
      <Section title="Market size"    body={opp.market_size_summary} />
      <Section title="Why now"        body={opp.timing_rationale} />
      <Section title="How to build it" body={opp.build_path} />

      <Separator className="my-10" />

      {/* Demand signal chart */}
      <section>
        <h2 className="font-display text-xl">Demand signal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Synthetic trend illustrating the <span className="font-medium">{opp.demand_trend.toLowerCase()}</span> shape — wire real data in production.
        </p>
        <div className="mt-4 rounded-xl border bg-card p-4">
          <Sparkline seed={opp.slug} trend={opp.demand_trend} width={720} height={180} showAxis className="block w-full h-auto" />
        </div>
      </section>

      <Separator className="my-10" />

      {/* Classifications */}
      <section>
        <h2 className="font-display text-xl">Classifications</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          <Row label="Industry"          value={opp.industry} />
          <Row label="Niche"             value={opp.niche ?? "—"} />
          <Row label="Business model"    value={opp.model_type} />
          <Row label="Audience"          value={opp.audience} />
          <Row label="Revenue ceiling"   value={opp.revenue_ceiling} />
          <Row label="Founder path"      value={opp.founder_path} />
          <Row label="Starting capital"  value={opp.starting_capital} />
          <Row label="Time to launch"    value={opp.time_to_launch} />
          <Row label="Build approach"    value={opp.build_stack_hint} />
          <Row label="Moat"              value={opp.moat} />
          <Row label="Distribution"      value={opp.distribution_play} />
          <Row label="Demand trend"      value={opp.demand_trend} />
        </dl>
      </section>

      <Separator className="my-10" />

      {/* Build-brief CTA */}
      <BuildBriefPanel opportunityId={opp.id} opportunitySlug={opp.slug} opportunityTitle={opp.title} />
    </article>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{body}</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground/90">{value}</dd>
    </div>
  );
}
