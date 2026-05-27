import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AgentRun } from "@/lib/types";

type ByoSubject = { user_idea_id: string } | { user_project_id: string };

function subjectColumn(s: ByoSubject): "user_idea_id" | "user_project_id" {
  return "user_idea_id" in s ? "user_idea_id" : "user_project_id";
}
function subjectId(s: ByoSubject): string {
  return "user_idea_id" in s ? s.user_idea_id : s.user_project_id;
}

/**
 * Recent agent runs for a BYO subject (user_idea or user_project). One query
 * per subject; the run-agent edge function writes the row server-side.
 */
export function useByoAgentRuns(subject: ByoSubject | null, role: AgentRun["agent_role"]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["byo-agent-runs", subject ? subjectId(subject) : null, role, user?.id],
    enabled: isSupabaseConfigured && !!subject && !!user,
    queryFn: async (): Promise<AgentRun[]> => {
      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .eq(subjectColumn(subject!), subjectId(subject!))
        .eq("agent_role", role)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AgentRun[];
    },
  });
}

function prettyByoError(raw: string): string {
  if (raw.includes("BYO_PLAN_REQUIRED")) return "Bring-your-own ideas need the Builder plan or higher.";
  if (raw.includes("BYO_QUOTA_EXCEEDED")) return "You've used your BYO agent runs for this month.";
  if (raw.includes("UNAUTHENTICATED")) return "Sign in first.";
  if (raw.includes("SUBJECT_NOT_FOUND")) return "That idea or project no longer exists.";
  if (raw.includes("NOT_TEAM_MEMBER")) return "You're not on the owning team.";
  return raw;
}

/**
 * Fire an agent run against a BYO subject. Hits the same run-agent edge
 * function as catalogue claims, but with { user_idea_id } or { user_project_id }
 * instead of { claim_id }. The edge function enforces the monthly BYO quota.
 */
export function useRunByoAgent(subject: ByoSubject | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { agent_role: AgentRun["agent_role"]; prompt: string }) => {
      if (!subject) throw new Error("No subject selected.");
      if (!isSupabaseConfigured) {
        throw new Error("BYO agent runs require Supabase.");
      }
      const { data, error } = await supabase.functions.invoke<{
        run_id: string;
        output_markdown: string;
        tool_calls: unknown[];
      }>("run-agent", {
        body: { ...subject, agent_role: args.agent_role, prompt: args.prompt },
      });
      if (error) throw new Error(prettyByoError(error.message));
      if (!data) throw new Error("No data returned from run-agent");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["byo-agent-runs"] });
      qc.invalidateQueries({ queryKey: ["byo_usage_monthly"] });
    },
  });
}
