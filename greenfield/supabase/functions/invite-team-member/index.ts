/**
 * invite-team-member — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/invite-team-member
 * Body: { team_id: string, email: string }
 *
 * Only callable by an OWNER of the team. Sends a Supabase auth invite to the
 * email + records a pending team_invitations row. When the invitee accepts and
 * signs up, the handle_new_user trigger creates their personal team — and the
 * invite_accept flow (a separate signup-side hook) adds them to this team.
 *
 * For the MVP we keep it simple: we record the invitation, send the auth
 * invite email, and rely on a small `accept_team_invitation` SQL function the
 * client calls from the auth callback page.
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
  // @ts-expect-error
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "UNAUTHENTICATED" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "UNAUTHENTICATED" }, 401);

  let body: { team_id?: string; email?: string };
  try { body = await req.json(); } catch { return json({ error: "INVALID_INPUT" }, 400); }
  if (!body.team_id || !body.email) {
    return json({ error: "INVALID_INPUT", details: "team_id and email required" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ error: "INVALID_INPUT", details: "email looks invalid" }, 400);
  }

  // 1. Caller must be an owner of the team.
  const { data: membership } = await userClient
    .from("team_members")
    .select("role")
    .eq("team_id", body.team_id)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!membership || (membership as { role: string }).role !== "owner") {
    return json({ error: "NOT_TEAM_OWNER" }, 403);
  }

  // 2. Check seat limit.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const [{ data: team }, { count: memberCount }] = await Promise.all([
    admin.from("teams").select("name, seat_limit").eq("id", body.team_id).maybeSingle(),
    admin.from("team_members").select("user_id", { count: "exact", head: true }).eq("team_id", body.team_id),
  ]);
  if (!team) return json({ error: "TEAM_NOT_FOUND" }, 404);
  if ((memberCount ?? 0) >= (team as { seat_limit: number }).seat_limit) {
    return json({
      error: "SEAT_LIMIT_REACHED",
      details: `Team is at ${memberCount} of ${(team as { seat_limit: number }).seat_limit} seats.`,
    }, 409);
  }

  // 3. Record the invite (best-effort — table is created by migration 0009).
  const invitationRow = {
    team_id: body.team_id,
    email: body.email.toLowerCase(),
    invited_by: userData.user.id,
    status: "pending",
  };
  await admin.from("team_invitations").upsert(invitationRow, { onConflict: "team_id,email" });

  // 4. Send the Supabase auth invite. If the email is already a registered user,
  //    Supabase silently no-ops; we still record the invitation so they can
  //    accept on first sign-in.
  // @ts-expect-error — Deno fetch global
  const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "apikey": SERVICE_ROLE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: body.email,
      data: { invited_to_team_id: body.team_id, invited_by: userData.user.id },
    }),
  });

  if (!inviteRes.ok && inviteRes.status !== 422 /* already registered */) {
    const text = await inviteRes.text();
    return json({ error: "INVITE_SEND_FAILED", details: text }, 500);
  }

  return json({
    ok: true,
    team_id: body.team_id,
    team_name: (team as { name: string }).name,
    email: body.email,
    already_registered: inviteRes.status === 422,
  }, 201);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
