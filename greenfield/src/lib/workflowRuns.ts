import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ClaimedIdea, WorkflowTemplate } from "@/lib/execution";
import type {
  AgentRun, WorkflowRun, WorkflowStep, WorkflowStepStatus,
} from "@/lib/types";
import { makeDemoRun } from "@/lib/sampleAgentRuns";

const DEMO_WORKFLOWS_KEY = "greenfield.demoWorkflowRuns";
const STEP_DELAY_MS = 1_400; // demo-mode pacing so the UI shows visible progress

// ────────────────────────────────────────────────────────────────────────
// Prompt composition — used by both modes
// ────────────────────────────────────────────────────────────────────────

/**
 * Build the per-step prompt the agent receives. Includes the workflow context,
 * the step's directive, and a short summary of every prior step's output so
 * the agent can pick up where the previous owner left off.
 */
export function composeStepPrompt(args: {
  workflow: WorkflowTemplate;
  step: WorkflowTemplate["steps"][number];
  ordinal: number;
  totalSteps: number;
  claim: ClaimedIdea;
  priorSummaries: Array<{ ordinal: number; owner: string; title: string; summary: string }>;
}): string {
  const { workflow, step, ordinal, totalSteps, claim, priorSummaries } = args;
  const priorBlock = priorSummaries.length
    ? "\n\nPrior steps:\n" + priorSummaries
        .map((p) => `${p.ordinal}. [${p.owner.toUpperCase()}] ${p.title}\n   → ${p.summary}`)
        .join("\n")
    : "";

  return [
    `You are running step ${ordinal} of ${totalSteps} in the "${workflow.title}" workflow on the claimed idea "${claim.title}".`,
    "",
    `Workflow objective: ${workflow.objective}`,
    `Stage: ${workflow.stage} · Category: ${workflow.category} · Setup time: ${workflow.setup_time}`,
    "",
    `Your step: ${step.title}`,
    `Your directive: ${step.description}`,
    "",
    `Inputs available for this workflow: ${workflow.inputs.join(", ")}`,
    `Outputs the workflow expects when complete: ${workflow.outputs.join(", ")}`,
    priorBlock,
    "",
    "Output rules for this step:",
    "- Produce the *minimal* artifact needed to unblock the next step.",
    "- End with a single line beginning `Summary:` that captures your output in under 240 characters — the next agent will see only that summary, not the full body.",
    "- If you can't reasonably complete the step, say so explicitly and propose what's needed before re-running.",
  ].join("\n");
}

/** Extract the trailing `Summary: …` line written by the step prompt rule. */
export function extractSummary(markdown: string | null | undefined, fallback = ""): string {
  if (!markdown) return fallback;
  const lines = markdown.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith("summary:")) {
      return line.slice("summary:".length).trim().slice(0, 240);
    }
  }
  // Fallback: take the first meaningful paragraph
  const para = markdown.trim().split("\n\n")[0].replace(/\s+/g, " ").trim();
  return para.slice(0, 240) || fallback;
}

// ────────────────────────────────────────────────────────────────────────
// Demo-mode persistence
// ────────────────────────────────────────────────────────────────────────

type DemoStore = {
  runs: WorkflowRun[];
  steps: Record<string, WorkflowStep[]>; // keyed by workflow_run_id
};

function readDemoStore(): DemoStore {
  if (typeof window === "undefined") return { runs: [], steps: {} };
  try {
    const raw = window.localStorage.getItem(DEMO_WORKFLOWS_KEY);
    return raw ? JSON.parse(raw) as DemoStore : { runs: [], steps: {} };
  } catch {
    return { runs: [], steps: {} };
  }
}

function writeDemoStore(store: DemoStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_WORKFLOWS_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("greenfield:workflow-runs-changed"));
}

function updateDemoStore(fn: (store: DemoStore) => DemoStore) {
  writeDemoStore(fn(readDemoStore()));
}

// ────────────────────────────────────────────────────────────────────────
// useWorkflowRuns — list runs for a claim + workflow
// ────────────────────────────────────────────────────────────────────────

export function useWorkflowRuns(claim: ClaimedIdea | null, workflowSlug: string | null) {
  const { user } = useAuth();
  const [demoStore, setDemoStore] = useState<DemoStore>(() => readDemoStore());

  useEffect(() => {
    if (isSupabaseConfigured) return;
    const handler = () => setDemoStore(readDemoStore());
    window.addEventListener("greenfield:workflow-runs-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("greenfield:workflow-runs-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const remoteQ = useQuery({
    queryKey: ["workflow-runs", claim?.claim_id, workflowSlug, user?.id],
    enabled: isSupabaseConfigured && !!claim?.claim_id && !!workflowSlug && !!user,
    queryFn: async (): Promise<WorkflowRun[]> => {
      const { data, error } = await supabase
        .from("workflow_runs")
        .select("*, workflow_steps(*)")
        .eq("claim_id", claim!.claim_id!)
        .eq("workflow_slug", workflowSlug!)
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as unknown as Array<WorkflowRun & { workflow_steps: WorkflowStep[] }>).map((r) => ({
        ...r,
        steps: (r.workflow_steps ?? []).sort((a, b) => a.ordinal - b.ordinal),
      }));
    },
  });

  if (isSupabaseConfigured) {
    return {
      runs: remoteQ.data ?? [],
      isLoading: remoteQ.isLoading,
      error: remoteQ.error as Error | null,
    };
  }

  // Demo mode: filter by claim + slug
  const claimId = claim?.claim_id ?? (claim ? `demo-claim-${claim.opportunity_slug}` : "");
  const runs = demoStore.runs
    .filter((r) => r.claim_id === claimId && r.workflow_slug === workflowSlug)
    .map((r) => ({ ...r, steps: (demoStore.steps[r.id] ?? []).sort((a, b) => a.ordinal - b.ordinal) }))
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return { runs, isLoading: false, error: null as Error | null };
}

// ────────────────────────────────────────────────────────────────────────
// useRunWorkflow — orchestrator that fires the run-agent edge fn per step
// ────────────────────────────────────────────────────────────────────────

type RunResult = { workflow_run_id: string };

export function useRunWorkflow(claim: ClaimedIdea | null) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation<RunResult, Error, { workflow: WorkflowTemplate }>({
    mutationFn: async ({ workflow }) => {
      if (!claim) throw new Error("No active claim");

      // -------- Demo mode --------
      if (!isSupabaseConfigured) {
        return runWorkflowDemo({ claim, workflow });
      }

      // -------- Supabase mode --------
      if (!claim.claim_id) throw new Error("Claim is missing claim_id");
      if (!user) throw new Error("Not signed in");

      // 1. Create the run + step rows up front so the UI can render them as pending.
      const { data: run, error: runErr } = await supabase
        .from("workflow_runs")
        .insert({
          claim_id: claim.claim_id,
          workflow_slug: workflow.slug,
          workflow_title: workflow.title,
          status: "running",
          current_step: 0,
          step_count: workflow.steps.length,
          started_by: user.id,
        })
        .select("*")
        .single();
      if (runErr || !run) throw new Error(runErr?.message ?? "Could not create workflow run");
      const runId = (run as WorkflowRun).id;

      const stepInserts = workflow.steps.map((s, i) => ({
        workflow_run_id: runId,
        ordinal: i + 1,
        owner_role: s.owner,
        title: s.title,
        description: s.description,
        status: "pending" as WorkflowStepStatus,
      }));
      const { data: stepsData, error: stepsErr } = await supabase
        .from("workflow_steps")
        .insert(stepInserts)
        .select("*");
      if (stepsErr || !stepsData) throw new Error(stepsErr?.message ?? "Could not create steps");
      const steps = (stepsData as WorkflowStep[]).sort((a, b) => a.ordinal - b.ordinal);

      qc.invalidateQueries({ queryKey: ["workflow-runs"] });

      // 2. Execute steps in order, each one feeds prior summaries to the next.
      const priorSummaries: Array<{ ordinal: number; owner: string; title: string; summary: string }> = [];
      for (const step of steps) {
        await supabase
          .from("workflow_steps")
          .update({ status: "running", started_at: new Date().toISOString() })
          .eq("id", step.id);
        await supabase
          .from("workflow_runs")
          .update({ current_step: step.ordinal })
          .eq("id", runId);
        qc.invalidateQueries({ queryKey: ["workflow-runs"] });

        const prompt = composeStepPrompt({
          workflow,
          step: workflow.steps[step.ordinal - 1],
          ordinal: step.ordinal,
          totalSteps: workflow.steps.length,
          claim,
          priorSummaries,
        });

        try {
          const { data: runResp, error: runRespErr } = await supabase.functions.invoke<{
            run_id: string;
            output_markdown: string;
          }>("run-agent", {
            body: {
              claim_id: claim.claim_id,
              agent_role: step.owner_role,
              prompt,
            },
          });
          if (runRespErr || !runResp) throw new Error(runRespErr?.message ?? "Agent failed");

          const summary = extractSummary(runResp.output_markdown);
          await supabase
            .from("workflow_steps")
            .update({
              status: "succeeded",
              agent_run_id: runResp.run_id,
              output_summary: summary,
              completed_at: new Date().toISOString(),
            })
            .eq("id", step.id);
          priorSummaries.push({
            ordinal: step.ordinal,
            owner: step.owner_role,
            title: step.title,
            summary,
          });
          qc.invalidateQueries({ queryKey: ["workflow-runs"] });
        } catch (e) {
          const message = (e as Error).message;
          await supabase
            .from("workflow_steps")
            .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
            .eq("id", step.id);
          await supabase
            .from("workflow_runs")
            .update({
              status: "failed",
              error: `Step ${step.ordinal} (${step.title}) failed: ${message}`,
              completed_at: new Date().toISOString(),
            })
            .eq("id", runId);
          qc.invalidateQueries({ queryKey: ["workflow-runs"] });
          throw e;
        }
      }

      // 3. Mark the run completed.
      await supabase
        .from("workflow_runs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", runId);
      qc.invalidateQueries({ queryKey: ["workflow-runs"] });
      return { workflow_run_id: runId };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-runs"] });
      qc.invalidateQueries({ queryKey: ["agent-runs"] });
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
}

// ────────────────────────────────────────────────────────────────────────
// Demo-mode orchestrator — paces steps so the UI shows visible progress
// ────────────────────────────────────────────────────────────────────────

async function runWorkflowDemo(args: {
  claim: ClaimedIdea;
  workflow: WorkflowTemplate;
}): Promise<RunResult> {
  const { claim, workflow } = args;
  const claimId = claim.claim_id ?? `demo-claim-${claim.opportunity_slug}`;
  const runId = `demo-wfr-${Date.now()}-${workflow.slug}`;
  const now = () => new Date().toISOString();

  const initialRun: WorkflowRun = {
    id: runId,
    claim_id: claimId,
    workflow_slug: workflow.slug,
    workflow_title: workflow.title,
    status: "running",
    current_step: 0,
    step_count: workflow.steps.length,
    started_by: null,
    started_at: now(),
    completed_at: null,
    error: null,
  };
  const initialSteps: WorkflowStep[] = workflow.steps.map((s, i) => ({
    id: `${runId}-s${i + 1}`,
    workflow_run_id: runId,
    ordinal: i + 1,
    owner_role: s.owner,
    title: s.title,
    description: s.description,
    status: "pending",
    agent_run_id: null,
    output_summary: null,
    started_at: null,
    completed_at: null,
    error: null,
  }));

  updateDemoStore((store) => ({
    runs: [initialRun, ...store.runs],
    steps: { ...store.steps, [runId]: initialSteps },
  }));

  // Walk the steps with a small delay so the UI's "running…" state is visible.
  for (const step of initialSteps) {
    await new Promise((r) => setTimeout(r, STEP_DELAY_MS));

    // Mark step running
    updateDemoStore((store) => ({
      ...store,
      runs: store.runs.map((r) =>
        r.id === runId ? { ...r, current_step: step.ordinal } : r,
      ),
      steps: {
        ...store.steps,
        [runId]: (store.steps[runId] ?? []).map((s) =>
          s.id === step.id ? { ...s, status: "running" as const, started_at: now() } : s,
        ),
      },
    }));

    await new Promise((r) => setTimeout(r, STEP_DELAY_MS));

    // Generate a synthetic agent run for this step (reusing the canned outputs)
    const agentRun = makeDemoRun({
      agent_role: step.owner_role,
      claim_id: claimId,
      prompt: `Workflow "${workflow.title}" — step ${step.ordinal}: ${step.title}`,
    });
    // Stash it in the demo agent-runs store so AgentRunsList sees it too
    pushDemoAgentRun(agentRun);

    const summary = stepSummaryFor(step, workflow);
    updateDemoStore((store) => ({
      ...store,
      steps: {
        ...store.steps,
        [runId]: (store.steps[runId] ?? []).map((s) =>
          s.id === step.id
            ? {
                ...s,
                status: "succeeded" as const,
                agent_run_id: agentRun.id,
                output_summary: summary,
                completed_at: now(),
              }
            : s,
        ),
      },
    }));
  }

  // Mark the run completed
  updateDemoStore((store) => ({
    ...store,
    runs: store.runs.map((r) =>
      r.id === runId ? { ...r, status: "completed" as const, completed_at: now() } : r,
    ),
  }));

  return { workflow_run_id: runId };
}

function stepSummaryFor(step: WorkflowStep, workflow: WorkflowTemplate): string {
  return [
    `Completed ${step.title.toLowerCase()} for ${workflow.title}.`,
    workflow.outputs[step.ordinal - 1] ? `Produced ${workflow.outputs[step.ordinal - 1].toLowerCase()}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 240);
}

function pushDemoAgentRun(run: AgentRun) {
  if (typeof window === "undefined") return;
  try {
    const key = "greenfield.demoAgentRuns";
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as AgentRun[];
    window.localStorage.setItem(key, JSON.stringify([run, ...existing]));
    window.dispatchEvent(new Event("greenfield:agent-runs-changed"));
  } catch {
    /* ignore */
  }
}

// ────────────────────────────────────────────────────────────────────────
// useCancelWorkflowRun — best-effort: marks the run cancelled (in-flight
// steps that haven't returned will still complete, but no further steps fire)
// ────────────────────────────────────────────────────────────────────────

export function useCancelWorkflowRun() {
  const qc = useQueryClient();
  return useCallback(async (run: WorkflowRun) => {
    if (run.status !== "running" && run.status !== "pending") return;
    if (!isSupabaseConfigured) {
      updateDemoStore((store) => ({
        ...store,
        runs: store.runs.map((r) =>
          r.id === run.id ? { ...r, status: "cancelled" as const, completed_at: new Date().toISOString() } : r,
        ),
      }));
      return;
    }
    await supabase
      .from("workflow_runs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", run.id);
    qc.invalidateQueries({ queryKey: ["workflow-runs"] });
  }, [qc]);
}
