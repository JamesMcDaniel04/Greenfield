import { Link, useSearchParams, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClaimedIdeas } from "@/lib/claims";
import { AGENT_ROLE_LABEL } from "@/lib/execution";
import { workflowBySlug, workflowFitNarrative, WORKFLOW_GUIDES } from "@/lib/workflows";

export default function WorkflowDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { claims, activeClaim, activeClaimSlug, setActiveClaim } = useClaimedIdeas();

  useEffect(() => {
    const claimSlug = searchParams.get("idea");
    if (claimSlug && claimSlug !== activeClaimSlug && claims.some((claim) => claim.opportunity_slug === claimSlug)) {
      setActiveClaim(claimSlug);
    }
  }, [activeClaimSlug, claims, searchParams, setActiveClaim]);

  const workflow = slug ? workflowBySlug(slug) : null;

  if (!workflow) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl">Workflow not found</h1>
        <p className="mt-2 text-muted-foreground">That workflow slug does not exist in the library.</p>
        <Button asChild className="mt-6">
          <Link to="/workflows">Back to workflows</Link>
        </Button>
      </div>
    );
  }

  const fitNarrative = workflowFitNarrative(workflow, activeClaim);

  return (
    <article className="mx-auto max-w-5xl px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/workflows" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/agents${activeClaim ? `?idea=${encodeURIComponent(activeClaim.opportunity_slug)}` : ""}`}>
              Open agents
            </Link>
          </Button>
          {activeClaim ? (
            <Button asChild>
              <Link to={`/opportunity/${activeClaim.opportunity_slug}`}>
                View claimed idea <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <header className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="soft">{workflow.category}</Badge>
          <Badge variant="outline">{workflow.stage}</Badge>
          <Badge variant="outline">{workflow.setup_time}</Badge>
          <Badge variant="outline">{workflow.automation_level}</Badge>
        </div>

        <h1 className="mt-4 font-display text-3xl leading-tight md:text-4xl">{workflow.title}</h1>
        <p className="mt-3 max-w-3xl text-lg text-foreground/85">{workflow.one_liner}</p>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{workflow.objective}</p>

        {fitNarrative ? (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-sm text-foreground/80">
            {fitNarrative}
          </div>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <Section title="When to run it" body={workflow.when_to_use} />

          <section>
            <h2 className="font-display text-2xl">Agent handoff</h2>
            <div className="mt-4 space-y-3">
              {workflow.steps.map((step, index) => (
                <div key={`${step.owner}-${step.title}`} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full border bg-muted px-2 py-0.5 font-medium">{index + 1}</span>
                    <Badge variant="soft">{AGENT_ROLE_LABEL[step.owner]}</Badge>
                  </div>
                  <h3 className="mt-3 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Implementation modes</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ModeCard title="Validated now" body={workflow.implementation.validated} />
              <ModeCard title="Agent-assisted" body={workflow.implementation.agentic} />
              <ModeCard title="Automate later" body={workflow.implementation.automation} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <ListCard title="Inputs" items={workflow.inputs} />
          <ListCard title="Outputs" items={workflow.outputs} />
          <ListCard title="Metrics" items={workflow.metrics} />

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-display text-2xl">Tool surfaces</h2>
            <div className="mt-4 space-y-3">
              {workflow.tool_surfaces.map((tool) => (
                <div key={tool.name} className="rounded-xl border border-border/70 bg-background p-3">
                  <p className="font-medium">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tool.purpose}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-display text-2xl">Setup guides</h2>
            <div className="mt-4 space-y-3">
              {WORKFLOW_GUIDES.map((guide) => (
                <div key={guide.slug} className="rounded-xl border border-border/70 bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{guide.title}</p>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{guide.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{body}</p>
    </section>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-foreground/85">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-border/70 bg-background px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{title}</p>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
