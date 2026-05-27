/**
 * create-checkout-session — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/create-checkout-session
 * Body: { plan: 'entrepreneur' | 'builder' | 'career' | 'venture_studio' }
 *
 * Auth: caller's JWT. Resolves the caller's owned team. Creates a Stripe
 * Checkout Session for the configured annual price, returns { url }.
 *
 * Required env:
 *  - STRIPE_SECRET_KEY                 (sk_live_... or sk_test_...)
 *  - STRIPE_PRICE_ENTREPRENEUR         (price_... — annual)
 *  - STRIPE_PRICE_BUILDER              (price_... — annual)
 *  - STRIPE_PRICE_CAREER               (price_... — annual)
 *  - STRIPE_PRICE_VENTURE_STUDIO       (price_... — annual)
 *  - APP_URL                           (e.g. https://greenfield.app) — success/cancel returns
 */

// @ts-expect-error — Deno URL imports resolve at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Plan = "entrepreneur" | "builder" | "career" | "venture_studio";
const VALID_PLANS = new Set<Plan>(["entrepreneur", "builder", "career", "venture_studio"]);

// @ts-expect-error — Deno global at runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // @ts-expect-error — Deno.env
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  // @ts-expect-error
  const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET_KEY")!;
  // @ts-expect-error
  const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

  const priceByPlan: Record<Plan, string> = {
    // @ts-expect-error
    entrepreneur: Deno.env.get("STRIPE_PRICE_ENTREPRENEUR")!,
    // @ts-expect-error
    builder: Deno.env.get("STRIPE_PRICE_BUILDER")!,
    // @ts-expect-error
    career: Deno.env.get("STRIPE_PRICE_CAREER")!,
    // @ts-expect-error
    venture_studio: Deno.env.get("STRIPE_PRICE_VENTURE_STUDIO")!,
  };

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "UNAUTHENTICATED" }, 401);

  const user = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await user.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { plan?: Plan };
  try {
    body = await req.json();
  } catch {
    return json({ error: "INVALID_INPUT", details: "Body must be JSON" }, 400);
  }
  if (!body.plan || !VALID_PLANS.has(body.plan)) {
    return json({ error: "INVALID_INPUT", details: "plan must be entrepreneur | builder | career | venture_studio" }, 400);
  }
  const priceId = priceByPlan[body.plan];
  if (!priceId) {
    return json({ error: "PRICE_NOT_CONFIGURED", details: `Set STRIPE_PRICE_${body.plan.toUpperCase()}` }, 500);
  }

  // Resolve the team this user owns. For Entrepreneur and Venture Studio it's
  // always the team the caller is the owner of (we never let one user upgrade
  // a team they only belong to as a member).
  const { data: ownedTeams, error: teamErr } = await user
    .from("team_members")
    .select("team_id, role, teams!inner(id, name, stripe_customer_id)")
    .eq("user_id", userData.user.id)
    .eq("role", "owner");
  if (teamErr) return json({ error: "INTERNAL", details: teamErr.message }, 500);
  const team = (ownedTeams ?? [])[0]?.teams as
    | { id: string; name: string; stripe_customer_id: string | null }
    | undefined;
  if (!team) return json({ error: "NOT_TEAM_OWNER" }, 403);

  // Build Stripe Checkout via REST (avoids pulling the SDK into Deno).
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${APP_URL}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${APP_URL}/pricing?checkout=canceled`);
  params.set("client_reference_id", team.id);
  params.set("metadata[team_id]", team.id);
  params.set("metadata[user_id]", userData.user.id);
  params.set("metadata[plan]", body.plan);
  params.set("subscription_data[metadata][team_id]", team.id);
  params.set("subscription_data[metadata][plan]", body.plan);
  params.set("allow_promotion_codes", "true");
  // Re-use the customer if we already have one, else let Stripe create one from
  // the email captured in checkout.
  if (team.stripe_customer_id) {
    params.set("customer", team.stripe_customer_id);
  } else if (userData.user.email) {
    params.set("customer_email", userData.user.email);
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    return json({ error: "STRIPE_ERROR", details: session?.error?.message ?? "Stripe rejected the request" }, 502);
  }

  return json({ url: session.url as string, id: session.id as string }, 200);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
