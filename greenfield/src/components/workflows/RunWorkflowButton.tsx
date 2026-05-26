import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClaimedIdeas } from "@/lib/claims";
import { useRunWorkflow } from "@/lib/workflowRuns";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { WorkflowTemplate } from "@/lib/execution";

type Props = {
  workflow: WorkflowTemplate;
  variant?: "default" | "outline";
};

/**
 * The primary call-to-action on every workflow. Routes through three states:
 *  - No claim yet → "Claim an idea first"
 *  - Claimed → "Run on {idea title}"
 *  - Already running → disabled with a spinner
 *
 * Fires the orchestrator from lib/workflowRuns.ts, which delegates each step
 * to the corresponding agent via the run-agent edge function.
 */
export default function RunWorkflowButton({ workflow, variant = "default" }: Props) {
  const { activeClaim, claims } = useClaimedIdeas();
  const runWorkflow = useRunWorkflow(activeClaim);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  if (!activeClaim) {
    if (claims.length === 0) {
      return (
        <Button asChild variant={variant}>
          <Link to="/browse">
            <Lock className="h-4 w-4" />
            Claim an idea to run this
          </Link>
        </Button>
      );
    }
    // Has claims but none selected (shouldn't happen, but defensive)
    return (
      <Button asChild variant={variant}>
        <Link to="/agents">
          <Lock className="h-4 w-4" />
          Pick an active claim
        </Link>
      </Button>
    );
  }

  async function onRun() {
    try {
      const res = await runWorkflow.mutateAsync({ workflow });
      setLastRunId(res.workflow_run_id);
    } catch {
      // toast already shown by the hook
    }
  }

  return (
    <Button
      variant={variant}
      disabled={runWorkflow.isPending}
      onClick={() => { void onRun(); }}
    >
      {runWorkflow.isPending
        ? <><Sparkles className="h-4 w-4 animate-pulse" />Running on {activeClaim.title}…</>
        : <><Play className="h-4 w-4" />Run on {activeClaim.title}</>
      }
      {!isSupabaseConfigured && (
        <span className="ml-1 text-[10px] uppercase tracking-wider opacity-70">demo</span>
      )}
      {lastRunId && !runWorkflow.isPending && (
        <span className="sr-only">Run started</span>
      )}
    </Button>
  );
}
