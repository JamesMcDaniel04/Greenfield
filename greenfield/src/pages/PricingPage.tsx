import { Check, Lock, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { SELF_SERVE_TIERS, TIER_BY_PLAN, type PricingTier } from "@/lib/pricing";

export default function PricingPage() {
  const { user, profile } = useAuth();
  const currentPlan = profile?.plan;

  function startUpgrade(tier: PricingTier) {
    toast.info(
      `${tier.name} checkout coming online shortly — message hello@greenfield.app and we'll get you set up.`,
    );
  }

  return (
    <section className="px-6 md:px-10 py-12 max-w-6xl">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing</p>
        <h1 className="mt-2 font-display text-3xl md:text-5xl leading-tight">Choose your plan</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
          Browse the catalogue on Scout. Claim an idea and unlock a four-agent team on Entrepreneur.
          Bring a studio team on Venture Studio.
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {SELF_SERVE_TIERS.map((tier) => (
          <TierCard
            key={tier.plan}
            tier={tier}
            isCurrent={currentPlan === tier.plan}
            ctaState={user ? "upgrade" : "signup"}
            onUpgrade={() => startUpgrade(tier)}
          />
        ))}
      </div>

      <UniversityCard tier={TIER_BY_PLAN.university} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Annual billing only. Cancel anytime — access stays active through the end of the term.
      </p>
    </section>
  );
}

function TierCard({
  tier, isCurrent, ctaState, onUpgrade,
}: {
  tier: PricingTier;
  isCurrent: boolean;
  ctaState: "upgrade" | "signup";
  onUpgrade: () => void;
}) {
  const showRecommendedChip = tier.highlight;
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border p-6 " +
        (tier.highlight
          ? "border-primary/50 bg-gradient-to-br from-primary/[0.05] to-accent/[0.07] shadow-md"
          : "bg-card")
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl">{tier.name}</h3>
        {showRecommendedChip && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">Recommended</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl">{tier.priceLabel}</span>
        <span className="text-sm text-muted-foreground">{tier.per}</span>
      </div>
      {tier.priceFootnote && (
        <p className="mt-0.5 text-xs text-primary">{tier.priceFootnote}</p>
      )}

      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        {isCurrent ? (
          <Button disabled className="w-full">
            <Check className="h-4 w-4" />
            Current plan
          </Button>
        ) : tier.contactOnly ? (
          <Button className="w-full" variant={tier.highlight ? "default" : "outline"} asChild>
            <a href={`mailto:hello@greenfield.app?subject=${encodeURIComponent(`${tier.name} inquiry`)}`}>
              <Mail className="h-4 w-4" />
              {tier.cta}
            </a>
          </Button>
        ) : ctaState === "signup" ? (
          <Button className="w-full" variant={tier.highlight ? "default" : "outline"} asChild>
            <Link to={`/auth?mode=signup&next=/pricing&plan=${tier.plan}`}>
              <Lock className="h-4 w-4" />
              {tier.cta}
            </Link>
          </Button>
        ) : (
          <Button className="w-full" variant={tier.highlight ? "default" : "outline"} onClick={onUpgrade}>
            <Sparkles className="h-4 w-4" />
            {tier.cta}
          </Button>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}

function UniversityCard({ tier }: { tier: PricingTier }) {
  return (
    <div className="mt-6 rounded-2xl border bg-card p-6 md:flex md:items-center md:justify-between md:gap-8">
      <div>
        <h3 className="font-display text-xl">{tier.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {tier.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button asChild className="mt-4 md:mt-0">
        <a href={`mailto:hello@greenfield.app?subject=${encodeURIComponent(`${tier.name} inquiry`)}`}>
          <Mail className="h-4 w-4" />
          {tier.cta}
        </a>
      </Button>
    </div>
  );
}
