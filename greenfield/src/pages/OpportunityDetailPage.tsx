import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, Clock, Gauge, Megaphone, Shield, TrendingUp, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
      <div className="container-narrow py-16">
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
      <div className="container-narrow py-20 text-center">
        <h1 className="font-display text-3xl">Opportunity not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed or the link is wrong.</p>
        <Button asChild className="mt-6"><Link to="/">Back to catalogue</Link></Button>
      </div>
    );
  }

  return (
    <article className="container-narrow py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        All opportunities
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="soft">{opp.industry}</Badge>
          {opp.niche && <Badge variant="outline">{opp.niche}</Badge>}
          <Badge variant="outline">{opp.audience}</Badge>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", DIFFICULTY_TONE[opp.difficulty] ?? "bg-muted")}>
            {opp.difficulty}
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">{opp.title}</h1>
        <p className="mt-3 text-xl text-muted-foreground">{opp.one_liner}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <SaveButton opportunityId={opp.id} />
          <Button variant="ghost" asChild>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(opp.title + " " + opp.industry)}`}
              target="_blank"
              rel="noreferrer"
            >
              Research signal
            </a>
          </Button>
        </div>
      </header>

      <Separator className="my-10" />

      <Section title="The gap" body={opp.the_gap} />
      <Section title="The play" body={opp.the_play} />
      <Section title="Market size" body={opp.market_size_summary} />
      <Section title="Why now" body={opp.timing_rationale} />
      <Section title="How to build it" body={opp.build_path} />

      <Separator className="my-10" />

      <h3 className="font-display text-xl">At a glance</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat icon={<Banknote className="h-4 w-4" />} label="Revenue ceiling" value={opp.revenue_ceiling} />
        <Stat icon={<Wrench className="h-4 w-4" />}    label="Starting capital" value={opp.starting_capital} />
        <Stat icon={<Clock className="h-4 w-4" />}     label="Time to launch" value={opp.time_to_launch} />
        <Stat icon={<Gauge className="h-4 w-4" />}     label="Founder path" value={opp.founder_path} />
        <Stat icon={<Wrench className="h-4 w-4" />}    label="Build approach" value={opp.build_stack_hint} />
        <Stat icon={<Shield className="h-4 w-4" />}    label="Moat" value={opp.moat} />
        <Stat icon={<Megaphone className="h-4 w-4" />} label="Distribution" value={opp.distribution_play} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Demand trend" value={opp.demand_trend} />
      </dl>

      <div className="my-10">
        <BuildBriefPanel opportunityId={opp.id} opportunitySlug={opp.slug} opportunityTitle={opp.title} />
      </div>
    </article>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/90">{body}</p>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
