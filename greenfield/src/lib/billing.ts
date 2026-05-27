import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CheckoutPlan = "entrepreneur" | "builder" | "venture_studio";

/** Kicks off Stripe Checkout for the given plan. Redirects on success. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async (plan: CheckoutPlan) => {
      if (!isSupabaseConfigured) {
        throw new Error("DEMO_MODE");
      }
      const { data, error } = await supabase.functions.invoke<{ url: string }>(
        "create-checkout-session",
        { body: { plan } },
      );
      if (error) throw new Error(prettyCheckoutError(error.message));
      if (!data?.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(data.url);
      return data;
    },
    onError: (e: Error) => {
      if (e.message === "DEMO_MODE") {
        toast.info("Checkout requires a live Supabase + Stripe setup. See greenfield/README.md.");
      } else {
        toast.error(e.message);
      }
    },
  });
}

/** Opens the Stripe-hosted billing portal so the owner can manage their subscription. */
export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured) {
        throw new Error("DEMO_MODE");
      }
      const { data, error } = await supabase.functions.invoke<{ url: string }>(
        "create-portal-session",
        { body: {} },
      );
      if (error) throw new Error(prettyPortalError(error.message));
      if (!data?.url) throw new Error("Stripe did not return a portal URL.");
      window.location.assign(data.url);
      return data;
    },
    onError: (e: Error) => {
      if (e.message === "DEMO_MODE") {
        toast.info("Billing portal needs a live Stripe customer.");
      } else {
        toast.error(e.message);
      }
    },
  });
}

function prettyCheckoutError(raw: string): string {
  if (raw.includes("NOT_TEAM_OWNER")) return "Only the team owner can change the plan.";
  if (raw.includes("PRICE_NOT_CONFIGURED")) return "Plan not available yet — contact hello@greenfield.app.";
  if (raw.includes("UNAUTHENTICATED")) return "Sign in first, then try again.";
  if (raw.includes("STRIPE_ERROR")) return "Stripe rejected the request. Try again in a moment.";
  return raw;
}

function prettyPortalError(raw: string): string {
  if (raw.includes("NO_CUSTOMER")) return "You don't have an active subscription yet.";
  if (raw.includes("UNAUTHENTICATED")) return "Sign in first.";
  return raw;
}
