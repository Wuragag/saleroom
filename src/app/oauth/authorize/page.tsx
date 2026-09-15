import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { APP_NAME } from "@/lib/constants";
import { buildRedirect, validateAuthorizeRequest, MCP_PATH, type AuthorizeParams } from "@/lib/oauth";
import { getClient } from "@/lib/oauth-server";
import { OAuthConsent } from "@/components/oauth-consent";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

/** The deployment's public origin, from the proxy headers Vercel sets. */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}

/**
 * /oauth/authorize — the consent screen for connectors (claude.ai, ChatGPT,
 * …). Middleware sends signed-out users through sign-in first, preserving
 * the query string. Fatal problems (unknown client, unregistered
 * redirect_uri) render here and never redirect; everything else is reported
 * back to the client per RFC 6749.
 */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params: AuthorizeParams = {
    response_type: first(sp.response_type),
    client_id: first(sp.client_id),
    redirect_uri: first(sp.redirect_uri),
    code_challenge: first(sp.code_challenge),
    code_challenge_method: first(sp.code_challenge_method),
    state: first(sp.state),
    scope: first(sp.scope),
    resource: first(sp.resource),
  };

  // Middleware already bounces signed-out visitors to sign-in with the full
  // query preserved; this is only a guard against reaching here without one.
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const origin = await requestOrigin();
  const client = await getClient(params.client_id ?? "");
  const check = validateAuthorizeRequest(params, client, `${origin}${MCP_PATH}`);

  if (!check.ok) {
    if (check.fatal) {
      return (
        <ErrorCard
          title="Can't connect this app"
          message={`${check.description}. Go back to the app that sent you here and try connecting again.`}
        />
      );
    }
    redirect(
      buildRedirect(check.redirectUri, {
        error: check.error,
        error_description: check.description,
        state: check.state,
      })
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <OAuthConsent
        appName={APP_NAME}
        client={{
          id: check.client.id,
          name: check.client.name,
          uri: client?.clientUri ?? "",
          logoUri: client?.logoUri ?? "",
          // The one value the code is actually bound to — shown so a
          // self-registered client can't hide behind a borrowed name.
          redirectUri: check.redirectUri,
        }}
        user={{ name: session.user.name ?? "", email: session.user.email ?? "" }}
        request={{
          response_type: "code",
          client_id: check.client.id,
          redirect_uri: check.redirectUri,
          code_challenge: check.codeChallenge,
          code_challenge_method: check.codeChallengeMethod,
          state: check.state,
          scope: check.scope,
          resource: check.resource,
        }}
      />
    </main>
  );
}
