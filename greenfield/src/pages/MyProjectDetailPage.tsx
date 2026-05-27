import { useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, ExternalLink, Github, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useByoUsage } from "@/lib/byoUsage";
import { useUserProject } from "@/lib/userProjects";
import { useByoAgentRuns, useRunByoAgent } from "@/lib/byoAgentRuns";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AGENT_ROLE_LABEL, AGENT_ROLE_ORDER, type AgentRole } from "@/lib/execution";

export default function MyProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const byo = useByoUsage();
  const projectQuery = useUserProject(id);
  const [role, setRole] = useState<AgentRole>("research");
  const [prompt, setPrompt] = useState("");

  const subject = id ? { user_project_id: id } : null;
  const runsQuery = useByoAgentRuns(subject, role);
  const runAgent = useRunByoAgent(subject);

  if (!isSupabaseConfigured) return <Navigate to="/my-projects" replace />;
  if (loading) return null;
  if (!user) return <Navigate to={`/auth?mode=signin&next=/my-projects/${id}`} replace />;
  if (!byo.unlocked) return <Navigate to="/my-projects" replace />;
  if (projectQuery.isLoading) return <p className="container-wide py-10 text-muted-foreground">Loading…</p>;
  if (!projectQuery.data) return <Navigate to="/my-projects" replace />;

  const project = projectQuery.data;
  const canRun = byo.reason === "ok";

  async function onRun(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    try {
      await runAgent.mutateAsync({ agent_role: role, prompt: prompt.trim() });
      setPrompt("");
      toast.success(`${AGENT_ROLE_LABEL[role]} agent run complete.`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <section className="container-wide py-10 max-w-5xl">
      <Link to="/my-projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{project.title}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{project.stage}</span>
        </div>
        <p className="mt-2 text-base text-muted-foreground">{project.summary}</p>

        {(project.repo_url || project.deploy_url) && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" />
                Repo
              </a>
            )}
            {project.deploy_url && (
              <a href={project.deploy_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
                Live
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mt-8 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">Run an agent</h2>
          <p className="text-xs text-muted-foreground">
            BYO runs this month: <span className="font-medium text-foreground">{byo.runsUsed} / {byo.monthlyQuota}</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {AGENT_ROLE_ORDER.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={role === r ? "default" : "outline"}
              onClick={() => setRole(r)}
            >
              <Bot className="h-4 w-4" />
              {AGENT_ROLE_LABEL[r]}
            </Button>
          ))}
        </div>

        <form onSubmit={onRun} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask the ${AGENT_ROLE_LABEL[role]} agent to…`}
              maxLength={1000}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canRun || runAgent.isPending}>
              {runAgent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running…
                </>
              ) : (
                <>Run {AGENT_ROLE_LABEL[role]} agent</>
              )}
            </Button>
            {byo.reason === "quota_exhausted" && (
              <p className="text-xs text-destructive">Monthly BYO quota exhausted.</p>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg">Recent {AGENT_ROLE_LABEL[role]} runs</h2>
        {runsQuery.isLoading ? (
          <p className="mt-3 text-muted-foreground">Loading…</p>
        ) : (runsQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No runs yet for this agent. Fire one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(runsQuery.data ?? []).map((run) => (
              <li key={run.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{new Date(run.started_at).toLocaleString()}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5">{run.status}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{run.prompt}</p>
                {run.output_markdown && (
                  <pre className="mt-3 whitespace-pre-wrap text-xs text-foreground/90">{run.output_markdown}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
