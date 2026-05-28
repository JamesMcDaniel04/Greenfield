import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Bookmark, Lightbulb, Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useByoUsage } from "@/lib/byoUsage";
import { useClaimedIdeas } from "@/lib/claims";
import { useCreateUserIdea, useUserIdeas } from "@/lib/userIdeas";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function MyIdeasPage() {
  const { user, loading } = useAuth();
  const byo = useByoUsage();
  const { claims } = useClaimedIdeas();
  const ideasQuery = useUserIdeas();
  const createIdea = useCreateUserIdea();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");

  if (!isSupabaseConfigured) return <DemoModeBanner />;
  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=signin&next=/my-ideas" replace />;
  // No early `byo.unlocked` gate — even Entrepreneur-tier users without BYO
  // should see their claimed catalogue ideas on this page. The BYO section
  // gates itself further down.

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
      <header>
        <h1 className="font-display text-3xl">Your ideas</h1>
        <p className="mt-1 text-muted-foreground">
          Catalogue ideas you've claimed and private ideas you've added. Run the agent team against any of them.
        </p>
      </header>

      {/* ── Claimed catalogue ideas ────────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Claimed from the catalogue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {claims.length === 0
                ? "Nothing claimed yet. Browse the catalogue to claim an opportunity."
                : `${claims.length} active claim${claims.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/browse">Browse catalogue <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {claims.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            No active claims. <Link to="/browse" className="underline">Find an opportunity</Link>, open it, and hit "Claim this idea".
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {claims.map((claim) => (
              <Link
                key={claim.claim_id ?? claim.opportunity_slug}
                to={`/opportunity/${claim.opportunity_slug}`}
                className="rounded-2xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-2">
                  <Bookmark className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <h3 className="font-display text-lg">{claim.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{claim.one_liner}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{claim.industry}</Badge>
                  {claim.niche && <Badge variant="soft">{claim.niche}</Badge>}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Claimed {new Date(claim.claimed_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── BYO private ideas ─────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Your private ideas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {byo.unlocked
                ? "Sketch your own opportunities and run the 5-agent team against them."
                : "Add your own ideas with the Builder plan."}
            </p>
          </div>
          {byo.unlocked && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                BYO agent runs this month:{" "}
                <span className="font-medium text-foreground">{byo.runsUsed} / {byo.monthlyQuota}</span>
              </p>
              <Button onClick={() => setShowNew((v) => !v)}>
                <Plus className="h-4 w-4" />
                New idea
              </Button>
            </div>
          )}
        </div>

        {!byo.unlocked ? (
          <InlineByoLock />
        ) : (
          <>
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

            <div className="mt-6">
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
          </>
        )}
      </div>
    </section>
  );
}

function InlineByoLock() {
  return (
    <div className="mt-4 rounded-2xl border bg-card p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Builder plan unlocks BYO ideas + 25 agent runs/month.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Claimed catalogue ideas above don't need the Builder plan — just claiming quota from your current tier.
          </p>
          <Button asChild className="mt-3">
            <Link to="/pricing">See Builder plan</Link>
          </Button>
        </div>
      </div>
    </div>
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
