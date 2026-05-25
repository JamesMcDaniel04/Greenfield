/**
 * claim-idea — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/claim-idea
 * Body: { opportunity_id: string, team_id?: string }
 *
 * Caller must be authenticated. If team_id is omitted we resolve to the
 * highest-quota team the caller belongs to (Venture Studio > Entrepreneur >
 * personal Scout). All the heavy lifting (quota check, exclusivity, insert)
 * happens atomically inside the SQL `claim_idea(opp, team)` function.
 *
 * Returns: { claim } on success
 * Returns: { error: "PLAN_LACKS_CLAIMING" | "WEEKLY_QUOTA_EXHAUSTED" |
 *            "CLAIM_SLOT_TAKEN" | "ALREADY_CLAIMED" | "NOT_TEAM_MEMBER" |
 *            "UNAUTHENTICATED" | "INVALID_INPUT" } on failure
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

  // @ts-expect-error — Deno.env
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  // @ts-expect-error
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Auth: caller's JWT, so claim_idea() sees their auth.uid().
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "UNAUTHENTICATED" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { opportunity_id?: string; team_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "INVALID_INPUT", details: "Body must be JSON" }, 400);
  }
  if (!body.opportunity_id) {
    return json({ error: "INVALID_INPUT", details: "opportunity_id required" }, 400);
  }

  // Resolve target team. Prefer the explicitly-passed team; else highest-tier
  // team this user belongs to.
  let team_id = body.team_id ?? null;
  if (!team_id) {
    const { data: memberships, error } = await userClient
      .from("team_members")
      .select("team_id, teams!inner(id, plan, claims_per_week_quota)")
      .eq("user_id", userData.user.id);
    if (error) return json({ error: "INTERNAL", details: error.message }, 500);

    const ranked = (memberships ?? [])
      .map((m: { teams: { id: string; plan: string; claims_per_week_quota: number } }) => m.teams)
      .sort(
        (a: { claims_per_week_quota: number }, b: { claims_per_week_quota: number }) =>
          b.claims_per_week_quota - a.claims_per_week_quota,
      );
    team_id = ranked[0]?.id ?? null;
  }
  if (!team_id) return json({ error: "NOT_TEAM_MEMBER" }, 403);

  // Call the SQL function under the user's JWT so auth.uid() is correct.
  const { data, error } = await userClient.rpc("claim_idea", {
    opp_id: body.opportunity_id,
    team: team_id,
  });

  if (error) {
    const code = mapPgError(error.message);
    return json({ error: code, details: error.message }, statusForCode(code));
  }

  // Echo the row back. Use service-role to fetch the full claim with metadata
  // so the client doesn't need a second roundtrip.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: claim } = await admin
    .from("idea_claims")
    .select("*")
    .eq("id", (data as { id: string }).id)
    .single();

  return json({ claim }, 201);
});

function mapPgError(msg: string): string {
  if (msg.includes("PLAN_LACKS_CLAIMING")) return "PLAN_LACKS_CLAIMING";
  if (msg.includes("WEEKLY_QUOTA_EXHAUSTED")) return "WEEKLY_QUOTA_EXHAUSTED";
  if (msg.includes("CLAIM_SLOT_TAKEN")) return "CLAIM_SLOT_TAKEN";
  if (msg.includes("ALREADY_CLAIMED")) return "ALREADY_CLAIMED";
  if (msg.includes("NOT_TEAM_MEMBER")) return "NOT_TEAM_MEMBER";
  return "INTERNAL";
}

function statusForCode(code: string): number {
  switch (code) {
    case "UNAUTHENTICATED": return 401;
    case "NOT_TEAM_MEMBER":
    case "PLAN_LACKS_CLAIMING":
    case "WEEKLY_QUOTA_EXHAUSTED":
    case "CLAIM_SLOT_TAKEN":
      return 403;
    case "ALREADY_CLAIMED": return 409;
    case "INVALID_INPUT":   return 400;
    default:                return 500;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
