/**
 * ingest-signal — Supabase Edge Function (Deno)
 *
 * POST /functions/v1/ingest-signal
 *
 * Called by n8n workflows (TechCrunch RSS, Reddit, Hacker News, X, etc.) to
 * deposit research signals into the `opportunity_signals` table. Auth is via
 * a shared bearer token set as INGEST_SIGNAL_TOKEN — n8n sends it in the
 * Authorization header.
 *
 * Body schema:
 *   {
 *     source_type:    "techcrunch" | "reddit" | "x" | "hackernews"
 *                   | "crunchbase" | "arxiv" | "github" | "blog"
 *                   | "podcast" | "other",
 *     url:            string,
 *     title:          string,
 *     published_at:   ISO timestamp,
 *     snippet?:       string,        // factual context, NOT a quote of body
 *     metadata?:      object,        // arbitrary n8n-side context
 *     opportunity_slug?: string,     // if known; otherwise unlinked for triage
 *   }
 *
 * Returns: { id, opportunity_id, linked: boolean }
 *
 * Deploy:
 *   supabase secrets set INGEST_SIGNAL_TOKEN=$(openssl rand -hex 32)
 *   supabase functions deploy ingest-signal --no-verify-jwt
 *
 * Note the `--no-verify-jwt` flag: this endpoint is called by n8n, which
 * doesn't have a Supabase user session. We auth with the shared token instead.
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SOURCE_TYPES = new Set([
  "techcrunch", "reddit", "x", "hackernews", "crunchbase",
  "arxiv", "github", "blog", "podcast", "other",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-expect-error — Deno global at runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  // @ts-expect-error — Deno.env
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // @ts-expect-error
  const SHARED_TOKEN = Deno.env.get("INGEST_SIGNAL_TOKEN")!;

  if (!SHARED_TOKEN) return json({ error: "Server missing INGEST_SIGNAL_TOKEN" }, 500);

  // Auth
  const auth = req.headers.get("Authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (presented !== SHARED_TOKEN) return json({ error: "Unauthorized" }, 401);

  // Parse + validate
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const errors: string[] = [];
  const source_type = String(body.source_type ?? "");
  if (!SOURCE_TYPES.has(source_type)) errors.push("source_type must be one of: " + [...SOURCE_TYPES].join(", "));

  const url = String(body.url ?? "");
  if (!/^https?:\/\//i.test(url)) errors.push("url must be http(s)");

  const title = String(body.title ?? "").trim();
  if (!title) errors.push("title required");
  if (title.length > 500) errors.push("title too long (>500 chars)");

  const published_at = String(body.published_at ?? "");
  const t = Date.parse(published_at);
  if (Number.isNaN(t)) errors.push("published_at must be a parseable ISO timestamp");

  const snippet = body.snippet ? String(body.snippet) : null;
  if (snippet && snippet.length > 2000) errors.push("snippet too long (>2000 chars)");

  const opportunity_slug = body.opportunity_slug ? String(body.opportunity_slug) : null;
  const metadata = (body.metadata && typeof body.metadata === "object") ? body.metadata : null;

  if (errors.length) return json({ error: "Validation failed", details: errors }, 400);

  // DB
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // If a slug was supplied, resolve it to opportunity_id (silently null if it doesn't exist —
  // n8n shouldn't fail just because we haven't created the opportunity yet).
  let opportunity_id: string | null = null;
  if (opportunity_slug) {
    const { data: opp } = await admin
      .from("opportunities")
      .select("id")
      .eq("slug", opportunity_slug)
      .maybeSingle();
    opportunity_id = opp?.id ?? null;
  }

  // Upsert on (opportunity_id, url) — same URL ingested twice for the same opportunity is idempotent.
  const { data, error } = await admin
    .from("opportunity_signals")
    .upsert(
      {
        opportunity_id,
        source_type,
        url,
        title,
        snippet,
        published_at: new Date(t).toISOString(),
        metadata,
      },
      { onConflict: "opportunity_id,url", ignoreDuplicates: false },
    )
    .select("id, opportunity_id")
    .single();

  if (error) return json({ error: error.message }, 500);

  return json({
    id: data!.id,
    opportunity_id: data!.opportunity_id,
    linked: !!data!.opportunity_id,
  }, 201);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
