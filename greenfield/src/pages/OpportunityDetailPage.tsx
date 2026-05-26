import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Sparkline from "@/components/opportunities/Sparkline";
import SaveButton from "@/components/opportunities/SaveButton";
import ClaimIdeaButton from "@/components/opportunities/ClaimIdeaButton";
import BuildBriefPanel from "@/components/opportunities/BuildBriefPanel";
import SourcesSection from "@/components/opportunities/SourcesSection";
import { publishedOpportunityFromRow } from "@/lib/catalogue";
import { isPracticeOpportunity, practiceMetaForOpportunity } from "@/lib/practiceIdeas";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { YC_RFS_BATCH, ycRfsUrl } from "@/lib/yc-rfs";
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
        return publishedOpportunityFromRow(slug ? { slug } : null);
      }
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return publishedOpportunityFromRow((data as Opportunity | null) ?? { slug: slug! });
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
        <Button asChild className="mt-6"><Link to="/browse">Back to catalogue</Link></Button>
      </div>
    );
  }

  const isPractice = isPracticeOpportunity(opp);
  const practiceMeta = practiceMetaForOpportunity(opp);
  const backHref = isPractice ? "/practice" : "/browse";
  const sections = isPractice
    ? [
        { title: "Workflow to improve", body: opp.the_gap },
        { title: "Why this is a strong practice build", body: opp.the_play },
        { title: "What makes the workflow real", body: opp.market_size_summary },
        { title: "Why this stack matters", body: opp.timing_rationale },
        { title: "How to build it", body: opp.build_path },
      ]
    : [
        { title: "The gap", body: opp.the_gap },
        { title: "The play", body: opp.the_play },
        { title: "Market size", body: opp.market_size_summary },
        { title: "Why now", body: opp.timing_rationale },
        { title: "How to build it", body: opp.build_path },
      ];

  return (
    <article className="px-6 md:px-10 py-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          {!isPractice && <ClaimIdeaButton opportunity={opp} variant="outline" size="sm" />}
          <SaveButton opportunityId={opp.id} />
        </div>
      </div>

      {/* Hero */}
      <header className="mt-6">
        <h1 className="font-display text-3xl md:text-4xl leading-tight">{opp.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {isPractice && (
            <Badge className="bg-slate-900 text-white hover:bg-slate-900">Practice build</Badge>
          )}
          {opp.yc_rfs_slug && (
            <Badge className="gap-1 bg-accent/90 text-accent-foreground hover:bg-accent">
              <Rocket className="h-3 w-3" />
              YC Request
            </Badge>
          )}
          {opp.featured && !opp.yc_rfs_slug && (
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

        {opp.yc_rfs_slug && (() => {
          const rfs = YC_RFS_BATCH.items.find((r) => r.slug === opp.yc_rfs_slug);
          if (!rfs) return null;
          return (
            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
              <p className="text-muted-foreground">
                Seeded by Y Combinator's <span className="font-medium text-foreground">{rfs.title}</span> Request for Startups
                ({YC_RFS_BATCH.label}). Greenfield's brief above is original; for YC's own framing of the topic, see the source.
              </p>
              <a
                href={ycRfsUrl(rfs.slug)}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-primary hover:underline"
              >
                Read YC's take <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          );
        })()}
      </header>

      <Separator className="my-8" />

      {/* Long-form sections */}
      {sections.map((section) => (
        <Section key={section.title} title={section.title} body={section.body} />
      ))}

      <Separator className="my-10" />

      {isPractice && practiceMeta ? (
        <section className="rounded-2xl border bg-gradient-to-br from-slate-50 via-card to-primary/[0.06] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Practice stack</p>
          <h2 className="mt-2 font-display text-2xl">Use this project to learn a hireable stack, not to invent a company.</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {practiceMeta.hiring_context}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {practiceMeta.tools.map((tool) => (
              <Badge key={tool} variant="outline">{tool}</Badge>
            ))}
            {practiceMeta.skills.map((skill) => (
              <Badge key={skill} variant="soft">{skill}</Badge>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Execution stack</p>
          <h2 className="mt-2 font-display text-2xl">Claim this idea, then activate the team around it.</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            The MVP routes each claimed opportunity into a four-agent team and a founder workflow library.
            GTM, Sales, Marketing, and Engineering stay attached to this brief instead of drifting into generic advice.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ClaimIdeaButton opportunity={opp} />
            <Button asChild variant="outline">
              <Link to={`/agents?idea=${encodeURIComponent(opp.slug)}`}>Open Agents</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/workflows?idea=${encodeURIComponent(opp.slug)}`}>Open Workflows</Link>
            </Button>
          </div>
        </section>
      )}

      <Separator className="my-10" />

      {isPractice && practiceMeta ? (
        <section>
          <h2 className="font-display text-xl">Skill signal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice ideas are scored by the stack they teach and how transferable those skills are to product and engineering work.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Hiring signal</p>
              <p className="mt-2 font-display text-xl">{practiceMeta.hiring_signal}</p>
              <p className="mt-2 text-sm text-muted-foreground">{practiceMeta.hiring_context}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Common tools</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {practiceMeta.tools.map((tool) => (
                  <Badge key={tool} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">What you practice</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {practiceMeta.skills.map((skill) => (
                  <Badge key={skill} variant="soft">{skill}</Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <h2 className="font-display text-xl">Demand signal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Synthetic trend illustrating the <span className="font-medium">{opp.demand_trend.toLowerCase()}</span> shape — wire real data in production.
          </p>
          <div className="mt-4 rounded-xl border bg-card p-4">
            <Sparkline seed={opp.slug} trend={opp.demand_trend} width={720} height={180} showAxis className="block w-full h-auto" />
          </div>
        </section>
      )}

      <Separator className="my-10" />

      {/* Cited sources / signals from the n8n pipeline */}
      <SourcesSection sources={opp.sources} />

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
          {isPractice && practiceMeta ? (
            <>
              <Row label="Skill focus"     value={practiceMeta.skills.join(" · ")} />
              <Row label="Common tools"    value={practiceMeta.tools.join(" · ")} />
              <Row label="Hiring signal"   value={practiceMeta.hiring_signal} />
            </>
          ) : (
            <>
              <Row label="Moat"              value={opp.moat} />
              <Row label="Distribution"      value={opp.distribution_play} />
              <Row label="Demand trend"      value={opp.demand_trend} />
            </>
          )}
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
