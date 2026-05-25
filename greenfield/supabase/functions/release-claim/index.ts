/**
 * release-claim — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/release-claim
 * Body: { claim_id: string }
 *
 * Marks a claim as released so the opportunity reappears in everyone's
 * catalogue. Only team members of the claim's team (or admins) may release.
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error — Deno global at runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // @ts-expect-error
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "UNAUTHENTICATED" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { claim_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "INVALID_INPUT" }, 400);
  }
  if (!body.claim_id) return json({ error: "INVALID_INPUT", details: "claim_id required" }, 400);

  const { data, error } = await userClient.rpc("release_claim", { claim: body.claim_id });

  if (error) {
    if (error.message.includes("NOT_AUTHORIZED"))   return json({ error: "NOT_AUTHORIZED" }, 403);
    if (error.message.includes("CLAIM_NOT_ACTIVE")) return json({ error: "CLAIM_NOT_ACTIVE" }, 409);
    return json({ error: "INTERNAL", details: error.message }, 500);
  }

  return json({ claim: data }, 200);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
