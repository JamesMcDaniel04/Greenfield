import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lightbulb, Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useByoUsage } from "@/lib/byoUsage";
import { useCreateUserIdea, useUserIdeas } from "@/lib/userIdeas";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function MyIdeasPage() {
  const { user, loading } = useAuth();
  const byo = useByoUsage();
  const ideasQuery = useUserIdeas();
  const createIdea = useCreateUserIdea();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");

  if (!isSupabaseConfigured) return <DemoModeBanner />;
  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=signin&next=/my-ideas" replace />;
  if (!byo.unlocked) return <LockedNotice />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !oneLiner.trim()) return;
    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        one_liner: oneLiner.trim(),
        the_gap: null, the_play: null, market_size_summary: null,
        timing_rationale: null, build_path: null,
        model_type: null, audience: null, industry: null, niche: null,
        founder_path: null, starting_capital: null, time_to_launch: null,
        distribution_play: null, demand_trend: null,
      });
      setShowNew(false);
      setTitle("");
      setOneLiner("");
      toast.success("Idea saved.");
    } catch { /* mutation already toasted */ }
  }

  return (
    <section className="container-wide py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Your ideas</h1>
          <p className="mt-1 text-muted-foreground">Private to your workspace. Run the 5-agent team against any one.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            BYO agent runs this month: <span className="font-medium text-foreground">{byo.runsUsed} / {byo.monthlyQuota}</span>
          </p>
          <Button onClick={() => setShowNew((v) => !v)}>
            <Plus className="h-4 w-4" />
            New idea
          </Button>
        </div>
      </header>

      {showNew && (
        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="idea-title">Title</Label>
            <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idea-oneliner">One-liner</Label>
            <Input id="idea-oneliner" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} required maxLength={240} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button type="submit" disabled={createIdea.isPending}>
              {createIdea.isPending ? "Saving…" : "Save idea"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {ideasQuery.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (ideasQuery.data ?? []).length === 0 ? (
          <EmptyState onCreate={() => setShowNew(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(ideasQuery.data ?? []).map((idea) => (
              <Link key={idea.id} to={`/my-ideas/${idea.id}`} className="rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <h3 className="font-display text-lg">{idea.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{idea.one_liner}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Created {new Date(idea.created_at).toLocaleDateString()}
                </p>
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
      <p className="font-display text-lg">No ideas yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">Add an idea you're exploring and run the 5-agent team against it.</p>
      <Button onClick={onCreate} className="mt-4">
        <Plus className="h-4 w-4" />
        New idea
      </Button>
    </div>
  );
}

function LockedNotice() {
  return (
    <section className="container-wide py-10">
      <div className="rounded-2xl border bg-card p-8 text-center max-w-xl mx-auto">
        <Lock className="h-6 w-6 text-primary mx-auto" />
        <h1 className="mt-3 font-display text-2xl">Bring your own ideas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The Builder plan unlocks private ideas and projects with 25 included agent runs per month.
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
      <h1 className="font-display text-3xl">Your ideas</h1>
      <p className="mt-1 text-muted-foreground">Bring an idea, run the agent team against it.</p>
      <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
        <p className="font-display text-lg">Demo mode.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          BYO ideas require Supabase. Configure <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable.
        </p>
      </div>
    </section>
  );
}
