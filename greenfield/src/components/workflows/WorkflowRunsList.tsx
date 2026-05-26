import { useState } from "react";
import {
  CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2, XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useWorkflowRuns } from "@/lib/workflowRuns";
import type { ClaimedIdea, WorkflowTemplate } from "@/lib/execution";
import type { WorkflowRun, WorkflowRunStatus, WorkflowStepStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  workflow: WorkflowTemplate;
  claim: ClaimedIdea | null;
};

const ROLE_TONE: Record<string, string> = {
  gtm: "bg-primary/10 text-primary",
  sales: "bg-accent/15 text-accent-foreground",
  marketing: "bg-emerald-100 text-emerald-900",
  engineering: "bg-slate-200 text-slate-900",
};

export default function WorkflowRunsList({ workflow, claim }: Props) {
  const { runs, isLoading } = useWorkflowRuns(claim, workflow.slug);

  if (!claim) {
    return (
      <p className="text-sm text-muted-foreground">
        Claim an idea to see workflow runs here.
      </p>
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading runs…</p>;

  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No runs yet. Hit <span className="font-medium text-foreground">Run on {claim.title}</span> above and watch each agent take its step.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => <WorkflowRunRow key={run.id} run={run} />)}
    </div>
  );
}

function WorkflowRunRow({ run }: { run: WorkflowRun }) {
  const [open, setOpen] = useState(run.status === "running");
  const steps = run.steps ?? [];
  const done = steps.filter((s) => s.status === "succeeded").length;

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          <StatusIcon status={run.status} />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {timeAgo(run.started_at)}
              <span className="ml-2 text-xs text-muted-foreground">
                {done} / {run.step_count} steps
              </span>
            </p>
            {run.error && <p className="mt-0.5 text-xs text-destructive truncate">{run.error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={run.status} />
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <ol className="border-t divide-y">
          {steps.map((step) => (
            <li key={step.id} className="px-4 py-2.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                  {step.ordinal}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("rounded-full px-2 py-px text-[10px] font-medium uppercase tracking-wider", ROLE_TONE[step.owner_role] ?? "bg-muted")}>
                      {step.owner_role}
                    </span>
                    <p className="text-sm font-medium">{step.title}</p>
                    <StepStatusIcon status={step.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                  {step.output_summary && (
                    <p className="mt-1.5 rounded bg-muted/50 px-2 py-1 text-xs text-foreground/80">
                      → {step.output_summary}
                    </p>
                  )}
                  {step.error && (
                    <p className="mt-1.5 rounded bg-destructive/5 px-2 py-1 text-xs text-destructive">
                      {step.error}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: WorkflowRunStatus }) {
  const cls = "h-4 w-4 mt-0.5 flex-shrink-0";
  if (status === "completed") return <CheckCircle2 className={cn(cls, "text-emerald-600")} />;
  if (status === "failed")    return <XCircle      className={cn(cls, "text-destructive")} />;
  if (status === "cancelled") return <XCircle      className={cn(cls, "text-muted-foreground")} />;
  if (status === "running")   return <Loader2      className={cn(cls, "text-amber-600 animate-spin")} />;
  return <Clock className={cn(cls, "text-muted-foreground")} />;
}

function StepStatusIcon({ status }: { status: WorkflowStepStatus }) {
  if (status === "succeeded") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === "failed")    return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "running")   return <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />;
  if (status === "skipped")   return <span className="text-[10px] text-muted-foreground">skipped</span>;
  return null;
}

function StatusBadge({ status }: { status: WorkflowRunStatus }) {
  const tone =
    status === "completed" ? "bg-emerald-100 text-emerald-900"
    : status === "failed"     ? "bg-destructive/10 text-destructive"
    : status === "cancelled"  ? "bg-muted text-muted-foreground"
    : status === "running"    ? "bg-amber-100 text-amber-900"
    : "bg-muted text-muted-foreground";
  return (
    <Badge className={cn("uppercase text-[10px] tracking-wider border-transparent", tone)}>
      {status}
    </Badge>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}
