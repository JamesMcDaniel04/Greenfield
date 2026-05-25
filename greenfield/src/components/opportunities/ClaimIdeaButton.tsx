import { CheckCircle2, Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useClaimedIdeas } from "@/lib/claims";
import type { Opportunity } from "@/lib/types";

type Props = {
  opportunity: Opportunity;
  variant?: "default" | "outline" | "accent" | "secondary";
  size?: "default" | "sm" | "lg";
};

export default function ClaimIdeaButton({
  opportunity,
  variant = "accent",
  size = "default",
}: Props) {
  const { isClaimed, toggleClaim } = useClaimedIdeas();
  const claimed = isClaimed(opportunity.slug);

  return (
    <Button
      variant={claimed ? "outline" : variant}
      size={size}
      onClick={() => {
        toggleClaim(opportunity);
        toast.success(
          claimed
            ? "Idea removed from your execution workspace"
            : "Idea claimed — Agents and Workflows are now tailored to it",
        );
      }}
    >
      {claimed ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
      {claimed ? "Claimed" : "Claim idea"}
    </Button>
  );
}
