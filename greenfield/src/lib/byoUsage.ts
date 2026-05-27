import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ByoUsageRow, PlanTier } from "@/lib/types";
import { TIER_BY_PLAN } from "@/lib/pricing";

export type ByoGate = {
  /** Plan unlocks BYO at all. */
  unlocked: boolean;
  monthlyQuota: number;
  runsUsed: number;
  remaining: number;
  /** Human-readable reason this user can't run an agent on a BYO subject. */
  reason: "ok" | "no_team" | "plan_locked" | "quota_exhausted";
};

function thisYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function useByoUsage(): ByoGate {
  const { profile, activeTeam } = useAuth();
  const plan: PlanTier = (profile?.plan ?? "scout") as PlanTier;
  const monthlyQuota = TIER_BY_PLAN[plan]?.byo_runs_per_month_quota ?? 0;

  const usageQuery = useQuery({
    queryKey: ["byo_usage_monthly", activeTeam?.id, thisYearMonth()],
    enabled: !!activeTeam && isSupabaseConfigured,
    queryFn: async (): Promise<ByoUsageRow | null> => {
      const { data, error } = await supabase
        .from("byo_usage_monthly")
        .select("*")
        .eq("team_id", activeTeam!.id)
        .eq("year_month", thisYearMonth())
        .maybeSingle();
      if (error) throw error;
      return (data as ByoUsageRow | null) ?? null;
    },
  });

  const runsUsed = usageQuery.data?.runs_used ?? 0;
  const remaining = Math.max(0, monthlyQuota - runsUsed);
  const unlocked = monthlyQuota > 0;

  let reason: ByoGate["reason"] = "ok";
  if (!activeTeam) reason = "no_team";
  else if (!unlocked) reason = "plan_locked";
  else if (remaining <= 0) reason = "quota_exhausted";

  return { unlocked, monthlyQuota, runsUsed, remaining, reason };
}
