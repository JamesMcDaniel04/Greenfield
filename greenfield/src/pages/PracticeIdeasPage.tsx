import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import CatalogueView from "@/components/opportunities/CatalogueView";
import { publishedOpportunitiesFromRows } from "@/lib/catalogue";
import { useClaimedIdeas } from "@/lib/claims";
import { SAMPLE_OPPORTUNITIES } from "@/lib/fixtures";
import { PRACTICE_OPPORTUNITIES, PRACTICE_OPPORTUNITY_SLUGS } from "@/lib/researchedIdeas";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Opportunity } from "@/lib/types";

export default function PracticeIdeasPage() {
  const { claims } = useClaimedIdeas();

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["practice-opportunities", isSupabaseConfigured],
    queryFn: async () => {
      if (!isSupabaseConfigured) return PRACTICE_OPPORTUNITIES;
      const { data, error } = await supabase
        .from("visible_opportunities")
        .select("*")
        .order("featured", { ascending: false })
        .order("rank", { ascending: true });
      if (error) throw error;
      const published = publishedOpportunitiesFromRows(data as Opportunity[]);
      return published.filter((opp) => PRACTICE_OPPORTUNITY_SLUGS.has(opp.slug));
    },
  });

  const visibleOpps = useMemo(() => {
    if (isSupabaseConfigured) return opps;
    const claimedSlugs = new Set(claims.map((c) => c.opportunity_slug));
    return SAMPLE_OPPORTUNITIES
      .filter((opp) => PRACTICE_OPPORTUNITY_SLUGS.has(opp.slug))
      .filter((opp) => !claimedSlugs.has(opp.slug));
  }, [claims, opps]);

  const hiddenCount = isSupabaseConfigured
    ? 0
    : claims.filter((claim) => PRACTICE_OPPORTUNITY_SLUGS.has(claim.opportunity_slug)).length;

  return (
    <CatalogueView
      eyebrow="Practice"
      title="AI-friendly build ideas to sharpen your shipping muscles."
      description="A separate catalog of smaller builds for people who want reps with Claude Code, Cursor, or Codex. These are scored more by the stack they teach and the hiring signal behind those tools than by startup-market size."
      opportunities={visibleOpps}
      isLoading={isLoading}
      hiddenCount={hiddenCount}
      itemLabel="practice ideas"
      emptyTitle="No practice ideas match those filters."
      emptyBody="Try clearing a few filters or widening the build approach."
    />
  );
}
