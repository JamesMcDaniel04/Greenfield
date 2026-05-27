import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserIdea } from "@/lib/types";

export type NewUserIdeaInput = Omit<
  UserIdea,
  "id" | "team_id" | "created_by" | "created_at" | "updated_at"
>;

const KEY = ["user_ideas"];

export function useUserIdeas() {
  const { user, activeTeam } = useAuth();
  return useQuery({
    queryKey: [...KEY, user?.id, activeTeam?.id],
    enabled: !!user && !!activeTeam && isSupabaseConfigured,
    queryFn: async (): Promise<UserIdea[]> => {
      const { data, error } = await supabase
        .from("user_ideas")
        .select("*")
        .eq("team_id", activeTeam!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserIdea[];
    },
  });
}

export function useUserIdea(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    enabled: !!id && isSupabaseConfigured,
    queryFn: async (): Promise<UserIdea | null> => {
      const { data, error } = await supabase
        .from("user_ideas")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserIdea | null) ?? null;
    },
  });
}

export function useCreateUserIdea() {
  const { user, activeTeam } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewUserIdeaInput): Promise<UserIdea> => {
      if (!user || !activeTeam) throw new Error("Sign in and pick a team first.");
      const { data, error } = await supabase
        .from("user_ideas")
        .insert({ ...input, team_id: activeTeam.id, created_by: user.id })
        .select("*")
        .single();
      if (error) throw error;
      return data as UserIdea;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UserIdea> }) => {
      const { data, error } = await supabase
        .from("user_ideas")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as UserIdea;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUserIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}
