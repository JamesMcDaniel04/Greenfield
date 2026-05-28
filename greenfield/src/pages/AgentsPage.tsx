import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  Megaphone,
  Microscope,
  Play,
  Rocket,
  Search,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AgentRunDialog from "@/components/agents/AgentRunDialog";
import AgentRunsList from "@/components/agents/AgentRunsList";
import { useClaimedIdeas } from "@/lib/claims";
import { AGENT_BASES, buildAgentTeam } from "@/lib/agentTeam";
import { AGENT_ROLE_LABEL, type AgentRole, type AgentPlan, type ClaimedIdea } from "@/lib/execution";
import { recommendedWorkflowsForClaim, workflowsForAgent } from "@/lib/workflows";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<AgentRole, typeof Bot> = {
  research: Microscope,
  gtm: Target,
  sales: Rocket,
  marketing: Megaphone,
  engineering: Wrench,
  mentor: Bot,
  evaluator: Bot,
};

const ROLE_TONE: Record<AgentRole, string> = {
  research: "border-teal-500/25 bg-teal-50 text-teal-900",
  gtm: "border-primary/20 bg-primary/[0.05] text-primary",
  sales: "border-accent/30 bg-accent/[0.08] text-foreground",
  marketing: "border-emerald-800/15 bg-emerald-900/[0.04] text-emerald-950",
  engineering: "border-slate-400/30 bg-slate-100 text-slate-800",
  mentor: "border-muted bg-muted text-muted-foreground",
  evaluator: "border-muted bg-muted text-muted-foreground",
};

export default function AgentsPage() {
  const [searchParams] = useSearchParams();
  const {
    claims,
    activeClaim,
    activeClaimSlug,
    setActiveClaim,
  } = useClaimedIdeas();
  const [selectedRole, setSelectedRole] = useState<AgentRole>("research");

  useEffect(() => {
    const nextRole = searchParams.get("role");
    if (
      nextRole === "research" ||
      nextRole === "gtm" ||
      nextRole === "sales" ||
      nextRole === "marketing" ||
      nextRole === "engineering"
    ) {
      setSelectedRole(nextRole);
    }
  }, [searchParams]);

  useEffect(() => {
    const claimSlug = searchParams.get("idea");
    if (claimSlug && claimSlug !== activeClaimSlug && claims.some((claim) => claim.opportunity_slug === claimSlug)) {
      setActiveClaim(claimSlug);
    }
  }, [activeClaimSlug, claims, searchParams, setActiveClaim]);

  const team = useMemo(
    () =>
      activeClaim
        ? buildAgentTeam(activeClaim).filter(
            (a) => a.role !== "mentor" && a.role !== "evaluator",
          )
        : [],
    [activeClaim],
  );
  const selectedAgent = team.find((agent) => agent.role === selectedRole) ?? team[0] ?? null;
  const recommended = useMemo(() => recommendedWorkflowsForClaim(activeClaim, 3), [activeClaim]);

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
        {activeClaim ? (
          <div className="mb-6 rounded-2xl border border-primary/15 bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Active claimed idea</p>
                <h1 className="mt-1 font-display text-2xl">{activeClaim.title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activeClaim.one_liner}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to={`/opportunity/${activeClaim.opportunity_slug}`}>View opportunity</Link>
                </Button>
                <Button asChild>
                  <Link to={`/workflows?idea=${encodeURIComponent(activeClaim.opportunity_slug)}`}>
                    Open workflows <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {claims.length > 0 ? (
          <div className="flex flex-wrap gap-2">
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

        {!activeClaim ? (
          <EmptyAgentsState />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {team.map((agent) => {
                  const Icon = ROLE_ICON[agent.role];
                  return (
                    <button
                      key={agent.role}
                      type="button"
                      onClick={() => setSelectedRole(agent.role)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selectedAgent?.role === agent.role
                          ? ROLE_TONE[agent.role]
                          : "border-border bg-background hover:border-primary/20 hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {AGENT_ROLE_LABEL[agent.role]}
                    </button>
                  );
                })}
              </div>

              {selectedAgent ? <AgentDetailCard agent={selectedAgent} claim={activeClaim} /> : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Team operating cadence</p>
                <div className="mt-4 space-y-3">
                  {team.map((agent) => {
                    const Icon = ROLE_ICON[agent.role];
                    return (
                      <div key={agent.role} className="rounded-xl border border-border/70 bg-background p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <p className="font-medium">{agent.name}</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{agent.handoff}</p>
                        <p className="mt-2 text-xs text-foreground/70">
                          Success metric: <span className="font-medium">{agent.success_metric}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Recommended workflows</p>
                <div className="mt-4 space-y-3">
                  {recommended.map((workflow) => (
                    <Link
                      key={workflow.slug}
                      to={`/workflows/${workflow.slug}?idea=${encodeURIComponent(activeClaim.opportunity_slug)}`}
                      className="block rounded-xl border border-border/70 bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{workflow.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{workflow.one_liner}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {AGENT_BASES.filter((agent) => agent.role !== "mentor" && agent.role !== "evaluator").map((agent) => {
            const Icon = ROLE_ICON[agent.role];
            return (
              <div key={agent.role} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-full border p-2", ROLE_TONE[agent.role])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.tagline}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{agent.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.deliverables.slice(0, 2).map((deliverable) => (
                    <Badge key={deliverable} variant="soft">{deliverable}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function AgentDetailCard({ agent, claim }: { agent: AgentPlan; claim: ClaimedIdea }) {
  const Icon = ROLE_ICON[agent.role];
  const [runOpen, setRunOpen] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(agent.starter_prompt);
    toast.success(`${agent.name} charter copied`);
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.05] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <Icon className="h-3.5 w-3.5" />
            {AGENT_ROLE_LABEL[agent.role]}
          </div>
          <h2 className="mt-3 font-display text-2xl">{agent.name}</h2>
          <p className="mt-1 text-muted-foreground">{agent.tagline}</p>
          <p className="mt-4 text-sm text-foreground/85">{agent.mission}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setRunOpen(true)}>
            <Play className="h-4 w-4" />
            Run agent
          </Button>
          <Button variant="outline" onClick={() => { void copyPrompt(); }}>
            <Copy className="h-4 w-4" />
            Copy charter
          </Button>
          <Button variant="ghost" asChild>
            <Link to={`/workflows?idea=${encodeURIComponent(claim.opportunity_slug)}&role=${agent.role}`}>
              Workflows <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <AgentRunDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        agent={agent}
        claim={claim}
      />

      <div className="mt-5 grid gap-5 2xl:grid-cols-2">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Instructions</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/85">
              {agent.instructions.map((instruction) => (
                <li key={instruction} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Allowed tools</p>
            <div className="mt-3 space-y-2">
              {agent.allowed_tools.map((tool) => (
                <div key={tool.name} className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="font-medium">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Deliverables</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.deliverables.map((deliverable) => (
                <Badge key={deliverable} variant="outline">{deliverable}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Starter prompt</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl border bg-background p-4 text-xs leading-relaxed text-foreground/85">
              <code>{agent.starter_prompt}</code>
            </pre>
          </div>
        </div>
      </div>

      <WorkflowsForAgent agentRole={agent.role} claim={claim} />

      <div className="mt-6 border-t border-border/70 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Recent runs</p>
        </div>
        <div className="mt-3">
          <AgentRunsList claim={claim} role={agent.role} />
        </div>
      </div>
    </div>
  );
}

function WorkflowsForAgent({ agentRole, claim }: { agentRole: AgentRole; claim: ClaimedIdea }) {
  const workflows = useMemo(() => workflowsForAgent(agentRole, claim, 5), [agentRole, claim]);
  if (workflows.length === 0) return null;
  return (
    <div className="mt-6 border-t border-border/70 pt-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
        Workflows this agent owns
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {workflows.map(({ workflow, relation }) => (
          <Link
            key={workflow.slug}
            to={`/workflows/${workflow.slug}?idea=${encodeURIComponent(claim.opportunity_slug)}`}
            className="rounded-xl border border-border/70 bg-background p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium leading-tight">{workflow.title}</p>
              <Badge variant={relation === "primary" ? "soft" : "outline"} className="shrink-0 text-[10px]">
                {relation === "primary" ? "Owner" : "Support"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{workflow.one_liner}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyAgentsState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">No claimed idea yet</p>
        <h2 className="mt-2 font-display text-2xl">Claim an opportunity first, then the team snaps into focus.</h2>
        <p className="mt-3 text-muted-foreground">
          The MVP is local-first: claim an idea from its detail page, then this workspace generates the four-agent team around that idea's audience, distribution wedge, and launch window.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/browse">
              Browse ideas <Search className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/workflows">
              Explore workflows <Sparkles className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
