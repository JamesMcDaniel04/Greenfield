import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/admin";
import type { Opportunity } from "@/lib/types";

type Row = Opportunity & { has_brief: boolean };

export default function AdminListPage() {
  const { ready } = useRequireAdmin();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-opportunities"],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, build_briefs(opportunity_id)")
        .order("featured", { ascending: false })
        .order("rank", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: Opportunity & { build_briefs: { opportunity_id: string }[] | null }) => {
        const { build_briefs, ...opp } = row;
        return { ...opp, has_brief: !!build_briefs?.length } as Row;
      });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-opportunities"] });
      toast.success("Opportunity deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = useMutation({
    mutationFn: async (opportunityId: string) => {
      const { data, error } = await supabase.functions.invoke<{ markdown: string; cached: boolean }>(
        "generate-brief",
        { body: { opportunity_id: opportunityId } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-opportunities"] });
      toast.success(data?.cached ? "Brief loaded from cache" : "Brief generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ready) return null;

  return (
    <section className="container-wide py-10">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Admin</h1>
          <p className="text-sm text-muted-foreground">Manage the opportunity catalogue.</p>
        </div>
        <Button asChild>
          <Link to="/admin/new"><Plus className="h-4 w-4" />New opportunity</Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-card">
        {list.isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : !list.data?.length ? (
          <div className="p-8 text-center text-muted-foreground">No opportunities yet — create one or run the seed script.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Industry</th>
                <th className="px-4 py-3 text-left font-medium">Difficulty</th>
                <th className="px-4 py-3 text-left font-medium">Brief</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.featured && <Star className="h-3.5 w-3.5 fill-accent text-accent" />}
                      <Link to={`/opportunity/${row.slug}`} className="font-medium hover:underline" target="_blank">
                        {row.title}
                      </Link>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{row.one_liner}</p>
                  </td>
                  <td className="px-4 py-3"><Badge variant="soft">{row.industry}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{row.difficulty}</td>
                  <td className="px-4 py-3">
                    {row.has_brief ? (
                      <span className="text-xs text-emerald-700">✓ cached</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generate.mutate(row.id)}
                        disabled={generate.isPending}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </Button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/admin/edit/${row.slug}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete "${row.title}"? This also deletes its brief and any saves.`)) {
                            del.mutate(row.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
