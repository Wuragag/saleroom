import { withErrorHandler } from "@/lib/api-error";
import { getClientIp } from "@/lib/rate-limit";
import { parseClientCredentials } from "@/lib/oauth";
import { clientSecretValid, getClient, revokeToken } from "@/lib/oauth-server";
import { oauthError, oauthJson, readOAuthBody, tokenLimiter } from "@/lib/oauth-http";

export const dynamic = "force-dynamic";

/** POST /api/oauth/revoke — RFC 7009. Always 200 for a well-formed request. */
export const POST = withErrorHandler(async (request: Request) => {
  const { success } = await tokenLimiter.limit(`revoke:${getClientIp(request)}`);
  if (!success) return oauthError("too_many_requests", "Try again later", 429);

  const form = await readOAuthBody(request);
  const creds = parseClientCredentials(request.headers.get("authorization"), form);
  if (!creds.clientId) return oauthError("invalid_client", "client_id is required", 401);
  const client = await getClient(creds.clientId);
  if (!client || !clientSecretValid(client, creds.clientSecret)) {
    return oauthError("invalid_client", "Unknown client or bad credentials", 401);
  }
  if (!form.token) return oauthError("invalid_request", "token is required");

  await revokeToken(form.token, client.id);
  return oauthJson({});
});
