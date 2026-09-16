/**
 * /api/mcp — the Dealbeam MCP endpoint (Model Context Protocol, Streamable
 * HTTP transport). Two ways in, both `Authorization: Bearer …`:
 *   - a personal API key (`dbk_…`) for Claude Code, Cursor, Claude Desktop
 *     via mcp-remote (Settings → Integrations);
 *   - an OAuth access token (`dbat_…`) for hosted connectors — claude.ai and
 *     ChatGPT discover /.well-known/oauth-protected-resource from the 401
 *     challenge below, register a client, and send the user through
 *     /oauth/authorize.
 *
 * Stateless: every request builds a fresh server bound to the caller's user,
 * so it runs fine on serverless and needs no session store. Rate-limited per
 * credential.
 */
import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { bearerChallenge } from "@/lib/oauth";
import { getUserTeamId } from "@/lib/team-auth";
import { createDealbeamMcpServer } from "@/lib/mcp/server";
import { rateLimit } from "@/lib/rate-limit";
import { APP_NAME } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generous for an agent loop, tight enough that a leaked key can't hammer the DB.
const limiter = rateLimit({ limit: 120, window: "60s", prefix: "rl:mcp" });

/**
 * 401 with the RFC 9728 challenge: MCP clients follow `resource_metadata` to
 * discover the authorization server and start the OAuth flow.
 */
function unauthorized(origin: string, message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 401,
      headers: { "WWW-Authenticate": bearerChallenge(origin, `${APP_NAME} MCP`, message) },
    }
  );
}

async function handle(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const principal = await authenticateMcpRequest(request);
  if (!principal) {
    return unauthorized(
      origin,
      "Missing, expired or invalid credential. Connect via OAuth, or create an API key under Settings > Integrations and send it as 'Authorization: Bearer <key>'."
    );
  }

  const { success } = await limiter.limit(`mcp:${principal.credentialId}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const teamId = await getUserTeamId(principal.userId);
    const server = createDealbeamMcpServer({
      userId: principal.userId,
      teamId,
      appUrl: origin,
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
        clientId: principal.credentialId,
        scopes: [],
        extra: { userId: principal.userId, kind: principal.kind, label: principal.label },
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
