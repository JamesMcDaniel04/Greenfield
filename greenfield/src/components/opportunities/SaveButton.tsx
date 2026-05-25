import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function SaveButton({ opportunityId }: { opportunityId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: isSaved = false } = useQuery({
    queryKey: ["saved", user?.id, opportunityId],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("user_id", user!.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();
      return !!data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_opportunities")
          .delete()
          .eq("user_id", user.id)
          .eq("opportunity_id", opportunityId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_opportunities")
          .insert({ user_id: user.id, opportunity_id: opportunityId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved", user?.id, opportunityId] });
      qc.invalidateQueries({ queryKey: ["saved-list", user?.id] });
      toast.success(isSaved ? "Removed from saved" : "Saved to your list");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isSupabaseConfigured) {
    return (
      <Button
        variant="outline"
        onClick={() => toast.info("Saving requires Supabase — configure .env to enable accounts.")}
      >
        <Bookmark className="h-4 w-4" />
        Save
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          navigate(`/auth?mode=signup&next=${encodeURIComponent(window.location.pathname)}`);
        }}
      >
        <Bookmark className="h-4 w-4" />
        Save
      </Button>
    );
  }

  return (
    <Button
      variant={isSaved ? "secondary" : "outline"}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
