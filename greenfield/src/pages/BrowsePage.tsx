import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import CatalogueView from "@/components/opportunities/CatalogueView";
import { publishedOpportunitiesFromRows } from "@/lib/catalogue";
import { useClaimedIdeas } from "@/lib/claims";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import type { Opportunity } from "@/lib/types";

export default function BrowsePage() {
  const { claims } = useClaimedIdeas();

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["opportunities", isSupabaseConfigured],
    queryFn: async () => {
      if (!isSupabaseConfigured) return SAMPLE_OPPORTUNITIES;
      // visible_opportunities view filters out actively-claimed-by-others rows
      // at the DB layer (security_invoker means RLS still applies per user).
      const { data, error } = await supabase
        .from("visible_opportunities")
        .select("*")
        .order("featured", { ascending: false })
        .order("rank", { ascending: true });
      if (error) throw error;
      return publishedOpportunitiesFromRows(data as Opportunity[]);
    },
  });

  // Demo-mode fallback: in localStorage mode the SQL view doesn't exist, so we
  // hide claimed-by-me slugs client-side. (In Supabase mode the view already
  // hides claimed-by-others; claimed-by-me stays visible so the user can find
  // their workspace from the catalogue.)
  const visibleOpps = useMemo(() => {
    if (isSupabaseConfigured) return opps;
    const claimedSlugs = new Set(claims.map((c) => c.opportunity_slug));
    return opps.filter((o) => !claimedSlugs.has(o.slug));
  }, [opps, claims]);

  const hiddenCount = isSupabaseConfigured ? 0 : claims.length;

  return (
    <CatalogueView
      eyebrow="Catalogue"
      title="Opportunities nobody has built — with the brief to ship them."
      description="Each entry is a specific, unbuilt product backed by a real demand signal. Pro members get a download-ready Markdown brief that drops straight into Claude Code, Cursor, or Codex."
      opportunities={visibleOpps}
      isLoading={isLoading}
      hiddenCount={hiddenCount}
      itemLabel="opportunities"
    />
  );
}
