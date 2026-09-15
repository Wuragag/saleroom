/**
 * /api/mcp — the Dealbeam MCP endpoint (Model Context Protocol, Streamable
 * HTTP transport). Clients such as Claude Code, Claude Desktop (via
 * mcp-remote) and Cursor connect here with a personal API key:
 *
 *   Authorization: Bearer dbk_…
 *
 * Stateless: every request builds a fresh server bound to the key's user, so
 * it runs fine on serverless and needs no session store. Auth is the API key
 * (Settings → Integrations); rate-limited per key.
 */
import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateApiKey } from "@/lib/api-keys";
import { getUserTeamId } from "@/lib/team-auth";
import { createDealbeamMcpServer } from "@/lib/mcp/server";
import { rateLimit } from "@/lib/rate-limit";
import { APP_NAME } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generous for an agent loop, tight enough that a leaked key can't hammer the DB.
const limiter = rateLimit({ limit: 120, window: "60s", prefix: "rl:mcp" });

function unauthorized(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer realm="${APP_NAME} MCP", error="invalid_token"`,
      },
    }
  );
}

async function handle(request: Request): Promise<Response> {
  const principal = await authenticateApiKey(request);
  if (!principal) {
    return unauthorized(
      "Missing or invalid API key. Create one under Settings → Integrations and send it as 'Authorization: Bearer <key>'."
    );
  }

  const { success } = await limiter.limit(`mcp:${principal.keyId}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const teamId = await getUserTeamId(principal.userId);
    const server = createDealbeamMcpServer({
      userId: principal.userId,
      teamId,
      appUrl: new URL(request.url).origin,
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      // Stateless: no session ids, plain JSON responses (no SSE to keep open).
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return await transport.handleRequest(request, {
      authInfo: {
        token: "",
        clientId: principal.keyId,
        scopes: [],
        extra: { userId: principal.userId, keyName: principal.keyName },
      },
    });
  } catch (err) {
    console.error("[mcp] request failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
