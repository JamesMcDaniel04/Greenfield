import { CheckCircle2, Flag, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useClaimedIdeas } from "@/lib/claims";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
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
  const { isClaimed, toggleClaim, claimGateReason, remainingQuota, activeClaim } =
    useClaimedIdeas();
  const { user } = useAuth();
  const claimedByMe = isClaimed(opportunity.slug);

  // Already claimed by the caller — let them release.
  if (claimedByMe) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={async () => {
          await toggleClaim(opportunity);
          toast.success("Claim released — the idea is back in the public catalogue.");
        }}
      >
        <CheckCircle2 className="h-4 w-4" />
        Claimed — click to release
      </Button>
    );
  }

  // Demo mode: no gate, no quota — claiming is a local snapshot.
  if (!isSupabaseConfigured) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={async () => {
          await toggleClaim(opportunity);
          toast.success("Idea claimed — your agent team is now tailored to it.");
        }}
      >
        <Flag className="h-4 w-4" />
        Claim idea
      </Button>
    );
  }

  // Signed-out users — push to signup.
  if (!user || claimGateReason === "needs_account") {
    return (
      <Button variant={variant} size={size} asChild>
        <Link to={`/auth?mode=signup&next=${encodeURIComponent(`/opportunity/${opportunity.slug}`)}`}>
          <Lock className="h-4 w-4" />
          Sign up to claim
        </Link>
      </Button>
    );
  }

  // Scout users — push to pricing.
  if (claimGateReason === "plan_lacks_claiming") {
    return (
      <Button variant={variant} size={size} asChild>
        <Link to="/pricing">
          <Lock className="h-4 w-4" />
          Upgrade to claim
        </Link>
      </Button>
    );
  }

  // Quota exhausted — for Entrepreneur this means "you already have an active claim";
  // for Venture Studio it means the team has hit its weekly limit.
  if (claimGateReason === "quota_exhausted") {
    const message = activeClaim
      ? "You already have an active claim. Release it first or upgrade."
      : "Weekly claim quota exhausted — try again next week or upgrade.";
    return (
      <Button variant="outline" size={size} disabled title={message}>
        <Lock className="h-4 w-4" />
        Quota reached
      </Button>
    );
  }

  // No team yet (shouldn't normally happen — the signup trigger creates one).
  if (claimGateReason === "no_team") {
    return (
      <Button variant="outline" size={size} disabled>
        <Lock className="h-4 w-4" />
        Account setup pending
      </Button>
    );
  }

  // Happy path.
  return (
    <Button
      variant={variant}
      size={size}
      onClick={async () => {
        await toggleClaim(opportunity);
      }}
    >
      <Flag className="h-4 w-4" />
      Claim this idea
      {typeof remainingQuota === "number" && remainingQuota > 0 && remainingQuota < 5 && (
        <span className="ml-1 text-xs opacity-70">({remainingQuota} left)</span>
      )}
    </Button>
  );
}
