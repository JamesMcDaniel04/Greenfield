import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { planAllowsClaiming } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import type { IdeaClaim, Opportunity } from "@/lib/types";
import type { ClaimedIdea } from "@/lib/execution";

import type { ClaimsApi } from "@/lib/claims";

type ClaimRow = IdeaClaim & { opportunities: Opportunity | null };

function rowToClaimedIdea(row: ClaimRow): ClaimedIdea | null {
  const opp = row.opportunities;
  if (!opp) return null;
  return {
    claim_id: row.id,
    opportunity_id: row.opportunity_id,
    opportunity_slug: opp.slug,
    title: opp.title,
    one_liner: opp.one_liner,
    audience: opp.audience,
    industry: opp.industry,
    niche: opp.niche,
    model_type: opp.model_type,
    distribution_play: opp.distribution_play,
    demand_trend: opp.demand_trend,
    founder_path: opp.founder_path,
    difficulty: opp.difficulty,
    starting_capital: opp.starting_capital,
    time_to_launch: opp.time_to_launch,
    claimed_at: row.claimed_at,
  };
}

function prettyClaimError(raw: string): string {
  if (raw.includes("PLAN_LACKS_CLAIMING")) return "Your plan doesn't include claiming. Upgrade to Entrepreneur or Venture Studio.";
  if (raw.includes("WEEKLY_QUOTA_EXHAUSTED")) return "Weekly claim quota exhausted — try again next week.";
  if (raw.includes("CLAIM_SLOT_TAKEN")) return "You already have an active claim. Release it first or upgrade to add more.";
  if (raw.includes("ALREADY_CLAIMED")) return "Another founder just claimed this idea.";
  if (raw.includes("NOT_TEAM_MEMBER")) return "You're not a member of that team.";
  if (raw.includes("NOT_AUTHORIZED")) return "You don't have permission to do that.";
  if (raw.includes("CLAIM_NOT_ACTIVE")) return "That claim isn't active anymore.";
  return raw;
}

/**
 * Supabase-backed implementation of ClaimsApi. Lives in its own file so the
 * localStorage skeleton in claims.ts stays untouched.
 */
export function useRemoteClaims(): ClaimsApi {
  const { user, profile, activeTeam, teams } = useAuth();
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const teamIds = useMemo(() => teams.map((t) => t.id), [teams]);

  const claimsQuery = useQuery({
    queryKey: ["claims", user?.id, teamIds.join(",")],
    enabled: !!user && teamIds.length > 0,
    queryFn: async (): Promise<ClaimedIdea[]> => {
      const { data, error } = await supabase
        .from("idea_claims")
        .select("*, opportunities(*)")
        .in("team_id", teamIds)
        .eq("status", "active")
        .order("claimed_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as ClaimRow[])
        .map(rowToClaimedIdea)
        .filter((c): c is ClaimedIdea => !!c);
    },
  });

  const claims = claimsQuery.data ?? [];

  useEffect(() => {
    if (!activeSlug && claims.length > 0) {
      setActiveSlug(claims[0].opportunity_slug);
    }
  }, [activeSlug, claims]);

  const activeClaim =
    claims.find((c) => c.opportunity_slug === activeSlug) ?? claims[0] ?? null;

  const weeklyCap = activeTeam?.claims_per_week_quota ?? 0;
  const usedThisWeek = useMemo(() => {
    if (!activeTeam) return 0;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return claims.filter((c) => new Date(c.claimed_at).getTime() > cutoff).length;
  }, [claims, activeTeam]);
  const remainingQuota = activeTeam ? Math.max(0, weeklyCap - usedThisWeek) : 0;

  const claimGateReason: ClaimsApi["claimGateReason"] = !user
    ? "needs_account"
    : !activeTeam
    ? "no_team"
    : !planAllowsClaiming(profile?.plan ?? "scout")
    ? "plan_lacks_claiming"
    : remainingQuota <= 0
    ? "quota_exhausted"
    : null;

  const claimMut = useMutation({
    mutationFn: async (opp: Opportunity) => {
      const { data, error } = await supabase.functions.invoke<{ claim: IdeaClaim }>(
        "claim-idea",
        { body: { opportunity_id: opp.id } },
      );
      if (error) throw new Error(prettyClaimError(error.message));
      return data?.claim ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  const releaseMut = useMutation({
    mutationFn: async (slug: string) => {
      const claim = claims.find((c) => c.opportunity_slug === slug);
      if (!claim?.claim_id) throw new Error("Claim not found");
      const { error } = await supabase.functions.invoke("release-claim", {
        body: { claim_id: claim.claim_id },
      });
      if (error) throw new Error(prettyClaimError(error.message));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });

  return {
    claims,
    activeClaim,
    activeClaimSlug: activeClaim?.opportunity_slug ?? null,
    remainingQuota,
    claimGateReason,
    claimOpportunity: async (opp) => {
      try {
        await claimMut.mutateAsync(opp);
        setActiveSlug(opp.slug);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    unclaimOpportunity: async (slug) => {
      try {
        await releaseMut.mutateAsync(slug);
        if (activeSlug === slug) setActiveSlug(null);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    toggleClaim: async (opp) => {
      const claimed = claims.some((c) => c.opportunity_slug === opp.slug);
      try {
        if (claimed) await releaseMut.mutateAsync(opp.slug);
        else {
          await claimMut.mutateAsync(opp);
          setActiveSlug(opp.slug);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    setActiveClaim: (slug) => {
      if (claims.some((c) => c.opportunity_slug === slug)) setActiveSlug(slug);
    },
    isClaimed: (slug) => claims.some((c) => c.opportunity_slug === slug),
  };
}
