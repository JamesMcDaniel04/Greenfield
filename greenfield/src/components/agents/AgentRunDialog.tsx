import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, Clock, Copy, Download, Loader2, Play, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRunAgent } from "@/lib/agentRuns";
import { useRunWorkflow } from "@/lib/workflowRuns";
import { workflowBySlug } from "@/lib/workflows";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ClaimedIdea } from "@/lib/execution";
import type { AgentPlan } from "@/lib/execution";
import type { AgentRun, AgentToolCall } from "@/lib/types";
import { cn } from "@/lib/utils";

type SpawnIntent = { slug: string; reason: string };

function spawnIntentsFromTrace(run: AgentRun | null): SpawnIntent[] {
  if (!run) return [];
  const intents: SpawnIntent[] = [];
  for (const tc of run.tool_calls) {
    if (tc.name !== "spawn_workflow") continue;
    const result = tc.result as { acknowledged?: boolean; slug?: unknown; reason?: unknown } | null;
    if (!result?.acknowledged) continue;
    const slug = typeof result.slug === "string" ? result.slug : null;
    const reason = typeof result.reason === "string" ? result.reason : "";
    if (slug && workflowBySlug(slug)) intents.push({ slug, reason });
  }
  return intents;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentPlan;
  claim: ClaimedIdea;
};

export default function AgentRunDialog({ open, onOpenChange, agent, claim }: Props) {
  const [prompt, setPrompt] = useState(agent.starter_prompt);
  const [result, setResult] = useState<AgentRun | null>(null);
  const runAgent = useRunAgent(claim);

  // Reset state when reopening
  useEffect(() => {
    if (open) {
      setPrompt(agent.starter_prompt);
      setResult(null);
    }
  }, [open, agent.starter_prompt]);

  async function onRun() {
    setResult(null);
    try {
      const fresh = await runAgent.mutateAsync({
        agent_role: agent.role,
        prompt: prompt.trim() || agent.starter_prompt,
      });
      // The Supabase path returns { run_id, output_markdown, tool_calls } — make it look like AgentRun for the UI.
      // Demo path already returns a full AgentRun.
      const display: AgentRun = "agent_role" in fresh
        ? (fresh as AgentRun)
        : {
            id: (fresh as { run_id: string }).run_id,
            claim_id: claim.claim_id ?? "",
            agent_role: agent.role,
            status: "succeeded",
            prompt,
            output_markdown: (fresh as { output_markdown: string }).output_markdown,
            tool_calls: ((fresh as { tool_calls?: AgentToolCall[] }).tool_calls ?? []),
            model: null,
            tokens_input: null,
            tokens_output: null,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error: null,
          };
      setResult(display);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function copyMd() {
    if (!result?.output_markdown) return;
    await navigator.clipboard.writeText(result.output_markdown);
    toast.success("Copied");
  }

  function downloadMd() {
    if (!result?.output_markdown) return;
    const blob = new Blob([result.output_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${claim.opportunity_slug}-${agent.role}-${new Date(result.started_at).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Run {agent.name}
            {!isSupabaseConfigured && (
              <Badge variant="outline" className="text-[10px]">DEMO</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Tailored to <span className="font-medium text-foreground">{claim.title}</span>.
            Edit the prompt or send it as-is. The agent will read the brief, may search the
            web, and returns Markdown work product.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="font-mono text-xs leading-relaxed"
              disabled={runAgent.isPending}
            />
            {!isSupabaseConfigured && (
              <p className="text-xs text-muted-foreground">
                Demo mode returns a pre-recorded {agent.role.toUpperCase()} output anchored to
                the solo-CPA fixture. Configure <code>.env</code> + deploy the
                <code className="mx-1">run-agent</code> edge function to fire live runs.
              </p>
            )}
          </div>
        ) : (
          <RunOutput run={result} claim={claim} />
        )}

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={runAgent.isPending}>
                Cancel
              </Button>
              <Button onClick={() => { void onRun(); }} disabled={runAgent.isPending}>
                {runAgent.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Running…</>
                  : <><Sparkles className="h-4 w-4" />Run {agent.name}</>
                }
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setResult(null); }}>Run again</Button>
              <Button variant="outline" onClick={() => { void copyMd(); }}>
                <Copy className="h-4 w-4" />Copy
              </Button>
              <Button onClick={downloadMd}>
                <Download className="h-4 w-4" />Download .md
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunOutput({ run, claim }: { readonly run: AgentRun; readonly claim: ClaimedIdea }) {
  const [traceOpen, setTraceOpen] = useState(false);
  const spawnIntents = useMemo(() => spawnIntentsFromTrace(run), [run]);
  const runWorkflow = useRunWorkflow(claim);

  async function fireWorkflow(slug: string) {
    const workflow = workflowBySlug(slug);
    if (!workflow) return;
    try {
      await runWorkflow.mutateAsync({ workflow });
      toast.success(`Started "${workflow.title}". Watch progress on the workflow page.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(run.started_at, run.completed_at)}
        </span>
        {run.tokens_input != null && (
          <span>{run.tokens_input.toLocaleString()} in · {run.tokens_output?.toLocaleString() ?? 0} out</span>
        )}
        <span>{run.tool_calls.length} tool call{run.tool_calls.length === 1 ? "" : "s"}</span>
        {run.model && <span className="font-mono">{run.model}</span>}
      </div>

      {spawnIntents.length > 0 && (
        <div className="rounded-md border border-primary/20 bg-primary/[0.04] p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Suggested next workflow{spawnIntents.length === 1 ? "" : "s"}</p>
          <ul className="mt-2 space-y-2">
            {spawnIntents.map((intent) => {
              const wf = workflowBySlug(intent.slug);
              if (!wf) return null;
              return (
                <li key={intent.slug} className="flex flex-wrap items-start justify-between gap-3 rounded border bg-background p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{wf.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{intent.reason}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={runWorkflow.isPending}
                    onClick={() => { void fireWorkflow(intent.slug); }}
                  >
                    {runWorkflow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Run now
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <pre className="max-h-[55vh] overflow-auto rounded-md bg-muted/50 p-4 text-xs leading-relaxed whitespace-pre-wrap">
        {run.output_markdown}
      </pre>

      {run.tool_calls.length > 0 && (
        <div className="rounded-md border bg-card">
          <button
            type="button"
            onClick={() => setTraceOpen(!traceOpen)}
            className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              {traceOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Tool call trace ({run.tool_calls.length})
            </span>
            <span className="text-foreground/40">click to {traceOpen ? "hide" : "show"}</span>
          </button>
          {traceOpen && (
            <ol className="border-t divide-y text-xs">
              {run.tool_calls.map((tc, i) => (
                <li key={`${tc.name}-${i}`} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium">{tc.name}</span>
                    {tc.duration_ms != null && (
                      <span className="text-muted-foreground">{tc.duration_ms}ms</span>
                    )}
                  </div>
                  <pre className={cn("mt-1 overflow-x-auto rounded bg-muted/40 px-2 py-1 text-[11px]")}>
                    {JSON.stringify(tc.input, null, 2)}
                  </pre>
                  <pre className={cn("mt-1 overflow-x-auto rounded bg-muted/40 px-2 py-1 text-[11px] text-foreground/80")}>
                    {JSON.stringify(tc.result, null, 2)}
                  </pre>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "ongoing";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}
