import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import OpportunityForm from "@/components/admin/OpportunityForm";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/admin";
import type { Opportunity } from "@/lib/types";

export default function AdminEditPage() {
  const { ready } = useRequireAdmin();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug;

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-opp", slug],
    enabled: ready && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Opportunity | null;
    },
  });

  if (!ready) return null;
  if (!isNew && isLoading) return <div className="container-narrow py-10 text-muted-foreground">Loading…</div>;
  if (!isNew && !existing) {
    return (
      <div className="container-narrow py-10">
        <p>Opportunity not found.</p>
        <Link to="/admin" className="text-primary underline">Back to admin</Link>
      </div>
    );
  }

  return (
    <section className="container-narrow py-10 max-w-3xl">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Admin
      </Link>
      <h1 className="mt-4 font-display text-3xl">
        {isNew ? "New opportunity" : "Edit opportunity"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isNew
          ? "Add a single entry. You can generate its build brief from the admin list."
          : `Editing "${existing!.title}".`}
      </p>

      <div className="mt-8">
        <OpportunityForm existing={existing ?? undefined} />
      </div>
    </section>
  );
}
