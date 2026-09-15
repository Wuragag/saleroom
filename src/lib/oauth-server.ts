/**
 * OAuth 2.1 authorization server — the stateful half (Prisma). Codes and
 * tokens are stored as SHA-256 hashes; plaintext values exist only in the
 * response that issues them. Refresh tokens rotate on every use.
 */
import { prisma } from "@/lib/prisma";
import {
  ACCESS_TOKEN_PREFIX,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_PREFIX,
  AUTH_CODE_TTL_SECONDS,
  REFRESH_TOKEN_PREFIX,
  REFRESH_TOKEN_TTL_SECONDS,
  generateOpaqueToken,
  hashToken,
  isAccessToken,
  looksLikeOpaqueToken,
  redirectUriMatches,
  safeEqual,
  verifyPkce,
  type KnownClient,
  type RegistrationInput,
} from "@/lib/oauth";

/** Minimum spacing between lastUsedAt writes for one credential. */
export const LAST_USED_WRITE_INTERVAL_MS = 5 * 60 * 1000;

// ── Clients ─────────────────────────────────────────────────────────────────

export interface RegisteredClient extends KnownClient {
  tokenEndpointAuthMethod: string;
  /** Plaintext secret, only present at registration for confidential clients. */
  clientSecret: string | null;
  clientUri: string;
  logoUri: string;
  createdAt: Date;
}

export async function registerClient(input: RegistrationInput): Promise<RegisteredClient> {
  const confidential = input.tokenEndpointAuthMethod !== "none";
  const secret = confidential ? generateOpaqueToken("dbcs_") : null;
  const row = await prisma.oAuthClient.create({
    data: {
      name: input.clientName,
      secretHash: secret ? hashToken(secret) : null,
      redirectUris: JSON.stringify(input.redirectUris),
      tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
      clientUri: input.clientUri,
      logoUri: input.logoUri,
    },
  });
  return {
    id: row.id,
    name: row.name,
    redirectUris: input.redirectUris,
    tokenEndpointAuthMethod: row.tokenEndpointAuthMethod,
    clientSecret: secret,
    clientUri: row.clientUri,
    logoUri: row.logoUri,
    createdAt: row.createdAt,
  };
}

export interface StoredClient extends KnownClient {
  secretHash: string | null;
  tokenEndpointAuthMethod: string;
  clientUri: string;
  logoUri: string;
}

export async function getClient(clientId: string): Promise<StoredClient | null> {
  if (!clientId) return null;
  const row = await prisma.oAuthClient.findUnique({ where: { id: clientId } });
  if (!row) return null;
  let redirectUris: string[] = [];
  try {
    const parsed = JSON.parse(row.redirectUris);
    if (Array.isArray(parsed)) redirectUris = parsed.filter((u) => typeof u === "string");
  } catch {
    /* corrupt row → no valid redirects → every authorize fails safely */
  }
  return {
    id: row.id,
    name: row.name,
    redirectUris,
    secretHash: row.secretHash,
    tokenEndpointAuthMethod: row.tokenEndpointAuthMethod,
    clientUri: row.clientUri,
    logoUri: row.logoUri,
  };
}

/**
 * Token-endpoint client authentication: public clients present no secret;
 * confidential clients must present the right one.
 */
export function clientSecretValid(client: StoredClient, secret: string | null): boolean {
  if (client.tokenEndpointAuthMethod === "none") return true;
  if (!client.secretHash || !secret) return false;
  return safeEqual(hashToken(secret), client.secretHash);
}

// ── Authorization codes ─────────────────────────────────────────────────────

export interface IssueCodeInput {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  scope: string;
  resource?: string;
}

export async function issueAuthorizationCode(input: IssueCodeInput): Promise<string> {
  const code = generateOpaqueToken(AUTH_CODE_PREFIX);
  await prisma.oAuthAuthorizationCode.create({
    data: {
      codeHash: hashToken(code),
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      scope: input.scope,
      resource: input.resource ?? null,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
    },
  });
  return code;
}

export interface IssuedTokens {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export type TokenError = { error: string; description: string };

async function issueTokens(
  clientId: string,
  userId: string,
  scope: string,
  /** Original approval time, carried over on refresh rotation. */
  grantedAt: Date = new Date()
): Promise<IssuedTokens> {
  const access = generateOpaqueToken(ACCESS_TOKEN_PREFIX);
  const refresh = generateOpaqueToken(REFRESH_TOKEN_PREFIX);
  const now = Date.now();
  await prisma.oAuthToken.create({
    data: {
      accessTokenHash: hashToken(access),
      refreshTokenHash: hashToken(refresh),
      clientId,
      userId,
      scope,
      grantedAt,
      accessExpiresAt: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshExpiresAt: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });
  return {
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refresh,
    scope,
  };
}

export interface ExchangeCodeInput {
  code: string;
  clientId: string;
  redirectUri: string | undefined;
  codeVerifier: string | undefined;
}

/**
 * authorization_code grant. Single use: the code is consumed atomically, so
 * a replay (or a race) fails with invalid_grant.
 */
export async function exchangeAuthorizationCode(
  input: ExchangeCodeInput
): Promise<IssuedTokens | TokenError> {
  if (!input.code || !looksLikeOpaqueToken(input.code) || !input.code.startsWith(AUTH_CODE_PREFIX)) {
    return { error: "invalid_grant", description: "Invalid authorization code" };
  }
  if (!input.codeVerifier) {
    return { error: "invalid_request", description: "code_verifier is required (PKCE)" };
  }

  const row = await prisma.oAuthAuthorizationCode.findUnique({
    where: { codeHash: hashToken(input.code) },
  });
  if (!row || row.clientId !== input.clientId) {
    return { error: "invalid_grant", description: "Invalid authorization code" };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return { error: "invalid_grant", description: "Authorization code expired" };
  }
  if (input.redirectUri !== undefined && !redirectUriMatches(row.redirectUri, input.redirectUri)) {
    return { error: "invalid_grant", description: "redirect_uri does not match" };
  }
  if (!verifyPkce(input.codeVerifier, row.codeChallenge, row.codeChallengeMethod)) {
    return { error: "invalid_grant", description: "PKCE verification failed" };
  }

  // Consume atomically — a second exchange of the same code sees count 0.
  const consumed = await prisma.oAuthAuthorizationCode.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (consumed.count === 0) {
    // Replayed code: RFC 6749 §4.1.2 says revoke what it already issued.
    await prisma.oAuthToken.updateMany({
      where: { clientId: row.clientId, userId: row.userId, revokedAt: null, createdAt: { gte: row.createdAt } },
      data: { revokedAt: new Date() },
    });
    return { error: "invalid_grant", description: "Authorization code already used" };
  }

  return issueTokens(row.clientId, row.userId, row.scope);
}

/** refresh_token grant — rotates: the presented token's row is revoked. */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<IssuedTokens | TokenError> {
  if (!refreshToken || !looksLikeOpaqueToken(refreshToken) || !refreshToken.startsWith(REFRESH_TOKEN_PREFIX)) {
    return { error: "invalid_grant", description: "Invalid refresh token" };
  }
  const row = await prisma.oAuthToken.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
  });
  if (!row || row.clientId !== clientId || row.revokedAt) {
    return { error: "invalid_grant", description: "Invalid refresh token" };
  }
  if (!row.refreshExpiresAt || row.refreshExpiresAt.getTime() < Date.now()) {
    return { error: "invalid_grant", description: "Refresh token expired" };
  }
  const rotated = await prisma.oAuthToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (rotated.count === 0) {
    return { error: "invalid_grant", description: "Invalid refresh token" };
  }
  return issueTokens(row.clientId, row.userId, row.scope, row.grantedAt);
}

// ── Resource-server side ────────────────────────────────────────────────────

export interface AccessTokenPrincipal {
  userId: string;
  clientId: string;
  clientName: string;
  tokenId: string;
  scope: string;
}

/** Resolves a bearer access token; null for anything invalid/expired/revoked. */
export async function authenticateAccessToken(token: string): Promise<AccessTokenPrincipal | null> {
  if (!isAccessToken(token)) return null;
  const row = await prisma.oAuthToken.findUnique({
    where: { accessTokenHash: hashToken(token) },
    include: { client: { select: { name: true } } },
  });
  if (!row || row.revokedAt || row.accessExpiresAt.getTime() < Date.now()) return null;

  // "Last used" is displayed at day granularity; throttle the write so an
  // agent loop doesn't turn every tool call into a row update.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > LAST_USED_WRITE_INTERVAL_MS) {
    prisma.oAuthToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {
        /* best-effort telemetry */
      });
  }

  return {
    userId: row.userId,
    clientId: row.clientId,
    clientName: row.client.name,
    tokenId: row.id,
    scope: row.scope,
  };
}

/** RFC 7009: revoke by access or refresh token. Unknown tokens succeed silently. */
export async function revokeToken(token: string, clientId: string): Promise<void> {
  if (!looksLikeOpaqueToken(token)) return;
  const hash = hashToken(token);
  await prisma.oAuthToken.updateMany({
    where: {
      clientId,
      revokedAt: null,
      OR: [{ accessTokenHash: hash }, { refreshTokenHash: hash }],
    },
    data: { revokedAt: new Date() },
  });
}

// ── Connected apps (settings UI) ────────────────────────────────────────────

export interface ConnectedApp {
  clientId: string;
  name: string;
  clientUri: string;
  logoUri: string;
  connectedAt: string;
  lastUsedAt: string | null;
}

/** Apps holding a live (unrevoked, unexpired refresh) grant for the user. */
export async function listConnectedApps(userId: string): Promise<ConnectedApp[]> {
  const tokens = await prisma.oAuthToken.findMany({
    where: { userId, revokedAt: null, refreshExpiresAt: { gt: new Date() } },
    include: { client: { select: { id: true, name: true, clientUri: true, logoUri: true } } },
    orderBy: { createdAt: "asc" },
  });
  const byClient = new Map<string, ConnectedApp>();
  for (const t of tokens) {
    const existing = byClient.get(t.clientId);
    const lastUsed = t.lastUsedAt?.toISOString() ?? null;
    const granted = t.grantedAt.toISOString();
    if (!existing) {
      byClient.set(t.clientId, {
        clientId: t.client.id,
        name: t.client.name,
        clientUri: t.client.clientUri,
        logoUri: t.client.logoUri,
        connectedAt: granted,
        lastUsedAt: lastUsed,
      });
    } else {
      if (granted < existing.connectedAt) existing.connectedAt = granted;
      if (lastUsed && (!existing.lastUsedAt || lastUsed > existing.lastUsedAt)) {
        existing.lastUsedAt = lastUsed;
      }
    }
  }
  return [...byClient.values()];
}

/** Revokes every token the user granted to a client. */
export async function disconnectApp(userId: string, clientId: string): Promise<number> {
  const result = await prisma.oAuthToken.updateMany({
    where: { userId, clientId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
