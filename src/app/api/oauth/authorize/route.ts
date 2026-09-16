import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { getClientIp } from "@/lib/rate-limit";
import { buildRedirect, validateAuthorizeRequest, MCP_PATH, type AuthorizeParams } from "@/lib/oauth";
import { getClient, issueAuthorizationCode } from "@/lib/oauth-server";
import { authorizeLimiter } from "@/lib/oauth-http";

export const dynamic = "force-dynamic";

interface DecisionBody extends AuthorizeParams {
  approved?: boolean;
}

/**
 * POST /api/oauth/authorize — the consent decision from /oauth/authorize.
 * Re-validates the whole request (never trusts the page), mints a code on
 * approval, and returns the URL the browser should navigate to. The page
 * navigates via JS rather than a form action so the CSP's `form-action
 * 'self'` doesn't block the redirect to the client.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { success } = await authorizeLimiter.limit(`authorize:${getClientIp(request)}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await safeJson<DecisionBody>(request)) ?? {};
  const origin = new URL(request.url).origin;
  const client = await getClient(typeof body.client_id === "string" ? body.client_id : "");
  const check = validateAuthorizeRequest(body, client, `${origin}${MCP_PATH}`);

  if (!check.ok) {
    if (check.fatal) {
      return NextResponse.json({ error: check.description }, { status: 400 });
    }
    return NextResponse.json({
      redirectTo: buildRedirect(check.redirectUri, {
        error: check.error,
        error_description: check.description,
        state: check.state,
      }),
    });
  }

  if (body.approved !== true) {
    return NextResponse.json({
      redirectTo: buildRedirect(check.redirectUri, {
        error: "access_denied",
        error_description: "The user declined the request",
        state: check.state,
      }),
    });
  }

  const code = await issueAuthorizationCode({
    clientId: check.client.id,
    userId: session.user.id,
    redirectUri: check.redirectUri,
    codeChallenge: check.codeChallenge,
    codeChallengeMethod: check.codeChallengeMethod,
    scope: check.scope,
    resource: check.resource,
  });

  return NextResponse.json({
    redirectTo: buildRedirect(check.redirectUri, { code, state: check.state }),
  });
});
