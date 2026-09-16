import { withErrorHandler } from "@/lib/api-error";
import { getClientIp } from "@/lib/rate-limit";
import { parseClientCredentials } from "@/lib/oauth";
import {
  clientSecretValid,
  exchangeAuthorizationCode,
  getClient,
  refreshAccessToken,
} from "@/lib/oauth-server";
import { oauthError, oauthJson, readOAuthBody, tokenLimiter } from "@/lib/oauth-http";

export const dynamic = "force-dynamic";

/**
 * POST /api/oauth/token — authorization_code (PKCE) and refresh_token grants.
 * Public clients authenticate by client_id alone; confidential ones add
 * their secret (Basic or body). Responses are never cacheable.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const { success } = await tokenLimiter.limit(`token:${getClientIp(request)}`);
  if (!success) return oauthError("too_many_requests", "Try again later", 429);

  const form = await readOAuthBody(request);
  const creds = parseClientCredentials(request.headers.get("authorization"), form);
  if (!creds.clientId) {
    return oauthError("invalid_client", "client_id is required", 401, {
      "WWW-Authenticate": 'Basic realm="oauth"',
    });
  }
  const client = await getClient(creds.clientId);
  if (!client || !clientSecretValid(client, creds.clientSecret)) {
    return oauthError("invalid_client", "Unknown client or bad credentials", 401, {
      "WWW-Authenticate": 'Basic realm="oauth"',
    });
  }

  switch (form.grant_type) {
    case "authorization_code": {
      const result = await exchangeAuthorizationCode({
        code: form.code ?? "",
        clientId: client.id,
        redirectUri: form.redirect_uri,
        codeVerifier: form.code_verifier,
      });
      return "error" in result ? oauthError(result.error, result.description) : oauthJson(result);
    }
    case "refresh_token": {
      const result = await refreshAccessToken(form.refresh_token ?? "", client.id);
      return "error" in result ? oauthError(result.error, result.description) : oauthJson(result);
    }
    default:
      return oauthError(
        "unsupported_grant_type",
        "grant_type must be authorization_code or refresh_token"
      );
  }
});
