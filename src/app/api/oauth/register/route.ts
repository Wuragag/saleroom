import { withErrorHandler } from "@/lib/api-error";
import { getClientIp } from "@/lib/rate-limit";
import { validateRegistration } from "@/lib/oauth";
import { registerClient } from "@/lib/oauth-server";
import { oauthError, oauthJson, registerLimiter } from "@/lib/oauth-http";

export const dynamic = "force-dynamic";

/**
 * POST /api/oauth/register — RFC 7591 dynamic client registration. Open by
 * design (that's how claude.ai / ChatGPT onboard without manual setup); a
 * registered client can't do anything until a user approves it on
 * /oauth/authorize, and PKCE is mandatory, so the record itself grants nothing.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const { success } = await registerLimiter.limit(`register:${getClientIp(request)}`);
  if (!success) return oauthError("too_many_requests", "Try again later", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return oauthError("invalid_client_metadata", "Body must be JSON");
  }

  const result = validateRegistration(body);
  if (!result.ok) return oauthError(result.error, result.description);

  const client = await registerClient(result.client);
  return oauthJson(
    {
      client_id: client.id,
      ...(client.clientSecret ? { client_secret: client.clientSecret, client_secret_expires_at: 0 } : {}),
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      ...(client.clientUri ? { client_uri: client.clientUri } : {}),
      ...(client.logoUri ? { logo_uri: client.logoUri } : {}),
    },
    201
  );
});
