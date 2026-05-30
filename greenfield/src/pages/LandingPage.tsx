import { Link } from "react-router-dom";
import { ArrowRight, Check, FileCheck2, GraduationCap, Hammer, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAREER_TIER } from "@/lib/pricing";
import { CAREER_TRACK_AI_AUTOMATION_SPECIALIST, CAREER_PROJECTS } from "@/lib/careerSeed";

export default function LandingPage() {
  const track = CAREER_TRACK_AI_AUTOMATION_SPECIALIST;
  const projects = CAREER_PROJECTS.filter((p) => p.track_slug === track.slug).sort((a, b) => a.ordinal - b.ordinal);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="container-wide py-20 md:py-28 text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            {track.title} track · {projects.length} hireable projects · {track.est_duration}
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl md:text-6xl leading-[1.05]">
            Don't watch courses. Build the portfolio that gets you hired.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {track.hero_promise} Every project is graded against a rubric like a junior AI engineer would be —
            and pass all five to publish a verified portfolio employers can trust.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Start the track
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {CAREER_TIER.priceLabel}{CAREER_TIER.per} · {CAREER_TIER.priceFootnote}. Cancel anytime.
          </p>
        </div>
      </section>

      {/* The 5 projects */}
      <section className="border-b border-border/60">
        <div className="container-wide py-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">The track</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Five projects. Five hireable skills.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{track.summary}</p>
          </div>

          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {projects.map((p) => (
              <li key={p.slug} className="rounded-xl border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Project {p.ordinal}</p>
                <p className="mt-2 font-medium leading-snug">{p.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{p.hireable_skill}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border/60 bg-muted/30">
        <div className="container-wide py-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Build, defend, get verified.</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step
              n="01"
              icon={<Hammer className="h-5 w-5" />}
              title="Build the real thing"
              body="Each project ships a working system — a RAG bot, a CRM automation, a production AI app — with a repo, a live deploy, and a demo. No multiple-choice quizzes."
            />
            <Step
              n="02"
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Get graded on a rubric"
              body="An evaluator scores every criterion and gives feedback you can act on. Anti-cheat checkpoints make you defend your decisions in your own words — generic answers fail."
            />
            <Step
              n="03"
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Publish a verified portfolio"
              body="Pass all five and your /portfolio/your-name page goes live with the verified badge — proof you can point employers to."
            />
          </div>
        </div>
      </section>

      {/* Why this is different */}
      <section className="border-b border-border/60">
        <div className="container-wide py-16 max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Why it's different</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">A credential you can actually trust.</h2>
          </div>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span><span className="text-foreground font-medium">No video courses.</span> You build, you don't watch.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span><span className="text-foreground font-medium">Anti-cheat checkpoints.</span> Every project asks you to explain decisions in your own words. Generic AI-default answers fail evaluation.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span><span className="text-foreground font-medium">Rubric-based grading.</span> Specific scores per criterion, with feedback you can act on. Optional human review for borderline calls.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span><span className="text-foreground font-medium">Verified public portfolio.</span> Pass all 5 projects and your <code className="rounded bg-muted px-1 py-0.5 text-xs">/portfolio/your-name</code> page goes live with the verified badge.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border/60 bg-muted/30">
        <div className="container-wide py-16">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">One plan. Everything included.</h2>
          </div>

          <div className="mt-10 mx-auto max-w-md">
            <div className="relative flex flex-col rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/[0.05] to-accent/[0.07] p-6 shadow-md">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl">{CAREER_TIER.name}</h3>
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">Recommended</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{CAREER_TIER.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl">{CAREER_TIER.priceLabel}</span>
                <span className="text-sm text-muted-foreground">{CAREER_TIER.per}</span>
              </div>
              {CAREER_TIER.priceFootnote && <p className="mt-0.5 text-xs text-primary">{CAREER_TIER.priceFootnote}</p>}

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {CAREER_TIER.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-7 w-full">
                <Link to={`/auth?mode=signup&plan=${CAREER_TIER.plan}`}>
                  <Lock className="h-4 w-4" />
                  {CAREER_TIER.cta}
                </Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">Cancel anytime. No questions asked.</p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border bg-card p-6 text-center">
            <h3 className="font-display text-lg">Universities & accelerators</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cohort accounts, co-branded reporting, and curriculum support for programs.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <a href="mailto:hello@greenfield.app?subject=Cohort%20inquiry"><Mail className="h-4 w-4" />Contact us</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border/60">
        <div className="container-wide py-16 max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Questions we get a lot.</h2>
          </div>
          <div className="mt-10 space-y-4">
            <Faq
              q="Do I need to know how to code already?"
              a="You should be comfortable writing and running code with a coding assistant like Claude Code, Cursor, or Codex. The track assumes you can ship a small app; it teaches you to build production-grade AI systems on top of that."
            />
            <Faq
              q="How is the grading done?"
              a="Each project has a rubric with specific criteria and pass thresholds. When you submit your repo, deploy URL, and written answers, an evaluator scores every criterion and returns feedback. Borderline scores can be sent for optional human review."
            />
            <Faq
              q="What stops people from cheating with AI?"
              a="Every project includes anti-cheat questions that require you to explain your own decisions — chunking tradeoffs, failure cases, architecture calls — with a minimum length. Generic, AI-default answers fail evaluation."
            />
            <Faq
              q="What is the verified portfolio?"
              a="Pass all five projects and your public page at /portfolio/your-name goes live with a verified badge listing the projects you completed. Share it with employers as proof of real, graded work."
            />
            <Faq
              q="How long does it take?"
              a={`The ${track.title} track is designed to take ${track.est_duration} at a focused pace, but you work at your own speed — your plan includes a monthly pool of mentor and evaluator agent runs.`}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="container-wide py-20 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Stop collecting certificates nobody trusts.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Build five real AI systems, get them graded, and graduate with a portfolio that proves it.
          </p>
          <Button size="lg" asChild className="mt-6">
            <Link to="/auth?mode=signup">
              Start the track
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, body }: { readonly n: string; readonly icon: React.ReactNode; readonly title: string; readonly body: string }) {
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

function Faq({ q, a }: { readonly q: string; readonly a: string }) {
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
