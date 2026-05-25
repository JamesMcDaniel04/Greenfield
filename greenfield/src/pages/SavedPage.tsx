import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import OpportunityCard from "@/components/opportunities/OpportunityCard";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Opportunity } from "@/lib/types";

export default function SavedPage() {
  const { user, loading } = useAuth();

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ["saved-list", user?.id],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id, created_at, opportunities(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.opportunities as unknown as Opportunity)
        .filter(Boolean);
    },
  });

  if (!isSupabaseConfigured) {
    return (
      <section className="container-wide py-10">
        <h1 className="font-display text-3xl">Your saved opportunities</h1>
        <p className="mt-1 text-muted-foreground">A working list of things you might build next.</p>
        <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <p className="font-display text-lg">Saved lists need an account.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Supabase in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable accounts, then bookmark opportunities from the catalogue.
          </p>
          <Button asChild className="mt-4"><Link to="/">Browse catalogue</Link></Button>
        </div>
      </section>
    );
  }

  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=signin&next=/saved" replace />;

  return (
    <section className="container-wide py-10">
      <h1 className="font-display text-3xl">Your saved opportunities</h1>
      <p className="mt-1 text-muted-foreground">A working list of things you might build next.</p>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <p className="font-display text-lg">Nothing saved yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Bookmark opportunities from the catalogue and they'll land here.</p>
            <Button asChild className="mt-4"><Link to="/">Browse catalogue</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((opp) => <OpportunityCard key={opp.id} opp={opp} />)}
          </div>
        )}
      </div>
    </section>
  );
}
