import { Link } from "react-router-dom";
import { ArrowRight, Check, Compass, FileText, Filter, Lock, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OpportunityRow from "@/components/opportunities/OpportunityRow";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { TIERS } from "@/lib/pricing";

export default function LandingPage() {
  const featured = SAMPLE_OPPORTUNITIES.filter((o) => o.featured).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="container-wide py-20 md:py-28 text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {SAMPLE_OPPORTUNITIES.length} opportunities live · {SAMPLE_OPPORTUNITIES.filter(o => o.yc_rfs_slug).length} seeded by YC RFS
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl md:text-6xl leading-[1.05]">
            Find your next startup. Skip the blank page.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Greenfield is a curated catalogue of unbuilt startup opportunities — each with a Markdown build brief that drops straight into Claude Code, Cursor, or Codex. Pick one and ship.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/browse">
                Browse the catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="container-wide py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Built for founders shipping with</span>
          <span className="font-medium text-foreground/80">Claude Code</span>
          <span className="text-foreground/30">·</span>
          <span className="font-medium text-foreground/80">Cursor</span>
          <span className="text-foreground/30">·</span>
          <span className="font-medium text-foreground/80">Codex</span>
          <span className="text-foreground/30">·</span>
          <span className="font-medium text-foreground/80">v0</span>
          <span className="text-foreground/30">·</span>
          <span className="font-medium text-foreground/80">Bolt</span>
        </div>
      </section>

      {/* Featured opportunities */}
      <section className="border-b border-border/60">
        <div className="container-wide py-16">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Featured this week</p>
              <h2 className="mt-1 font-display text-2xl md:text-3xl">A taste of the catalogue.</h2>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/browse">
                View all {SAMPLE_OPPORTUNITIES.length}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 space-y-3">
            {featured.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/browse">View all {SAMPLE_OPPORTUNITIES.length} →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border/60 bg-muted/30">
        <div className="container-wide py-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Three steps from idea to first commit.</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step
              n="01"
              icon={<Filter className="h-5 w-5" />}
              title="Filter to what fits you"
              body="Choose your audience, capital appetite, difficulty, and stack preference. The catalogue narrows from hundreds to the handful you'd actually build."
            />
            <Step
              n="02"
              icon={<Compass className="h-5 w-5" />}
              title="Read the full brief"
              body="Every opportunity has a real demand signal, a market size with numbers, a 'why now' tied to a specific shift, and a concrete week-1 plan."
            />
            <Step
              n="03"
              icon={<FileText className="h-5 w-5" />}
              title="Download and ship"
              body="One click gives you a Markdown build brief — stack, schema, milestones — ready to paste into Claude Code, Cursor, or Codex. Stop scaffolding, start shipping."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border/60">
        <div className="container-wide py-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Annual plans. No metered usage.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Pick a plan and unlock the full catalogue, downloadable briefs, and — on Team — research agents, lead gen, and weekly market reports.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-4xl grid gap-6 md:grid-cols-2">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={
                  "relative flex flex-col rounded-2xl border p-6 " +
                  (tier.highlight
                    ? "border-primary/50 bg-gradient-to-br from-primary/[0.05] to-accent/[0.07] shadow-md"
                    : "bg-card")
                }
              >
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-6 bg-accent text-accent-foreground hover:bg-accent">
                    Most teams pick this
                  </Badge>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl">{tier.name}</h3>
                  {tier.highlight && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Includes Team features
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl">{tier.priceLabel}</span>
                  <span className="text-sm text-muted-foreground">{tier.per}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={tier.highlight ? "default" : "outline"}
                  className="mt-7 w-full"
                >
                  <Link to={`/auth?mode=signup&plan=${tier.name.toLowerCase()}`}>
                    <Lock className="h-4 w-4" />
                    Start {tier.name}
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Annual billing only. Cancel anytime — access stays active through the end of the term.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border/60 bg-muted/30">
        <div className="container-wide py-16 max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Questions we get a lot.</h2>
          </div>
          <div className="mt-10 space-y-4">
            <Faq
              q="Where do the opportunities come from?"
              a="A mix of structural analysis (looking for industries with unmet demand signals and recently-shifted economics) and curation from the team's network. Some are seeded by external lists — YC's Requests for Startups — but every brief is written from scratch."
            />
            <Faq
              q="What's the difference between Starter and Team?"
              a="Starter gives one founder full access to the catalogue and downloadable briefs. Team adds research agents (point one at an industry, get back populated opportunities), lead gen, weekly market reports, and up to 5 seats."
            />
            <Faq
              q="Can I export the briefs to use them offline?"
              a="Yes. Every brief is downloadable as a single Markdown file. Drop it into Claude Code, Cursor, Codex, or whatever your coding agent of choice is — no lock-in."
            />
            <Faq
              q="How often is the catalogue updated?"
              a="New opportunities are added weekly. Team members get a Friday digest of new entries scoped to their saved list."
            />
            <Faq
              q="Is the demand-signal chart real data?"
              a="In the live product, yes — derived from search volume trends, funding activity, and job-posting indices. In demo mode (when you're running this without a backend), the sparklines are synthesised from the opportunity's trend shape."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="container-wide py-20 text-center">
          <Rocket className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Stop scrolling Twitter for ideas.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Open the catalogue, pick one, and have a working scaffold by tomorrow.
          </p>
          <Button size="lg" asChild className="mt-6">
            <Link to="/browse">
              Browse {SAMPLE_OPPORTUNITIES.length} opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
        <span className="rounded-md bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
      <h3 className="mt-4 font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border bg-card px-4 py-3">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-medium">
        <span>{q}</span>
        <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}
