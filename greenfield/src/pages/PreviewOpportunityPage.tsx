import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Copy, Download, FileText, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import OpportunityThumbnail from "@/components/opportunities/OpportunityThumbnail";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { briefForOpportunity } from "@/lib/briefSynth";
import { cn } from "@/lib/utils";
import { DIFFICULTY_TONE } from "@/lib/vocab";

/**
 * Public-facing preview page. Rendered inside MarketingLayout (no sidebar, no
 * auth required). Shows the full opportunity card + an unlocked build brief so
 * landing-page visitors can verify the product is real before signing up.
 *
 * Only opportunities present in SAMPLE_OPPORTUNITIES are previewable; everything
 * else 404s the visitor back to the marketing site.
 */
export default function PreviewOpportunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const opp = SAMPLE_OPPORTUNITIES.find((o) => o.slug === slug);
  const [briefOpen, setBriefOpen] = useState(false);

  if (!opp) {
    return (
      <section className="container-wide py-20 text-center max-w-2xl">
        <h1 className="font-display text-3xl">Preview unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This opportunity isn't part of the public preview set.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to homepage</Link>
        </Button>
      </section>
    );
  }

  const brief = briefForOpportunity(opp);
  const oppSlug = opp.slug;

  const sections = [
    { title: "The gap", body: opp.the_gap },
    { title: "The play", body: opp.the_play },
    { title: "Market size", body: opp.market_size_summary },
    { title: "Why now", body: opp.timing_rationale },
    { title: "How to build it", body: opp.build_path },
  ];

  async function copy() {
    await navigator.clipboard.writeText(brief);
    toast.success("Brief copied — paste it into Claude Code, Cursor, or Codex");
  }

  function download() {
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${oppSlug}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Brief downloaded");
  }

  return (
    <article className="container-wide py-10 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
        <Badge variant="soft" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Free preview
        </Badge>
      </div>

      {/* Hero */}
      <header className="mt-6">
        <div className="rounded-2xl border bg-card p-1">
          <div className="h-40 rounded-xl overflow-hidden">
            <OpportunityThumbnail opp={opp} />
          </div>
        </div>

        <h1 className="mt-6 font-display text-3xl md:text-4xl leading-tight">{opp.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{opp.one_liner}</p>

        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          <Badge variant="soft">{opp.industry}</Badge>
          {opp.niche && <Badge variant="outline">{opp.niche}</Badge>}
          <Badge variant="outline">{opp.audience}</Badge>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              DIFFICULTY_TONE[opp.difficulty] ?? "bg-muted",
            )}
          >
            {opp.difficulty}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <Stat label="Model" value={opp.model_type} />
          <Stat label="Capital" value={opp.starting_capital} />
          <Stat label="Launch" value={opp.time_to_launch} />
          <Stat label="Demand" value={opp.demand_trend} />
        </div>
      </header>

      <Separator className="my-10" />

      {/* The five framing sections */}
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl">{s.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{s.body}</p>
          </section>
        ))}
      </div>

      <Separator className="my-10" />

      {/* Unlocked build brief */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/[0.04] to-accent/[0.06] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <FileText className="h-5 w-5" />
              Build brief
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Free for previewers. Paste this into Claude Code, Codex, or Cursor to scaffold {opp.title}.
            </p>
          </div>
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-900 hover:bg-emerald-500/30 border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Unlocked
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setBriefOpen((v) => !v)}>
            <FileText className="h-4 w-4" />
            {briefOpen ? "Hide brief" : "Open brief"}
          </Button>
          <Button variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" onClick={download}>
            <Download className="h-4 w-4" />
            Download .md
          </Button>
        </div>

        {briefOpen && (
          <pre className="mt-5 max-h-[60vh] overflow-auto rounded-md border bg-background/80 p-4 text-xs leading-relaxed whitespace-pre-wrap">
            {brief}
          </pre>
        )}
      </section>

      {/* Upgrade CTA */}
      <section className="mt-10 rounded-2xl border border-primary/30 bg-primary/[0.05] p-6 text-center">
        <Lock className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mt-3 font-display text-2xl">
          This is one of 10 free previews. The full catalogue has 200+ more.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Sign up for Scout to filter every opportunity, save your shortlist, and unlock
          weekly demand signals. Or upgrade to Entrepreneur to claim one exclusively and
          fire the four-agent team on it.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/auth?mode=signup">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/#pricing">See pricing</Link>
          </Button>
        </div>
      </section>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
