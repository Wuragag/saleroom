/**
 * OAuth 2.1 authorization server — the pure half. Dealbeam is both the
 * resource server (/api/mcp) and the authorization server, so hosted AI
 * assistants (claude.ai, ChatGPT) can add it as a connector: they discover
 * the metadata, register a client dynamically (RFC 7591), send the user
 * through /oauth/authorize (PKCE S256, RFC 7636), and exchange the code at
 * /api/oauth/token. Tokens are opaque and act as the user who approved them.
 *
 * Everything here is side-effect free and unit-tested; DB access lives in
 * oauth-server.ts.
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const ACCESS_TOKEN_PREFIX = "dbat_";
export const REFRESH_TOKEN_PREFIX = "dbrt_";
export const AUTH_CODE_PREFIX = "dbac_";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const AUTH_CODE_TTL_SECONDS = 10 * 60; // 10 minutes

/** Scopes are advisory today: every token acts with the user's full permissions. */
export const OAUTH_SCOPES = ["read", "write"] as const;
export const DEFAULT_SCOPE = OAUTH_SCOPES.join(" ");

export const MCP_PATH = "/api/mcp";
export const AUTHORIZE_PATH = "/oauth/authorize";
export const TOKEN_PATH = "/api/oauth/token";
export const REGISTER_PATH = "/api/oauth/register";
export const REVOKE_PATH = "/api/oauth/revoke";

export const SUPPORTED_AUTH_METHODS = ["none", "client_secret_post", "client_secret_basic"] as const;
export type TokenEndpointAuthMethod = (typeof SUPPORTED_AUTH_METHODS)[number];

const OPAQUE_RE = /^db(at|rt|ac)_[0-9a-f]{40}$/;

// ── Tokens ──────────────────────────────────────────────────────────────────

export function generateOpaqueToken(prefix: string): string {
  return prefix + randomBytes(20).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function looksLikeOpaqueToken(value: string): boolean {
  return OPAQUE_RE.test(value);
}

export function isAccessToken(value: string): boolean {
  return value.startsWith(ACCESS_TOKEN_PREFIX) && looksLikeOpaqueToken(value);
}

/** Constant-time string equality (for secrets / hashes). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// ── PKCE ────────────────────────────────────────────────────────────────────

const VERIFIER_RE = /^[A-Za-z0-9\-._~]{43,128}$/;

export function verifyPkce(verifier: string, challenge: string, method = "S256"): boolean {
  if (method !== "S256") return false;
  if (!VERIFIER_RE.test(verifier)) return false;
  const expected = createHash("sha256").update(verifier).digest("base64url");
  return safeEqual(expected, challenge);
}

// ── Redirect URIs ───────────────────────────────────────────────────────────

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const FORBIDDEN_SCHEMES = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);

/**
 * RFC 8252-style rules: https anywhere, http only on loopback, or a private
 * (custom) scheme for native apps. No fragments, ever.
 */
export function isValidRedirectUri(uri: string): boolean {
  if (typeof uri !== "string" || uri.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (FORBIDDEN_SCHEMES.has(url.protocol)) return false;
  if (url.protocol === "https:") return !!url.hostname;
  if (url.protocol === "http:") return LOOPBACK_HOSTS.has(url.hostname);
  // Private-use scheme (e.g. "myapp:/callback") — must be a real scheme.
  return /^[a-z][a-z0-9+.-]*:$/i.test(url.protocol);
}

/**
 * Exact-string match, except loopback http where the port may vary
 * (RFC 8252 §7.3 — native apps bind an ephemeral port).
 */
export function redirectUriMatches(registered: string, requested: string): boolean {
  if (registered === requested) return true;
  try {
    const a = new URL(registered);
    const b = new URL(requested);
    return (
      a.protocol === "http:" &&
      b.protocol === "http:" &&
      LOOPBACK_HOSTS.has(a.hostname) &&
      a.hostname === b.hostname &&
      a.pathname === b.pathname &&
      a.search === b.search
    );
  } catch {
    return false;
  }
}

export function buildRedirect(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  return url.toString();
}

// ── Scopes ──────────────────────────────────────────────────────────────────

/** Normalizes a requested scope to the supported subset; empty → default. */
export function normalizeScope(scope: string | undefined | null): string | null {
  if (!scope || !scope.trim()) return DEFAULT_SCOPE;
  const requested = scope.trim().split(/\s+/);
  const allowed = new Set<string>(OAUTH_SCOPES);
  if (requested.some((s) => !allowed.has(s))) return null;
  return [...new Set(requested)].join(" ");
}

// ── Dynamic client registration (RFC 7591) ──────────────────────────────────

export interface RegistrationInput {
  clientName: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: TokenEndpointAuthMethod;
  clientUri: string;
  logoUri: string;
}

export type RegistrationResult =
  | { ok: true; client: RegistrationInput }
  | { ok: false; error: "invalid_client_metadata" | "invalid_redirect_uri"; description: string };

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function httpsUrlOrEmpty(v: unknown): string {
  const s = str(v, 2048);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function validateRegistration(body: unknown): RegistrationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_client_metadata", description: "Body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  const redirectUris = Array.isArray(b.redirect_uris) ? b.redirect_uris : [];
  if (redirectUris.length === 0 || redirectUris.length > 20) {
    return { ok: false, error: "invalid_redirect_uri", description: "redirect_uris must list 1–20 URIs" };
  }
  for (const uri of redirectUris) {
    if (typeof uri !== "string" || !isValidRedirectUri(uri)) {
      return {
        ok: false,
        error: "invalid_redirect_uri",
        description: `Invalid redirect_uri: ${typeof uri === "string" ? uri : "(not a string)"} (https, loopback http, or a private scheme; no fragment)`,
      };
    }
  }

  const method = (b.token_endpoint_auth_method ?? "none") as string;
  if (!SUPPORTED_AUTH_METHODS.includes(method as TokenEndpointAuthMethod)) {
    return {
      ok: false,
      error: "invalid_client_metadata",
      description: `Unsupported token_endpoint_auth_method: ${method}`,
    };
  }

  const grantTypes = Array.isArray(b.grant_types) ? (b.grant_types as unknown[]) : ["authorization_code"];
  if (grantTypes.some((g) => g !== "authorization_code" && g !== "refresh_token")) {
    return {
      ok: false,
      error: "invalid_client_metadata",
      description: "Only authorization_code and refresh_token grants are supported",
    };
  }
  const responseTypes = Array.isArray(b.response_types) ? (b.response_types as unknown[]) : ["code"];
  if (responseTypes.some((r) => r !== "code")) {
    return { ok: false, error: "invalid_client_metadata", description: "Only response_type=code is supported" };
  }

  return {
    ok: true,
    client: {
      clientName: str(b.client_name, 120) || "Unnamed app",
      redirectUris: [...new Set(redirectUris as string[])],
      tokenEndpointAuthMethod: method as TokenEndpointAuthMethod,
      clientUri: httpsUrlOrEmpty(b.client_uri),
      logoUri: httpsUrlOrEmpty(b.logo_uri),
    },
  };
}

// ── Authorization request ───────────────────────────────────────────────────

export interface AuthorizeParams {
  response_type?: string | null;
  client_id?: string | null;
  redirect_uri?: string | null;
  code_challenge?: string | null;
  code_challenge_method?: string | null;
  state?: string | null;
  scope?: string | null;
  resource?: string | null;
}

export interface KnownClient {
  id: string;
  name: string;
  redirectUris: string[];
}

export type AuthorizeValidation =
  | {
      ok: true;
      client: KnownClient;
      redirectUri: string;
      codeChallenge: string;
      codeChallengeMethod: "S256";
      scope: string;
      state: string | undefined;
      resource: string | undefined;
    }
  /** Don't redirect: the client or redirect_uri can't be trusted. */
  | { ok: false; fatal: true; error: string; description: string }
  /** Safe to report back to the client via redirect. */
  | { ok: false; fatal: false; redirectUri: string; error: string; description: string; state: string | undefined };

/**
 * Validates an /oauth/authorize request against the registered client.
 * `client` is null when client_id is unknown. `resource` (RFC 8707), when
 * present, must name this deployment's MCP endpoint.
 */
export function validateAuthorizeRequest(
  params: AuthorizeParams,
  client: KnownClient | null,
  mcpResource: string
): AuthorizeValidation {
  if (!params.client_id || !client) {
    return { ok: false, fatal: true, error: "invalid_client", description: "Unknown client_id" };
  }
  const redirectUri = params.redirect_uri ?? "";
  if (!redirectUri) {
    return { ok: false, fatal: true, error: "invalid_request", description: "redirect_uri is required" };
  }
  if (!client.redirectUris.some((r) => redirectUriMatches(r, redirectUri))) {
    return {
      ok: false,
      fatal: true,
      error: "invalid_request",
      description: "redirect_uri is not registered for this client",
    };
  }

  const state = params.state ?? undefined;
  const reject = (error: string, description: string): AuthorizeValidation => ({
    ok: false,
    fatal: false,
    redirectUri,
    error,
    description,
    state,
  });

  if (params.response_type !== "code") {
    return reject("unsupported_response_type", "Only response_type=code is supported");
  }
  const method = params.code_challenge_method ?? "S256";
  if (method !== "S256") {
    return reject("invalid_request", "code_challenge_method must be S256");
  }
  const challenge = params.code_challenge ?? "";
  if (!/^[A-Za-z0-9\-_]{43}$/.test(challenge)) {
    return reject("invalid_request", "A valid S256 code_challenge is required (PKCE)");
  }
  const scope = normalizeScope(params.scope);
  if (scope === null) {
    return reject("invalid_scope", `Supported scopes: ${OAUTH_SCOPES.join(", ")}`);
  }
  const resource = params.resource ?? undefined;
  if (resource !== undefined && !resourceMatches(resource, mcpResource)) {
    return reject("invalid_target", `resource must be ${mcpResource}`);
  }

  return {
    ok: true,
    client,
    redirectUri,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scope,
    state,
    resource,
  };
}

/** Lenient RFC 8707 match: same origin + path, ignoring a trailing slash. */
export function resourceMatches(requested: string, expected: string): boolean {
  try {
    const a = new URL(requested);
    const b = new URL(expected);
    const norm = (u: URL) => `${u.origin}${u.pathname.replace(/\/$/, "")}`;
    return norm(a) === norm(b);
  } catch {
    return false;
  }
}

// ── Token endpoint client authentication ────────────────────────────────────

export interface ClientCredentials {
  clientId: string | null;
  clientSecret: string | null;
  /** Where the credentials came from — for error reporting. */
  via: "basic" | "body" | "none";
}

export function parseClientCredentials(
  authorization: string | null | undefined,
  form: Record<string, string | undefined>
): ClientCredentials {
  const basic = /^Basic\s+(.+)$/i.exec(authorization?.trim() ?? "");
  if (basic) {
    try {
      const decoded = Buffer.from(basic[1], "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      if (idx > 0) {
        return {
          clientId: decodeURIComponent(decoded.slice(0, idx)),
          clientSecret: decodeURIComponent(decoded.slice(idx + 1)),
          via: "basic",
        };
      }
    } catch {
      /* fall through to body */
    }
  }
  if (form.client_id) {
    return { clientId: form.client_id, clientSecret: form.client_secret ?? null, via: "body" };
  }
  return { clientId: null, clientSecret: null, via: "none" };
}

// ── Discovery metadata ──────────────────────────────────────────────────────

export function authorizationServerMetadata(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  return {
    issuer: base,
    authorization_endpoint: `${base}${AUTHORIZE_PATH}`,
    token_endpoint: `${base}${TOKEN_PATH}`,
    registration_endpoint: `${base}${REGISTER_PATH}`,
    revocation_endpoint: `${base}${REVOKE_PATH}`,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [...SUPPORTED_AUTH_METHODS],
    revocation_endpoint_auth_methods_supported: [...SUPPORTED_AUTH_METHODS],
    scopes_supported: [...OAUTH_SCOPES],
    service_documentation: `${base}/settings?tab=integrations`,
  };
}

export function protectedResourceMetadata(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  return {
    resource: `${base}${MCP_PATH}`,
    authorization_servers: [base],
    scopes_supported: [...OAUTH_SCOPES],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}/settings?tab=integrations`,
  };
}

/**
 * The WWW-Authenticate value the MCP endpoint sends on 401 (RFC 9728 §5.1).
 * HTTP header values must be Latin-1, so anything outside that range (an
 * arrow, an em dash) is dropped — otherwise constructing the Response throws
 * and the client sees a 500 instead of the challenge.
 */
export function bearerChallenge(issuer: string, realm: string, description?: string): string {
  const base = issuer.replace(/\/$/, "");
  const parts = [
    `realm="${headerSafe(realm)}"`,
    `resource_metadata="${base}/.well-known/oauth-protected-resource"`,
  ];
  if (description) {
    parts.push(`error="invalid_token"`, `error_description="${headerSafe(description)}"`);
  }
  return `Bearer ${parts.join(", ")}`;
}

function headerSafe(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/"/g, "'").replace(/[^\x20-\x7e\xa0-\xff]/g, "").replace(/\s+/g, " ").trim();
}
