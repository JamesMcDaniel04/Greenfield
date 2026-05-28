/**
 * Klavis Strata MCP client.
 *
 * Strata is Klavis's aggregator endpoint — one HTTPS URL that fronts ~85 third-
 * party integrations (Gmail, Slack, GitHub, Stripe, Notion, …). It speaks the
 * Streamable HTTP variant of MCP (JSON-RPC over POST, SSE-framed responses).
 *
 * We expose 4 navigator tools to the model — `discover_server_categories_or_actions`,
 * `get_category_actions`, `get_action_details`, `execute_action` — by listing
 * them from Strata at run start and proxying each tool/call back over HTTP.
 *
 * Strata is stateless (no Mcp-Session-Id header on initialize), so each request
 * stands on its own. If that changes, plumb sessionId through the rpc() helper.
 *
 * Activation: set STRATA_MCP_URL in Supabase secrets. Absent → no Klavis tools.
 */

import type { ToolDefinition, ToolContext } from "./tools.ts";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

type McpToolListing = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

type McpToolCallResult = {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

let rpcId = 0;

/**
 * Strata returns `text/event-stream` with a single `data:` line carrying the
 * JSON-RPC payload. Parse defensively in case the framing ever changes.
 */
function parseSseJson<T>(body: string): JsonRpcResponse<T> {
  const dataLine = body.split("\n").find((l) => l.startsWith("data:"));
  if (!dataLine) {
    // Fall back to plain JSON in case Strata switches to non-SSE responses.
    return JSON.parse(body) as JsonRpcResponse<T>;
  }
  return JSON.parse(dataLine.slice("data:".length).trim()) as JsonRpcResponse<T>;
}

async function rpc<T>(url: string, method: string, params: Record<string, unknown>): Promise<T> {
  const id = ++rpcId;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  if (!res.ok) {
    throw new Error(`Klavis ${method} HTTP ${res.status}`);
  }
  const text = await res.text();
  const parsed = parseSseJson<T>(text);
  if (parsed.error) {
    throw new Error(`Klavis ${method}: ${parsed.error.message}`);
  }
  if (!parsed.result) {
    throw new Error(`Klavis ${method}: empty result`);
  }
  return parsed.result;
}

/**
 * Fetch the navigator tool list from Strata and adapt each one to our
 * ToolDefinition shape. The exec proxies tools/call back over HTTP and
 * collapses the MCP content envelope into a plain JSON-ish value.
 */
export async function getKlavisTools(url: string): Promise<ToolDefinition[]> {
  // Initialize is required by MCP even when the server is stateless; some
  // implementations refuse tools/list otherwise.
  await rpc<unknown>(url, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "greenfield-run-agent", version: "1.0" },
  });

  const listing = await rpc<{ tools: McpToolListing[] }>(url, "tools/list", {});

  return listing.tools.map((t) => toolDefinitionFromMcp(url, t));
}

function toolDefinitionFromMcp(url: string, t: McpToolListing): ToolDefinition {
  return {
    name: t.name,
    description: `[via Klavis] ${t.description ?? ""}`.trim(),
    input_schema: t.inputSchema,
    exec: async (input: Record<string, unknown>, _ctx: ToolContext) => {
      try {
        const result = await rpc<McpToolCallResult>(url, "tools/call", {
          name: t.name,
          arguments: input,
        });

        // Collapse MCP's [{type:"text", text:"…"}] content envelope into a
        // single string when the server only returns text (the common case).
        const textParts = (result.content ?? [])
          .filter((c) => c.type === "text" && typeof c.text === "string")
          .map((c) => c.text!);

        const collapsed = textParts.length > 0 ? textParts.join("\n") : null;

        // Many Klavis actions return JSON-encoded strings — try to unwrap so
        // the model sees structured data, not stringified JSON inside text.
        if (collapsed) {
          try {
            const parsed = JSON.parse(collapsed);
            return result.isError ? { error: "Klavis tool error", details: parsed } : parsed;
          } catch {
            return result.isError ? { error: collapsed } : { text: collapsed };
          }
        }
        return result.isError ? { error: "Klavis returned isError with no content" } : result;
      } catch (e) {
        return { error: (e as Error).message };
      }
    },
  };
}
