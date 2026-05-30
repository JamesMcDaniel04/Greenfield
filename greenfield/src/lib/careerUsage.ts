import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { TIER_BY_PLAN } from "@/lib/pricing";
import type { CareerUsageRow, PlanTier } from "@/lib/types";

export type CareerGate = {
  unlocked: boolean;
  monthlyQuota: number;
  runsUsed: number;
  remaining: number;
  reason: "ok" | "no_team" | "plan_locked" | "quota_exhausted";
};

function thisYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Career run quota gate. The personal team carries the quota; we read
 * `career_runs_per_month_quota` from the plan tier and the current month's
 * `career_usage_monthly.runs_used` for the comparison.
 */
export function useCareerUsage(): CareerGate {
  const { profile, activeTeam } = useAuth();
  const plan: PlanTier = (profile?.plan ?? "scout") as PlanTier;
  const monthlyQuota = TIER_BY_PLAN[plan]?.career_runs_per_month_quota ?? 0;

  const usageQuery = useQuery({
    queryKey: ["career_usage_monthly", activeTeam?.id, thisYearMonth()],
    enabled: !!activeTeam && isSupabaseConfigured,
    queryFn: async (): Promise<CareerUsageRow | null> => {
      const { data, error } = await supabase
        .from("career_usage_monthly")
        .select("*")
        .eq("team_id", activeTeam!.id)
        .eq("year_month", thisYearMonth())
        .maybeSingle();
      if (error) throw error;
      return (data as CareerUsageRow | null) ?? null;
    },
  });

  const runsUsed = usageQuery.data?.runs_used ?? 0;
  const remaining = Math.max(0, monthlyQuota - runsUsed);
  const unlocked = monthlyQuota > 0;

  let reason: CareerGate["reason"] = "ok";
  if (!activeTeam) reason = "no_team";
  else if (!unlocked) reason = "plan_locked";
  else if (remaining <= 0) reason = "quota_exhausted";

  return { unlocked, monthlyQuota, runsUsed, remaining, reason };
}
