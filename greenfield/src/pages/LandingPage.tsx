import { Link } from "react-router-dom";
import { ArrowRight, Check, Compass, FileText, Filter, Lock, Mail, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OpportunityRow from "@/components/opportunities/OpportunityRow";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { PRACTICE_OPPORTUNITY_SLUGS } from "@/lib/researchedIdeas";
import { SELF_SERVE_TIERS, TIER_BY_PLAN, type PricingTier } from "@/lib/pricing";

const PREVIEW_COUNT = 10;

export default function LandingPage() {
  const founderOpportunities = SAMPLE_OPPORTUNITIES.filter((opp) => !PRACTICE_OPPORTUNITY_SLUGS.has(opp.slug));
  const practiceCount = SAMPLE_OPPORTUNITIES.filter((opp) => PRACTICE_OPPORTUNITY_SLUGS.has(opp.slug)).length;
  const totalCount = founderOpportunities.length;
  const previewCount = Math.min(PREVIEW_COUNT, totalCount);
  const featured = [...founderOpportunities]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.rank - b.rank)
    .slice(0, previewCount);
  const lockedCount = Math.max(0, totalCount - previewCount);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="container-wide py-20 md:py-28 text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {founderOpportunities.length} founder opportunities live · {practiceCount} practice builds
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl md:text-6xl leading-[1.05]">
            Find your next startup. Skip the blank page.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Greenfield is a curated catalogue of unbuilt startup opportunities, plus a separate practice library for sharpening your AI shipping skills. Each brief drops straight into Claude Code, Cursor, or Codex.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Get instant access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            From $97/year. Preview {previewCount} opportunities below — sign up to unlock the rest.
          </p>
        </div>
      </section>

      {/* Social proof — coding-assistant logos */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="container-wide py-8 flex flex-col items-center gap-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Built for founders shipping with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            <AssistantLogo src="/logos/claude-code.png" alt="Claude Code" />
            <AssistantLogo src="/logos/cursor.jpeg" alt="Cursor" />
            <AssistantLogo src="/logos/codex.jpeg" alt="Codex" />
            <AssistantLogo src="/logos/v0.jpeg" alt="v0" />
            <AssistantLogo src="/logos/bolt.png" alt="Bolt" />
          </div>
        </div>
      </section>

      {/* Preview opportunities */}
      <section className="border-b border-border/60">
        <div className="container-wide py-16">
          <div className="space-y-3">
            {featured.map((opp) => <OpportunityRow key={opp.id} opp={opp} />)}
          </div>

          {lockedCount > 0 && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-dashed bg-gradient-to-b from-card to-muted/30">
              <div className="pointer-events-none absolute inset-x-0 top-0 space-y-3 p-4 opacity-30 blur-[1px]">
                <div className="h-20 rounded-lg border bg-card" />
                <div className="h-20 rounded-lg border bg-card" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
              <div className="relative px-6 py-16 text-center">
                <Lock className="mx-auto h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-xl">
                  {lockedCount} more opportunities behind sign-up.
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Full briefs, filters, saved lists, and downloadable Markdown specs.
                  Scout is $97/year — cancel anytime.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link to="/auth?mode=signup">
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <a href="#pricing">See pricing</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
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
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Choose your plan.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Browse on Scout, claim and run agents on Entrepreneur, or bring a studio team on Venture Studio.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
            {SELF_SERVE_TIERS.map((tier) => <LandingTierCard key={tier.plan} tier={tier} />)}
          </div>

          <UniversityCard tier={TIER_BY_PLAN.university} />

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
              q="What's the difference between Scout, Entrepreneur, and Venture Studio?"
              a="Scout ($97/yr) gives one founder full access to the catalogue and downloadable briefs. Entrepreneur ($197/yr) adds one exclusive idea claim per year — when you claim an idea it disappears from everyone else's catalogue and unlocks a four-agent team (GTM, Sales, Marketing, Engineering) tailored to that idea. Venture Studio ($12,000/yr) is the same but for a 5-seat team with 10 claims/week shared across the team."
            />
            <Faq
              q="What does 'claim an idea' actually do?"
              a="It hides the opportunity from everyone else on the platform, opens a private workspace for you, and spins up four agents (GTM, Sales, Marketing, Engineering) that are pre-configured with the idea's audience, market, and build path. Release the claim at any time and the idea returns to the public catalogue."
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
            Create an account, pick one, and have a working scaffold by tomorrow.
          </p>
          <Button size="lg" asChild className="mt-6">
            <Link to="/auth?mode=signup">
              Get instant access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function LandingTierCard({ tier }: { tier: PricingTier }) {
  const mailto = `mailto:hello@greenfield.app?subject=${encodeURIComponent(`${tier.name} inquiry`)}`;
  const signupHref = `/auth?mode=signup&plan=${tier.plan}`;
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border p-6 " +
        (tier.highlight
          ? "border-primary/50 bg-gradient-to-br from-primary/[0.05] to-accent/[0.07] shadow-md"
          : "bg-card")
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl">{tier.name}</h3>
        {tier.highlight && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">Recommended</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl">{tier.priceLabel}</span>
        <span className="text-sm text-muted-foreground">{tier.per}</span>
      </div>
      {tier.priceFootnote && <p className="mt-0.5 text-xs text-primary">{tier.priceFootnote}</p>}

      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button asChild variant={tier.highlight ? "default" : "outline"} className="mt-7 w-full">
        {tier.contactOnly ? (
          <a href={mailto}><Mail className="h-4 w-4" />{tier.cta}</a>
        ) : (
          <Link to={signupHref}><Lock className="h-4 w-4" />{tier.cta}</Link>
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Cancel anytime. No questions asked.</p>
    </div>
  );
}

function UniversityCard({ tier }: { tier: PricingTier }) {
  const mailto = `mailto:hello@greenfield.app?subject=${encodeURIComponent(`${tier.name} inquiry`)}`;
  return (
    <div className="mx-auto mt-6 max-w-6xl rounded-2xl border bg-card p-6 md:flex md:items-center md:justify-between md:gap-8">
      <div>
        <h3 className="font-display text-xl">{tier.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {tier.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button asChild className="mt-4 md:mt-0">
        <a href={mailto}><Mail className="h-4 w-4" />{tier.cta}</a>
      </Button>
    </div>
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

function AssistantLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100">
      <img
        src={src}
        alt={alt}
        className="h-7 w-7 rounded-md object-contain"
        loading="lazy"
      />
      <span className="text-sm font-medium text-foreground/80">{alt}</span>
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
