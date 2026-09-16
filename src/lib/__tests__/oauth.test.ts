import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import {
  authorizationServerMetadata,
  bearerChallenge,
  buildRedirect,
  generateOpaqueToken,
  isAccessToken,
  isValidRedirectUri,
  normalizeScope,
  parseClientCredentials,
  protectedResourceMetadata,
  redirectUriMatches,
  resourceMatches,
  validateAuthorizeRequest,
  validateRegistration,
  verifyPkce,
  type AuthorizeParams,
  ACCESS_TOKEN_PREFIX,
  REFRESH_TOKEN_PREFIX,
} from "@/lib/oauth";

const ORIGIN = "https://app.dealbeam.com";
const MCP = `${ORIGIN}/api/mcp`;
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = createHash("sha256").update(VERIFIER).digest("base64url");
const CLIENT = { id: "c1", name: "Claude", redirectUris: ["https://claude.ai/api/mcp/auth_callback"] };

describe("tokens", () => {
  it("generates prefixed opaque tokens and classifies access tokens", () => {
    const access = generateOpaqueToken(ACCESS_TOKEN_PREFIX);
    const refresh = generateOpaqueToken(REFRESH_TOKEN_PREFIX);
    expect(access).toMatch(/^dbat_[0-9a-f]{40}$/);
    expect(isAccessToken(access)).toBe(true);
    expect(isAccessToken(refresh)).toBe(false);
    expect(isAccessToken("dbk_" + "a".repeat(40))).toBe(false);
  });
});

describe("verifyPkce", () => {
  it("accepts a matching S256 verifier and rejects everything else", () => {
    expect(verifyPkce(VERIFIER, CHALLENGE)).toBe(true);
    expect(verifyPkce(VERIFIER + "x", CHALLENGE)).toBe(false);
    expect(verifyPkce(VERIFIER, CHALLENGE, "plain")).toBe(false);
    expect(verifyPkce("short", CHALLENGE)).toBe(false);
  });
});

describe("redirect URIs", () => {
  it("allows https, loopback http, and private schemes; rejects the rest", () => {
    expect(isValidRedirectUri("https://claude.ai/cb")).toBe(true);
    expect(isValidRedirectUri("https://chatgpt.com/connector_platform_oauth_redirect")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3334/oauth/callback")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1/cb")).toBe(true);
    expect(isValidRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback")).toBe(true);
    expect(isValidRedirectUri("http://evil.com/cb")).toBe(false);
    expect(isValidRedirectUri("https://claude.ai/cb#frag")).toBe(false);
    expect(isValidRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isValidRedirectUri("data:text/html,hi")).toBe(false);
    expect(isValidRedirectUri("not a url")).toBe(false);
  });

  it("matches exactly, except loopback ports may vary", () => {
    expect(redirectUriMatches("https://a.io/cb", "https://a.io/cb")).toBe(true);
    expect(redirectUriMatches("https://a.io/cb", "https://a.io/cb2")).toBe(false);
    expect(redirectUriMatches("https://a.io/cb", "https://a.io:444/cb")).toBe(false);
    expect(redirectUriMatches("http://localhost/cb", "http://localhost:51234/cb")).toBe(true);
    expect(redirectUriMatches("http://localhost/cb", "http://localhost:51234/other")).toBe(false);
  });

  it("builds redirects without clobbering existing query params", () => {
    expect(buildRedirect("https://a.io/cb?x=1", { code: "abc", state: "s t", skip: undefined })).toBe(
      "https://a.io/cb?x=1&code=abc&state=s+t"
    );
  });
});

describe("normalizeScope", () => {
  it("defaults, dedupes, and rejects unknown scopes", () => {
    expect(normalizeScope(undefined)).toBe("read write");
    expect(normalizeScope("  ")).toBe("read write");
    expect(normalizeScope("read read")).toBe("read");
    expect(normalizeScope("admin")).toBeNull();
  });
});

describe("validateRegistration", () => {
  it("accepts a typical connector registration with defaults", () => {
    const r = validateRegistration({
      client_name: "Claude",
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    expect(r).toEqual({
      ok: true,
      client: {
        clientName: "Claude",
        redirectUris: ["https://claude.ai/api/mcp/auth_callback"],
        tokenEndpointAuthMethod: "none",
        clientUri: "",
        logoUri: "",
      },
    });
  });

  it("rejects missing or unsafe redirect URIs and unsupported metadata", () => {
    expect(validateRegistration({}).ok).toBe(false);
    expect(validateRegistration({ redirect_uris: ["http://evil.com/x"] })).toMatchObject({
      ok: false,
      error: "invalid_redirect_uri",
    });
    expect(
      validateRegistration({ redirect_uris: ["https://a.io/cb"], token_endpoint_auth_method: "private_key_jwt" })
    ).toMatchObject({ ok: false, error: "invalid_client_metadata" });
    expect(
      validateRegistration({ redirect_uris: ["https://a.io/cb"], grant_types: ["implicit"] })
    ).toMatchObject({ ok: false, error: "invalid_client_metadata" });
    expect(validateRegistration("nope").ok).toBe(false);
  });

  it("drops non-http client/logo URIs instead of failing", () => {
    const r = validateRegistration({
      redirect_uris: ["https://a.io/cb"],
      client_uri: "javascript:x",
      logo_uri: "https://a.io/logo.png",
    });
    expect(r.ok && r.client.clientUri).toBe("");
    expect(r.ok && r.client.logoUri).toBe("https://a.io/logo.png");
  });
});

describe("validateAuthorizeRequest", () => {
  const good = {
    response_type: "code",
    client_id: "c1",
    redirect_uri: CLIENT.redirectUris[0],
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
    state: "xyz",
    scope: "read write",
    resource: MCP,
  };

  it("accepts a valid PKCE request", () => {
    expect(validateAuthorizeRequest(good, CLIENT, MCP)).toEqual({
      ok: true,
      client: CLIENT,
      redirectUri: good.redirect_uri,
      codeChallenge: CHALLENGE,
      codeChallengeMethod: "S256",
      scope: "read write",
      state: "xyz",
      resource: MCP,
    });
  });

  it("is fatal (no redirect) for an unknown client or unregistered redirect_uri", () => {
    expect(validateAuthorizeRequest(good, null, MCP)).toMatchObject({ ok: false, fatal: true, error: "invalid_client" });
    expect(
      validateAuthorizeRequest({ ...good, redirect_uri: "https://evil.com/cb" }, CLIENT, MCP)
    ).toMatchObject({ ok: false, fatal: true, error: "invalid_request" });
    expect(validateAuthorizeRequest({ ...good, redirect_uri: null }, CLIENT, MCP)).toMatchObject({
      ok: false,
      fatal: true,
    });
  });

  it("redirects back with an error for recoverable problems, keeping state", () => {
    const cases: [AuthorizeParams, string][] = [
      [{ response_type: "token" }, "unsupported_response_type"],
      [{ code_challenge_method: "plain" }, "invalid_request"],
      [{ code_challenge: "short" }, "invalid_request"],
      [{ code_challenge: null }, "invalid_request"],
      [{ scope: "admin" }, "invalid_scope"],
      [{ resource: "https://other.example/api/mcp" }, "invalid_target"],
    ];
    for (const [patch, error] of cases) {
      expect(validateAuthorizeRequest({ ...good, ...patch }, CLIENT, MCP), JSON.stringify(patch)).toMatchObject({
        ok: false,
        fatal: false,
        redirectUri: good.redirect_uri,
        error,
        state: "xyz",
      });
    }
  });

  it("treats a missing code_challenge_method as S256 and a missing resource as fine", () => {
    const r = validateAuthorizeRequest(
      { ...good, code_challenge_method: null, resource: null, scope: null },
      CLIENT,
      MCP
    );
    expect(r).toMatchObject({ ok: true, scope: "read write", resource: undefined });
  });
});

describe("resourceMatches", () => {
  it("ignores a trailing slash but not the path or origin", () => {
    expect(resourceMatches(`${MCP}/`, MCP)).toBe(true);
    expect(resourceMatches(`${ORIGIN}/api/other`, MCP)).toBe(false);
    expect(resourceMatches("garbage", MCP)).toBe(false);
  });
});

describe("parseClientCredentials", () => {
  it("prefers HTTP Basic, then the body, then nothing", () => {
    const basic = "Basic " + Buffer.from("c1:s3cret").toString("base64");
    expect(parseClientCredentials(basic, { client_id: "other" })).toEqual({
      clientId: "c1",
      clientSecret: "s3cret",
      via: "basic",
    });
    expect(parseClientCredentials(null, { client_id: "c1" })).toEqual({
      clientId: "c1",
      clientSecret: null,
      via: "body",
    });
    expect(parseClientCredentials("Bearer x", {})).toEqual({ clientId: null, clientSecret: null, via: "none" });
  });
});

describe("discovery metadata", () => {
  it("points every endpoint at the issuer and advertises PKCE + DCR", () => {
    const as = authorizationServerMetadata(`${ORIGIN}/`);
    expect(as.issuer).toBe(ORIGIN);
    expect(as.authorization_endpoint).toBe(`${ORIGIN}/oauth/authorize`);
    expect(as.token_endpoint).toBe(`${ORIGIN}/api/oauth/token`);
    expect(as.registration_endpoint).toBe(`${ORIGIN}/api/oauth/register`);
    expect(as.code_challenge_methods_supported).toEqual(["S256"]);
    expect(as.grant_types_supported).toEqual(["authorization_code", "refresh_token"]);

    const rs = protectedResourceMetadata(ORIGIN);
    expect(rs.resource).toBe(MCP);
    expect(rs.authorization_servers).toEqual([ORIGIN]);
  });

  it("formats the 401 challenge with the resource metadata URL", () => {
    expect(bearerChallenge(ORIGIN, "Dealbeam MCP", 'bad "token"')).toBe(
      `Bearer realm="Dealbeam MCP", resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource", error="invalid_token", error_description="bad 'token'"`
    );
  });

  it("keeps the challenge Latin-1 so the Response constructor never throws", () => {
    const value = bearerChallenge(ORIGIN, "Dealbeam MCP", "Settings → Integrations — see docs");
    expect(value).toContain('error_description="Settings Integrations see docs"');
    expect(() => new Headers({ "WWW-Authenticate": value })).not.toThrow();
    expect(() => new Headers({ "WWW-Authenticate": "x → y" })).toThrow();
  });
});
