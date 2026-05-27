/**
 * Tool definitions for the run-agent edge function.
 *
 * Five shared tools (all four agent roles can call them):
 *   - read_opportunity_brief: returns the claim's opportunity context + cached build brief
 *   - read_signals:           returns recent cited research signals for the opportunity
 *   - web_search:             Brave Search API (key: BRAVE_API_KEY); falls back to SerpAPI if BRAVE not set
 *   - fetch_url:              fetches a URL and returns plain-text body (truncated)
 *   - save_note:              persists a structured note into agent_runs.tool_calls metadata
 *
 * Plus four role-specific tools (Phase 3 — flagged for later):
 *   - GTM:        find_competitors
 *   - Sales:      find_companies (Apollo/Clearbit, optional key)
 *   - Marketing:  keyword_volume
 *   - Engineering: search_github
 *
 * Each tool times out after TOOL_TIMEOUT_MS and returns { error, hint } on
 * failure so the model can see and recover from problems.
 */

// @ts-expect-error — Deno-style URL imports resolve at runtime
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOOL_TIMEOUT_MS = 15_000;
const MAX_URL_BYTES   = 60_000;       // truncate fetch_url responses

export type ToolContext = {
  claim_id: string;
  opportunity_id: string;
  opportunity_slug: string;
  admin: SupabaseClient;
  // @ts-expect-error — Deno global at runtime
  env: typeof Deno.env;
};

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  exec: (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

// ─────────────────────────────────────────────────────────────────────────
// Shared tools
// ─────────────────────────────────────────────────────────────────────────

export const TOOLS: ToolDefinition[] = [
  {
    name: "read_opportunity_brief",
    description:
      "Read the full opportunity context (title, one_liner, gap, play, market, " +
      "timing, build_path, classifications) plus the cached Markdown build brief, " +
      "if one exists. Call this at the start of a session to ground yourself.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    exec: async (_input, ctx) => {
      const { data: opp, error: oppErr } = await ctx.admin
        .from("opportunities")
        .select(
          "title, one_liner, the_gap, the_play, market_size_summary, " +
          "timing_rationale, build_path, model_type, audience, industry, niche, " +
          "revenue_ceiling, founder_path, difficulty, starting_capital, " +
          "time_to_launch, build_stack_hint, moat, distribution_play, demand_trend",
        )
        .eq("id", ctx.opportunity_id)
        .maybeSingle();
      if (oppErr || !opp) return { error: "Opportunity not found" };

      const { data: brief } = await ctx.admin
        .from("build_briefs")
        .select("markdown, model, generated_at")
        .eq("opportunity_id", ctx.opportunity_id)
        .maybeSingle();

      return { opportunity: opp, build_brief: brief ?? null };
    },
  },
  {
    name: "read_signals",
    description:
      "Read recent cited research signals (TechCrunch / Reddit / HN / etc.) " +
      "attached to this opportunity. Use these to ground claims in real, dated " +
      "sources rather than speculation. Pass limit (default 10).",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const limit = Math.min(Number(input.limit ?? 10), 50);
      const { data, error } = await ctx.admin
        .from("opportunity_signals")
        .select("source_type, url, title, snippet, published_at")
        .eq("opportunity_id", ctx.opportunity_id)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) return { error: error.message };
      return { signals: data ?? [] };
    },
  },
  {
    name: "web_search",
    description:
      "Search the public web. Use for fresh market info, competitor research, " +
      "and recent news. Returns top results with title, url, and snippet.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, maxLength: 200 },
        num_results: { type: "integer", minimum: 1, maximum: 10, default: 5 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const query = String(input.query ?? "").trim();
      const n = Math.min(Number(input.num_results ?? 5), 10);
      if (!query) return { error: "query required" };

      const braveKey = ctx.env.get("BRAVE_API_KEY");
      const serpKey  = ctx.env.get("SERPAPI_API_KEY");

      if (braveKey) {
        const url = new URL("https://api.search.brave.com/res/v1/web/search");
        url.searchParams.set("q", query);
        url.searchParams.set("count", String(n));
        const res = await fetch(url, {
          headers: { "X-Subscription-Token": braveKey, "Accept": "application/json" },
        });
        if (!res.ok) return { error: `Brave search ${res.status}` };
        const json = await res.json() as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
        const results = (json.web?.results ?? []).slice(0, n).map((r) => ({
          title: r.title, url: r.url, snippet: r.description,
        }));
        return { provider: "brave", query, results };
      }

      if (serpKey) {
        const url = new URL("https://serpapi.com/search.json");
        url.searchParams.set("q", query);
        url.searchParams.set("num", String(n));
        url.searchParams.set("api_key", serpKey);
        const res = await fetch(url);
        if (!res.ok) return { error: `SerpAPI ${res.status}` };
        const json = await res.json() as { organic_results?: Array<{ title: string; link: string; snippet: string }> };
        const results = (json.organic_results ?? []).slice(0, n).map((r) => ({
          title: r.title, url: r.link, snippet: r.snippet,
        }));
        return { provider: "serpapi", query, results };
      }

      return {
        error: "web_search unavailable: set BRAVE_API_KEY or SERPAPI_API_KEY",
        hint: "Carry on using read_signals + read_opportunity_brief, and recommend the founder run their own search.",
      };
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch a URL and return its body as plain text (HTML stripped, truncated " +
      `to ${MAX_URL_BYTES} bytes). Use to read articles, blog posts, or docs ` +
      "that web_search surfaced.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string", pattern: "^https?://" } },
      required: ["url"],
      additionalProperties: false,
    },
    exec: async (input) => {
      const url = String(input.url ?? "");
      if (!/^https?:\/\//.test(url)) return { error: "url must be http(s)" };
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "GreenfieldAgent/1.0 (+hello@greenfield.app)" },
          redirect: "follow",
        });
        if (!res.ok) return { error: `fetch ${res.status}`, status: res.status };
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.startsWith("text/") && !ct.includes("html") && !ct.includes("json")) {
          return { error: `unsupported content-type ${ct}` };
        }
        let text = await res.text();
        if (ct.includes("html")) {
          text = text
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
        const truncated = text.length > MAX_URL_BYTES;
        return {
          url,
          status: res.status,
          content: truncated ? text.slice(0, MAX_URL_BYTES) : text,
          truncated,
        };
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
  },
  {
    name: "save_note",
    description:
      "Save a structured note that will appear on the run's timeline. Use this " +
      "for explicit handoffs to other agents on the team (e.g. \"GTM -> Sales: " +
      "5 target accounts attached\") or to bookmark a finding worth re-using.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["handoff", "insight", "todo", "decision"] },
        title: { type: "string", minLength: 1, maxLength: 200 },
        body: { type: "string", maxLength: 4000 },
      },
      required: ["kind", "title"],
      additionalProperties: false,
    },
    // save_note is a no-op exec; the run loop captures the call in tool_calls.
    // (We could write to a separate agent_notes table later — for v1 it's enough
    // to surface the note in the run's tool-call timeline.)
    exec: async (input) => ({
      saved: true,
      kind: String(input.kind),
      title: String(input.title),
      body: input.body ? String(input.body) : null,
    }),
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Role-specific tools — each agent role gets exactly one extra tool in
// addition to the shared set above.
// ─────────────────────────────────────────────────────────────────────────

export const ROLE_TOOLS: Record<string, ToolDefinition[]> = {
  // ── GTM: competitor scouting ────────────────────────────────────────
  gtm: [{
    name: "find_competitors",
    description:
      "Scout direct and adjacent competitors for the claimed opportunity. " +
      "Wraps web_search with a competitor-shaped query and returns the top 5 " +
      "candidate URLs with one-line descriptors. Use to ground positioning, " +
      "pricing, and 'why now' claims.",
    input_schema: {
      type: "object",
      properties: {
        space: {
          type: "string",
          description:
            "Concise description of the product category, e.g. 'AI compliance copilot for Series A SaaS'.",
          minLength: 2, maxLength: 200,
        },
        include_pricing_pages: { type: "boolean", default: false },
      },
      required: ["space"],
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const space = String(input.space ?? "").trim();
      if (!space) return { error: "space required" };

      const braveKey = ctx.env.get("BRAVE_API_KEY");
      const serpKey  = ctx.env.get("SERPAPI_API_KEY");
      if (!braveKey && !serpKey) {
        return {
          error: "find_competitors unavailable: set BRAVE_API_KEY or SERPAPI_API_KEY",
          hint: "Fall back to read_signals — the cited sources often surface incumbents in the snippet.",
        };
      }

      const query = input.include_pricing_pages
        ? `"${space}" alternatives pricing`
        : `"${space}" competitors alternatives "vs"`;

      // Delegate to the shared web_search tool implementation.
      const web = TOOLS.find((t) => t.name === "web_search")!;
      const wsResult = (await web.exec({ query, num_results: 8 }, ctx)) as {
        results?: Array<{ title: string; url: string; snippet: string }>;
        error?: string;
      };
      if (wsResult.error) return wsResult;

      // Naive de-duplication by host so we don't return 5 results from one site.
      const seenHost = new Set<string>();
      const candidates: Array<{ title: string; url: string; one_line: string }> = [];
      for (const r of wsResult.results ?? []) {
        try {
          const host = new URL(r.url).host.replace(/^www\./, "");
          if (seenHost.has(host)) continue;
          seenHost.add(host);
          candidates.push({ title: r.title, url: r.url, one_line: r.snippet });
          if (candidates.length >= 5) break;
        } catch { /* skip invalid urls */ }
      }
      return { space, candidates };
    },
  }],

  // ── Sales: lead lookup (Apollo / Clearbit / web_search fallback) ────
  sales: [{
    name: "find_companies",
    description:
      "Find candidate target companies matching a description. Uses Apollo if " +
      "APOLLO_API_KEY is set, otherwise falls back to web_search. Returns " +
      "company names, domains, and (Apollo only) headcount + industry.",
    input_schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          minLength: 4, maxLength: 280,
          description:
            "Plain-English buyer description, e.g. 'US Series A SaaS startups (20-80 employees) needing SOC 2'.",
        },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 10 },
      },
      required: ["description"],
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const description = String(input.description ?? "").trim();
      const limit = Math.min(Number(input.limit ?? 10), 25);
      if (!description) return { error: "description required" };

      const apollo = ctx.env.get("APOLLO_API_KEY");
      if (apollo) {
        // Apollo's mixed_companies/search endpoint accepts a single 'q_keywords'
        // string for natural language style queries.
        try {
          const res = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "X-Api-Key": apollo,
            },
            body: JSON.stringify({ q_keywords: description, page: 1, per_page: limit }),
          });
          if (!res.ok) return { error: `Apollo ${res.status}` };
          const json = await res.json() as {
            organizations?: Array<{
              name: string; website_url?: string; primary_domain?: string;
              estimated_num_employees?: number; industry?: string;
            }>;
          };
          const companies = (json.organizations ?? []).slice(0, limit).map((o) => ({
            name: o.name,
            domain: o.primary_domain ?? o.website_url,
            employees: o.estimated_num_employees ?? null,
            industry: o.industry ?? null,
          }));
          return { provider: "apollo", description, companies };
        } catch (e) {
          return { error: `Apollo request failed: ${(e as Error).message}` };
        }
      }

      // Fallback: web_search for "{description} companies"
      const web = TOOLS.find((t) => t.name === "web_search")!;
      const wsResult = (await web.exec(
        { query: `${description} companies`, num_results: limit },
        ctx,
      )) as {
        results?: Array<{ title: string; url: string; snippet: string }>;
        error?: string;
      };
      if (wsResult.error) {
        return {
          error: "find_companies unavailable: set APOLLO_API_KEY (preferred) or BRAVE_API_KEY / SERPAPI_API_KEY",
          hint: "Without these the only Sales lookup option is asking the founder to paste a list.",
        };
      }
      const seen = new Set<string>();
      const companies = [];
      for (const r of wsResult.results ?? []) {
        try {
          const host = new URL(r.url).host.replace(/^www\./, "");
          if (seen.has(host)) continue;
          seen.add(host);
          companies.push({ name: r.title, domain: host, snippet: r.snippet });
          if (companies.length >= limit) break;
        } catch { /* skip */ }
      }
      return { provider: "web_search", description, companies };
    },
  }],

  // ── Marketing: keyword volume (DataForSEO if keyed, else Google Trends) ──
  marketing: [{
    name: "keyword_volume",
    description:
      "Look up monthly search volume + trend direction for a keyword. Uses " +
      "DataForSEO if DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD are set, otherwise " +
      "falls back to Google Trends' public RSS endpoint (interest scores only, " +
      "not absolute volume).",
    input_schema: {
      type: "object",
      properties: {
        keyword: { type: "string", minLength: 2, maxLength: 120 },
        location: { type: "string", description: "ISO country code (e.g. 'US')", default: "US" },
      },
      required: ["keyword"],
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const keyword = String(input.keyword ?? "").trim();
      if (!keyword) return { error: "keyword required" };
      const location = String(input.location ?? "US").toUpperCase();

      const dsLogin = ctx.env.get("DATAFORSEO_LOGIN");
      const dsPass  = ctx.env.get("DATAFORSEO_PASSWORD");
      if (dsLogin && dsPass) {
        try {
          const auth = btoa(`${dsLogin}:${dsPass}`);
          const res = await fetch(
            "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
            {
              method: "POST",
              headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
              body: JSON.stringify([{ keywords: [keyword], location_code: location === "US" ? 2840 : undefined }]),
            },
          );
          if (!res.ok) return { error: `DataForSEO ${res.status}` };
          const json = await res.json() as {
            tasks?: Array<{ result?: Array<{ search_volume: number; competition: number; cpc?: number }> }>;
          };
          const r = json.tasks?.[0]?.result?.[0];
          if (!r) return { error: "no DataForSEO result" };
          return {
            provider: "dataforseo",
            keyword, location,
            monthly_volume: r.search_volume,
            competition: r.competition,
            cpc_usd: r.cpc ?? null,
          };
        } catch (e) {
          return { error: `DataForSEO request failed: ${(e as Error).message}` };
        }
      }

      // Fallback: Google Trends daily RSS — interest scores only, no absolute volume
      try {
        const url = new URL("https://trends.google.com/trends/api/explore");
        url.searchParams.set("hl", "en-US");
        url.searchParams.set("tz", "0");
        url.searchParams.set("req", JSON.stringify({
          comparisonItem: [{ keyword, geo: location, time: "today 12-m" }],
          category: 0, property: "",
        }));
        return {
          provider: "google_trends_fallback",
          keyword, location,
          note: "Google Trends gives relative interest (0-100), not absolute monthly volume. Set DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD for real numbers.",
          interest_url: url.toString(),
        };
      } catch (e) {
        return { error: `Trends fallback failed: ${(e as Error).message}` };
      }
    },
  }],

  // ── Research: M&A, industry reports, deep competitor landscape ───────
  research: [
    {
      name: "landscape_competitors",
      description:
        "Build a wide competitor landscape (10–15 candidates) with positioning notes. " +
        "Wider than find_competitors. Returns de-duplicated by host, with title, " +
        "URL, and a one-line positioning snippet. Use when scoping a category, not when " +
        "pricing against 3–5 named rivals.",
      input_schema: {
        type: "object",
        properties: {
          space: { type: "string", minLength: 2, maxLength: 200 },
          depth: { type: "integer", minimum: 5, maximum: 20, default: 12 },
        },
        required: ["space"],
        additionalProperties: false,
      },
      exec: async (input, ctx) => {
        const space = String(input.space ?? "").trim();
        if (!space) return { error: "space required" };
        const depth = Math.min(Number(input.depth ?? 12), 20);

        const web = TOOLS.find((t) => t.name === "web_search")!;
        const query = `"${space}" competitors OR alternatives OR landscape OR "compared to"`;
        const wsResult = (await web.exec({ query, num_results: 10 }, ctx)) as {
          results?: Array<{ title: string; url: string; snippet: string }>;
          error?: string;
        };
        if (wsResult.error) return wsResult;

        const seenHost = new Set<string>();
        const candidates: Array<{ title: string; url: string; positioning: string }> = [];
        for (const r of wsResult.results ?? []) {
          try {
            const host = new URL(r.url).host.replace(/^www\./, "");
            if (seenHost.has(host)) continue;
            seenHost.add(host);
            candidates.push({ title: r.title, url: r.url, positioning: r.snippet });
            if (candidates.length >= depth) break;
          } catch { /* skip invalid urls */ }
        }
        return { space, depth, candidates };
      },
    },
    {
      name: "find_acquisitions",
      description:
        "Surface recent acquisitions, mergers, and notable funding rounds in a sector. " +
        "Wraps web_search with deal-shaped query terms and a year filter. Returns the " +
        "top results with title, url, and snippet. Use to map who is consolidating and " +
        "who is exiting.",
      input_schema: {
        type: "object",
        properties: {
          sector: { type: "string", minLength: 2, maxLength: 200 },
          since_year: { type: "integer", minimum: 2015, maximum: 2030 },
          num_results: { type: "integer", minimum: 1, maximum: 10, default: 8 },
        },
        required: ["sector"],
        additionalProperties: false,
      },
      exec: async (input, ctx) => {
        const sector = String(input.sector ?? "").trim();
        if (!sector) return { error: "sector required" };
        const sinceYear = Number(input.since_year ?? new Date().getUTCFullYear() - 2);
        const n = Math.min(Number(input.num_results ?? 8), 10);

        const web = TOOLS.find((t) => t.name === "web_search")!;
        const query = `"${sector}" (acquired OR acquisition OR merger OR "acquires") after:${sinceYear}-01-01`;
        const wsResult = (await web.exec({ query, num_results: n }, ctx)) as {
          results?: Array<{ title: string; url: string; snippet: string }>;
          error?: string;
        };
        if (wsResult.error) return wsResult;

        return { sector, since_year: sinceYear, deals: wsResult.results ?? [] };
      },
    },
    {
      name: "find_industry_reports",
      description:
        "Find sized industry reports from named research firms (Gartner, IDC, McKinsey, " +
        "Forrester, Statista, CB Insights). Wraps web_search with a site filter and " +
        "optionally pulls the top result via fetch_url so the agent can cite it directly.",
      input_schema: {
        type: "object",
        properties: {
          topic: { type: "string", minLength: 2, maxLength: 200 },
          fetch_top: { type: "boolean", default: false },
        },
        required: ["topic"],
        additionalProperties: false,
      },
      exec: async (input, ctx) => {
        const topic = String(input.topic ?? "").trim();
        if (!topic) return { error: "topic required" };
        const fetchTop = !!input.fetch_top;

        const sites = ["gartner.com", "idc.com", "mckinsey.com", "forrester.com", "statista.com", "cbinsights.com"];
        const siteFilter = sites.map((s) => `site:${s}`).join(" OR ");
        const query = `"${topic}" market size OR "TAM" OR forecast (${siteFilter})`;

        const web = TOOLS.find((t) => t.name === "web_search")!;
        const wsResult = (await web.exec({ query, num_results: 8 }, ctx)) as {
          results?: Array<{ title: string; url: string; snippet: string }>;
          error?: string;
        };
        if (wsResult.error) return wsResult;

        const reports = wsResult.results ?? [];
        let top_content: string | null = null;
        if (fetchTop && reports[0]) {
          const fetch = TOOLS.find((t) => t.name === "fetch_url")!;
          const fr = (await fetch.exec({ url: reports[0].url }, ctx)) as { content?: string; error?: string };
          if (!fr.error && fr.content) top_content = fr.content.slice(0, 8_000);
        }
        return { topic, reports, top_content };
      },
    },
  ],

  // ── Engineering: GitHub code/repo search ─────────────────────────────
  engineering: [{
    name: "search_github",
    description:
      "Search public GitHub repositories by query. Useful for finding " +
      "open-source incumbents, reference implementations, libraries that " +
      "implement the workflow, or evidence of demand (stars, recent activity). " +
      "Set GITHUB_TOKEN to lift rate limits.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, maxLength: 200 },
        sort: { type: "string", enum: ["best-match", "stars", "updated"], default: "stars" },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    exec: async (input, ctx) => {
      const query = String(input.query ?? "").trim();
      const limit = Math.min(Number(input.limit ?? 5), 10);
      if (!query) return { error: "query required" };
      const sort = String(input.sort ?? "stars");

      const url = new URL("https://api.github.com/search/repositories");
      url.searchParams.set("q", query);
      if (sort !== "best-match") url.searchParams.set("sort", sort);
      url.searchParams.set("per_page", String(limit));

      const headers: Record<string, string> = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "GreenfieldAgent/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      };
      const token = ctx.env.get("GITHUB_TOKEN");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const res = await fetch(url, { headers });
        if (res.status === 403) {
          return {
            error: "GitHub rate-limited (403). Set GITHUB_TOKEN to lift the unauthenticated cap.",
          };
        }
        if (!res.ok) return { error: `GitHub ${res.status}` };
        const json = await res.json() as {
          items?: Array<{
            full_name: string; html_url: string; description: string | null;
            stargazers_count: number; pushed_at: string; language: string | null;
          }>;
        };
        const repos = (json.items ?? []).slice(0, limit).map((r) => ({
          full_name: r.full_name,
          url: r.html_url,
          description: r.description,
          stars: r.stargazers_count,
          pushed_at: r.pushed_at,
          language: r.language,
        }));
        return { query, sort, repos };
      } catch (e) {
        return { error: `GitHub request failed: ${(e as Error).message}` };
      }
    },
  }],
};

/**
 * Returns the full tool set for a given agent role: shared tools + the role's
 * one extra tool. Use this from the run-agent loop instead of importing TOOLS
 * directly so each agent only sees what's relevant.
 */
export function toolsForRole(role: string): ToolDefinition[] {
  return [...TOOLS, ...(ROLE_TOOLS[role] ?? [])];
}

// ─────────────────────────────────────────────────────────────────────────
// Tool runner with per-call timeout + error capture
// ─────────────────────────────────────────────────────────────────────────

export async function executeTool(
  tool: ToolDefinition,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<{ result: unknown; duration_ms: number }> {
  const started = Date.now();
  try {
    const result = await Promise.race([
      tool.exec(input, ctx),
      new Promise<{ error: string }>((_, reject) =>
        setTimeout(() => reject(new Error(`tool ${tool.name} timed out after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS),
      ),
    ]);
    return { result, duration_ms: Date.now() - started };
  } catch (e) {
    return {
      result: { error: (e as Error).message },
      duration_ms: Date.now() - started,
    };
  }
}
