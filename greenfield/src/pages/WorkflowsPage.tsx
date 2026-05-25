import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaimedIdeas } from "@/lib/claims";
import { AGENT_ROLE_LABEL, type AgentRole } from "@/lib/execution";
import {
  scoreWorkflowFit,
  WORKFLOW_GUIDES,
  WORKFLOW_LIBRARY,
  workflowFitNarrative,
} from "@/lib/workflows";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "GTM", "Sales", "Marketing", "Engineering"] as const;
const STAGES = ["All", "Foundation", "Launch", "Revenue", "Retention"] as const;
const ROLES = ["all", "gtm", "sales", "marketing", "engineering"] as const;

export default function WorkflowsPage() {
  const [searchParams] = useSearchParams();
  const {
    claims,
    activeClaim,
    activeClaimSlug,
    setActiveClaim,
  } = useClaimedIdeas();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [stage, setStage] = useState<(typeof STAGES)[number]>("All");
  const [role, setRole] = useState<(typeof ROLES)[number]>("all");
  const deferredQ = useDeferredValue(q);

  useEffect(() => {
    const nextRole = searchParams.get("role");
    if (nextRole === "gtm" || nextRole === "sales" || nextRole === "marketing" || nextRole === "engineering") {
      setRole(nextRole);
    }
  }, [searchParams]);

  useEffect(() => {
    const claimSlug = searchParams.get("idea");
    if (claimSlug && claimSlug !== activeClaimSlug && claims.some((claim) => claim.opportunity_slug === claimSlug)) {
      setActiveClaim(claimSlug);
    }
  }, [activeClaimSlug, claims, searchParams, setActiveClaim]);

  const filtered = useMemo(() => {
    const query = deferredQ.trim().toLowerCase();
    return [...WORKFLOW_LIBRARY]
      .filter((workflow) => {
        if (category !== "All" && workflow.category !== category) return false;
        if (stage !== "All" && workflow.stage !== stage) return false;
        if (role !== "all" && workflow.primary_agent !== role && !workflow.support_agents.includes(role as AgentRole)) return false;
        if (query) {
          const haystack = [
            workflow.title,
            workflow.one_liner,
            workflow.objective,
            workflow.when_to_use,
            ...workflow.tags,
          ].join(" ").toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => scoreWorkflowFit(b, activeClaim) - scoreWorkflowFit(a, activeClaim) || a.title.localeCompare(b.title));
  }, [activeClaim, category, deferredQ, role, stage]);

  return (
    <>
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,83,45,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.72),_rgba(255,255,255,0.98))]">
        <div className="max-w-6xl px-6 py-10 md:px-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">Workflow marketplace</p>
          <h1 className="max-w-4xl font-display text-3xl leading-tight md:text-4xl">
            Execution-ready workflows for founders, GTM, and the startup agents running behind them.
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Modeled after an automation library, but aimed at startup execution: founder workflows, GTM loops,
            design-partner outreach, proof extraction, and MVP handoffs that can run manually first and automate later.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {WORKFLOW_GUIDES.map((guide) => (
              <div key={guide.slug} className="rounded-2xl border bg-card/90 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Guide</p>
                <h2 className="mt-2 font-display text-xl">{guide.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{guide.summary}</p>
                <p className="mt-3 text-sm text-foreground/80">{guide.body}</p>
              </div>
            ))}
          </div>

          {activeClaim ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Active claimed idea</p>
                  <p className="mt-1 font-medium">{activeClaim.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeClaim.one_liner}</p>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/agents?idea=${encodeURIComponent(activeClaim.opportunity_slug)}`}>
                    Open agent team <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="max-w-6xl px-6 py-3 md:px-10">
          {claims.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {claims.map((claim) => (
                <button
                  key={claim.opportunity_slug}
                  type="button"
                  onClick={() => setActiveClaim(claim.opportunity_slug)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    activeClaimSlug === claim.opportunity_slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.04]",
                  )}
                >
                  {claim.title}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 pl-9"
                placeholder="Search workflows..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => <FilterPill key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterPill>)}
              {STAGES.map((item) => <FilterPill key={item} active={stage === item} onClick={() => setStage(item)}>{item}</FilterPill>)}
              {ROLES.map((item) => (
                <FilterPill key={item} active={role === item} onClick={() => setRole(item)}>
                  {item === "all" ? "All roles" : AGENT_ROLE_LABEL[item]}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl px-6 py-8 md:px-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="font-medium">{filtered.length}</span>
            <span className="text-muted-foreground"> workflows in the library</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setCategory("All");
              setStage("All");
              setRole("all");
            }}
          >
            Reset filters
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((workflow) => {
            const narrative = workflowFitNarrative(workflow, activeClaim);
            const score = scoreWorkflowFit(workflow, activeClaim);
            const workflowHref = `/workflows/${workflow.slug}${activeClaim ? `?idea=${encodeURIComponent(activeClaim.opportunity_slug)}` : ""}`;
            return (
              <Link
                key={workflow.slug}
                to={workflowHref}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="soft">{workflow.category}</Badge>
                  <Badge variant="outline">{workflow.stage}</Badge>
                  <Badge variant="outline">{workflow.setup_time}</Badge>
                  <Badge variant="outline">{workflow.automation_level}</Badge>
                  {score > 5 ? <Badge className="bg-accent/90 text-accent-foreground hover:bg-accent">Recommended</Badge> : null}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl leading-tight">{workflow.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{workflow.one_liner}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>

                <p className="mt-4 text-sm text-foreground/85">{workflow.objective}</p>

                {narrative ? (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-sm text-foreground/80">
                    {narrative}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[workflow.primary_agent, ...workflow.support_agents].slice(0, 3).map((agentRole) => (
                    <Badge key={`${workflow.slug}-${agentRole}`} variant="soft">{AGENT_ROLE_LABEL[agentRole]}</Badge>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {workflow.outputs.slice(0, 4).map((output) => (
                    <div key={output} className="rounded-xl border border-border/70 bg-background p-3 text-sm text-foreground/80">
                      {output}
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-8 text-center">
            <p className="font-display text-xl">Nothing matches those filters.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a broader search or clear the role and stage filters.</p>
          </div>
        ) : null}

        {!activeClaim ? (
          <div className="mt-8 rounded-2xl border border-dashed bg-muted/30 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Tailoring unlock</p>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              The library works without a claim, but the sort order and recommendations get meaningfully better once you claim an opportunity.
              That lets the system prioritize workflows by audience, distribution play, and launch horizon.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/browse">
                  Claim an idea first <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.04]",
      )}
    >
      {children}
    </button>
  );
}
