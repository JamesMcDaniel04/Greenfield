import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { IdeaClaim, Team, TeamMember } from "@/lib/types";

export type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked";
  accepted_by: string | null;
  invited_at: string;
  accepted_at: string | null;
};

export type TeamMemberWithProfile = TeamMember & {
  display_name: string | null;
  email: string | null;
};

type TeamSnapshot = {
  team: Team;
  members: TeamMemberWithProfile[];
  invitations: TeamInvitation[];
  claimsThisWeek: number;
  activeClaimsCount: number;
};

/** Live data + invite/revoke mutations for the current user's active team. */
export function useTeamWorkspace(teamId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const snapshotQ = useQuery<TeamSnapshot | null>({
    queryKey: ["team-workspace", teamId, user?.id],
    enabled: isSupabaseConfigured && !!teamId && !!user,
    queryFn: async () => {
      const [{ data: team }, { data: rawMembers }, { data: invitations }, { data: claims }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", teamId!).maybeSingle(),
        supabase
          .from("team_members")
          .select("team_id, user_id, role, joined_at, profiles!inner(display_name)")
          .eq("team_id", teamId!),
        supabase
          .from("team_invitations")
          .select("*")
          .eq("team_id", teamId!)
          .order("invited_at", { ascending: false }),
        supabase
          .from("idea_claims")
          .select("id, status, claimed_at")
          .eq("team_id", teamId!),
      ]);

      if (!team) return null;
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const claimsThisWeek = (claims ?? []).filter(
        (c) => new Date((c as IdeaClaim).claimed_at).getTime() > cutoff,
      ).length;
      const activeClaimsCount = (claims ?? []).filter(
        (c) => (c as IdeaClaim).status === "active",
      ).length;

      const members: TeamMemberWithProfile[] = (rawMembers ?? []).map((m) => {
        // Supabase returns the joined `profiles` as either an array (when the FK
        // isn't unique) or an object. Normalise to one shape.
        const row = m as unknown as TeamMember & {
          profiles: { display_name: string | null } | { display_name: string | null }[] | null;
        };
        const profile = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
        return {
          team_id: row.team_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.joined_at,
          display_name: profile?.display_name ?? null,
          email: null, // auth.users.email isn't directly readable via REST; surface in /team via the owner-only view if needed
        };
      });

      return {
        team: team as Team,
        members,
        invitations: (invitations ?? []) as TeamInvitation[],
        claimsThisWeek,
        activeClaimsCount,
      };
    },
  });

  const inviteMut = useMutation({
    mutationFn: async (email: string) => {
      if (!teamId) throw new Error("No team selected");
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean; team_name: string; email: string; already_registered: boolean;
      }>("invite-team-member", { body: { team_id: teamId, email } });
      if (error) throw new Error(prettyInviteError(error.message));
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["team-workspace"] });
      if (data?.already_registered) {
        toast.success(`Invite recorded for ${data.email} (already has a Greenfield account).`);
      } else {
        toast.success(`Invite sent to ${data?.email}.`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-workspace"] });
      toast.success("Invite revoked.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    snapshot: snapshotQ.data ?? null,
    isLoading: snapshotQ.isLoading,
    invite: inviteMut,
    revoke: revokeMut,
  };
}

function prettyInviteError(raw: string): string {
  if (raw.includes("SEAT_LIMIT_REACHED")) return "Your team is at its seat limit — upgrade or remove a member first.";
  if (raw.includes("NOT_TEAM_OWNER")) return "Only the team owner can invite new members.";
  if (raw.includes("TEAM_NOT_FOUND")) return "Team not found.";
  if (raw.includes("INVALID_INPUT")) return "That email doesn't look valid.";
  return raw;
}
