import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "./supabase";
import type { Profile, Team } from "./types";

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  teams: Team[];
  /**
   * The team a claim action should go through. Prefers a Venture Studio team
   * the user is a member of (best quota), otherwise the personal team.
   */
  activeTeam: Team | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function pickActiveTeam(profile: Profile | null, teams: Team[]): Team | null {
  if (teams.length === 0) return null;
  const studio = teams.find((t) => t.plan === "venture_studio");
  if (studio) return studio;
  const personal = teams.find((t) => t.id === profile?.personal_team_id);
  return personal ?? teams[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileAndTeams = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile(null);
      setTeams([]);
      return;
    }
    const [{ data: profileRow }, { data: memberRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("team_members")
        .select("team_id, role, joined_at, teams!inner(*)")
        .eq("user_id", userId),
    ]);
    setProfile((profileRow as Profile) ?? null);
    const teamRows = (memberRows ?? [])
      .map((row) => (row as unknown as { teams: Team }).teams)
      .filter(Boolean);
    setTeams(teamRows);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfileAndTeams(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) await loadProfileAndTeams(s.user.id);
      else {
        setProfile(null);
        setTeams([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfileAndTeams]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      teams,
      activeTeam: pickActiveTeam(profile, teams),
      loading,
      refreshProfile: async () => {
        if (session?.user) await loadProfileAndTeams(session.user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, teams, loading, loadProfileAndTeams],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
