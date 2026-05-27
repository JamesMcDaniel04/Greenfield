import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lock, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useByoUsage } from "@/lib/byoUsage";
import { useCreateUserProject, useUserProjects } from "@/lib/userProjects";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ProjectStage } from "@/lib/types";

const STAGES: ProjectStage[] = ["prototype", "live", "scaling"];

export default function MyProjectsPage() {
  const { user, loading } = useAuth();
  const byo = useByoUsage();
  const projectsQuery = useUserProjects();
  const createProject = useCreateUserProject();

  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stage, setStage] = useState<ProjectStage>("prototype");
  const [repoUrl, setRepoUrl] = useState("");
  const [deployUrl, setDeployUrl] = useState("");

  if (!isSupabaseConfigured) return <DemoModeBanner />;
  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=signin&next=/my-projects" replace />;
  if (!byo.unlocked) return <LockedNotice />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    try {
      await createProject.mutateAsync({
        title: title.trim(),
        summary: summary.trim(),
        stage,
        repo_url: repoUrl.trim() || null,
        deploy_url: deployUrl.trim() || null,
        current_metrics: {},
        build_brief_md: null,
        model_type: null, audience: null, industry: null, niche: null,
        founder_path: null, starting_capital: null, time_to_launch: null,
        distribution_play: null, demand_trend: null,
      });
      setShowNew(false);
      setTitle("");
      setSummary("");
      setRepoUrl("");
      setDeployUrl("");
      setStage("prototype");
      toast.success("Project saved.");
    } catch { /* mutation already toasted */ }
  }

  return (
    <section className="container-wide py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Your projects</h1>
          <p className="mt-1 text-muted-foreground">In-flight work the agents can help you scale.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            BYO agent runs this month: <span className="font-medium text-foreground">{byo.runsUsed} / {byo.monthlyQuota}</span>
          </p>
          <Button onClick={() => setShowNew((v) => !v)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>
      </header>

      {showNew && (
        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proj-title">Title</Label>
            <Input id="proj-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-summary">Summary</Label>
            <Input id="proj-summary" value={summary} onChange={(e) => setSummary(e.target.value)} required maxLength={400} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="proj-stage">Stage</Label>
              <select
                id="proj-stage"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={stage}
                onChange={(e) => setStage(e.target.value as ProjectStage)}
              >
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-repo">Repo URL</Label>
              <Input id="proj-repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-deploy">Deploy URL</Label>
              <Input id="proj-deploy" value={deployUrl} onChange={(e) => setDeployUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Saving…" : "Save project"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {projectsQuery.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (projectsQuery.data ?? []).length === 0 ? (
          <EmptyState onCreate={() => setShowNew(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(projectsQuery.data ?? []).map((p) => (
              <Link key={p.id} to={`/my-projects/${p.id}`} className="rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition">
                <div className="flex items-start gap-2">
                  <Rocket className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <h3 className="font-display text-lg">{p.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">{p.stage}</span>
                  <span>· Created {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ onCreate }: { readonly onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <p className="font-display text-lg">No projects yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">Add an in-flight project — repo, deploy URL, current metrics — and run the agent team against it.</p>
      <Button onClick={onCreate} className="mt-4">
        <Plus className="h-4 w-4" />
        New project
      </Button>
    </div>
  );
}

function LockedNotice() {
  return (
    <section className="container-wide py-10">
      <div className="rounded-2xl border bg-card p-8 text-center max-w-xl mx-auto">
        <Lock className="h-6 w-6 text-primary mx-auto" />
        <h1 className="mt-3 font-display text-2xl">Bring your own projects</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The Builder plan unlocks private projects with 25 included agent runs per month.
        </p>
        <Button asChild className="mt-4">
          <Link to="/pricing">See Builder plan</Link>
        </Button>
      </div>
    </section>
  );
}

function DemoModeBanner() {
  return (
    <section className="container-wide py-10">
      <h1 className="font-display text-3xl">Your projects</h1>
      <p className="mt-1 text-muted-foreground">In-flight work the agents can help you scale.</p>
      <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
        <p className="font-display text-lg">Demo mode.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          BYO projects require Supabase. Configure <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable.
        </p>
      </div>
    </section>
  );
}
