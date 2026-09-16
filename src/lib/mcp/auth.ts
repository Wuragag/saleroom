/**
 * Resolves who is calling the MCP endpoint. Two credential kinds share the
 * bearer header:
 *   - personal API keys (`dbk_…`) — pasted into Claude Code / Cursor configs
 *   - OAuth access tokens (`dbat_…`) — issued by /api/oauth/token after the
 *     user approved a connector (claude.ai, ChatGPT) on /oauth/authorize
 * Both act strictly as their user.
 */
import { authenticateApiKey, looksLikeApiKey, parseBearerToken } from "@/lib/api-keys";
import { authenticateAccessToken } from "@/lib/oauth-server";
import { isAccessToken } from "@/lib/oauth";

export interface McpCaller {
  userId: string;
  kind: "api_key" | "oauth";
  /** Stable id for rate limiting (key id / token row id). */
  credentialId: string;
  /** Human label: key name or connected app name. */
  label: string;
}

export async function authenticateMcpRequest(request: Request): Promise<McpCaller | null> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) return null;

  if (looksLikeApiKey(token)) {
    const key = await authenticateApiKey(request);
    return key
      ? { userId: key.userId, kind: "api_key", credentialId: key.keyId, label: key.keyName }
      : null;
  }

  if (isAccessToken(token)) {
    const grant = await authenticateAccessToken(token);
    return grant
      ? { userId: grant.userId, kind: "oauth", credentialId: grant.tokenId, label: grant.clientName }
      : null;
  }

  return null;
}
