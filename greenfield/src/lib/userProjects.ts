import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserProject } from "@/lib/types";

export type NewUserProjectInput = Omit<
  UserProject,
  "id" | "team_id" | "created_by" | "created_at" | "updated_at"
>;

const KEY = ["user_projects"];

export function useUserProjects() {
  const { user, activeTeam } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id, activeTeam?.id],
    enabled: !!user && !!activeTeam && isSupabaseConfigured,
    queryFn: async (): Promise<UserProject[]> => {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("team_id", activeTeam!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserProject[];
    },
  });
}

export function useUserProject(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    enabled: !!id && isSupabaseConfigured,
    queryFn: async (): Promise<UserProject | null> => {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserProject | null) ?? null;
    },
  });
}

export function useCreateUserProject() {
  const { user, activeTeam } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUserProjectInput): Promise<UserProject> => {
      if (!user || !activeTeam) throw new Error("Sign in and pick a team first.");
      const { data, error } = await supabase
        .from("user_projects")
        .insert({ ...input, team_id: activeTeam.id, created_by: user.id })
        .select("*")
        .single();
      if (error) throw error;
      return data as UserProject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UserProject> }) => {
      const { data, error } = await supabase
        .from("user_projects")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as UserProject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUserProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}
