import { useEffect } from "react";
import { Check, CreditCard, Lock, Mail, Sparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useOpenBillingPortal, useStartCheckout } from "@/lib/billing";
import { markPostCheckoutGrace } from "@/lib/devBypass";
import { CAREER_TIER } from "@/lib/pricing";

export default function PricingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const currentPlan = profile?.plan;
  const isPaying = !!currentPlan && currentPlan !== "scout";
  const isCurrent = currentPlan === CAREER_TIER.plan;

  const startCheckout = useStartCheckout();
  const openPortal = useOpenBillingPortal();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Payment confirmed — opening your track.");
      // Open the gate for ~5 min while Stripe's webhook flips profile.is_pro,
      // so the Layout guard doesn't immediately bounce them back here.
      markPostCheckoutGrace();
      refreshProfile();
      navigate("/career", { replace: true });
    } else if (checkout === "canceled") {
      toast.info("Checkout canceled. Your plan didn't change.");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate, refreshProfile]);

  const isPending = startCheckout.isPending;

  return (
    <section className="mx-auto w-full px-6 md:px-10 py-12 max-w-2xl">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing</p>
        <h1 className="mt-2 font-display text-3xl md:text-5xl leading-tight">One plan. Everything included.</h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Build five real AI systems, get them graded against a rubric, and graduate with a verified portfolio.
        </p>
      </header>

      {isPaying && (
        <div className="mt-8 rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">You're on the {CAREER_TIER.name} plan.</span>
            <span className="ml-2 text-muted-foreground">Manage your payment method, invoices, or cancel any time.</span>
          </div>
          <Button
            variant="outline"
            disabled={openPortal.isPending}
            onClick={() => openPortal.mutate()}
          >
            <CreditCard className="h-4 w-4" />
            {openPortal.isPending ? "Opening…" : "Manage billing"}
          </Button>
        </div>
      )}

      <div className="mt-10">
        <div className="relative flex flex-col rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/[0.05] to-accent/[0.07] p-6 shadow-md">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl">{CAREER_TIER.name}</h3>
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">Recommended</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{CAREER_TIER.tagline}</p>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-display text-4xl">{CAREER_TIER.priceLabel}</span>
            <span className="text-sm text-muted-foreground">{CAREER_TIER.per}</span>
          </div>
          {CAREER_TIER.priceFootnote && <p className="mt-0.5 text-xs text-primary">{CAREER_TIER.priceFootnote}</p>}

          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {CAREER_TIER.features.map((f) => (
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
            ) : user ? (
              <Button
                className="w-full"
                onClick={() => startCheckout.mutate("career")}
                disabled={isPending}
              >
                <Sparkles className="h-4 w-4" />
                {isPending ? "Redirecting…" : CAREER_TIER.cta}
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link to={`/auth?mode=signup&next=/pricing&plan=${CAREER_TIER.plan}`}>
                  <Lock className="h-4 w-4" />
                  {CAREER_TIER.cta}
                </Link>
              </Button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">Cancel anytime. No questions asked.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6 text-center">
        <h3 className="font-display text-lg">Universities & accelerators</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cohort accounts, co-branded reporting, and curriculum support for programs.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href="mailto:hello@greenfield.app?subject=Cohort%20inquiry"><Mail className="h-4 w-4" />Contact us</a>
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Annual billing only. Cancel anytime — access stays active through the end of the term.
      </p>
    </section>
  );
}
