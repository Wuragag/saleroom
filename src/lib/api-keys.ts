/**
 * Personal API keys — the credential for programmatic access (today: the MCP
 * server at /api/mcp). Design mirrors the impersonation tokens: the secret is
 * random, only its SHA-256 hash is stored, and lookups are by hash so a DB
 * read never yields a usable key.
 *
 * Key shape: `dbk_` + 40 hex chars (160 bits of entropy). The pure helpers
 * (generate / hash / parse) live here so they're unit-testable without a DB;
 * `authenticateApiKey` is the only function that touches Prisma.
 */
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const API_KEY_PREFIX = "dbk_";
/** How many leading characters are stored/displayed to tell keys apart. */
export const API_KEY_DISPLAY_CHARS = 12;
/** Per-user cap — keeps the settings list sane and bounds token sprawl. */
export const MAX_API_KEYS_PER_USER = 10;
export const API_KEY_NAME_MAX = 60;
/** Minimum spacing between lastUsedAt writes for one key. */
export const LAST_USED_WRITE_INTERVAL_MS = 5 * 60 * 1000;

/** Advisory-lock key serializing key creation for one user (cap enforcement). */
export function apiKeyLockKey(userId: string): string {
  return `user:${userId}:api-keys`;
}

const KEY_RE = /^dbk_[0-9a-f]{40}$/;

export interface GeneratedApiKey {
  /** Plaintext — returned to the user exactly once, never stored. */
  token: string;
  /** SHA-256 hex digest of the token — the stored lookup value. */
  hash: string;
  /** Leading characters for display (e.g. "dbk_3f9a2c1b"). */
  prefix: string;
}

export function hashApiKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): GeneratedApiKey {
  const token = API_KEY_PREFIX + randomBytes(20).toString("hex");
  return {
    token,
    hash: hashApiKey(token),
    prefix: token.slice(0, API_KEY_DISPLAY_CHARS),
  };
}

/** Structural check before hitting the DB — rejects junk without a query. */
export function looksLikeApiKey(value: string): boolean {
  return KEY_RE.test(value);
}

/**
 * Extracts the bearer token from an `Authorization` header. Returns null for
 * a missing header, a non-Bearer scheme, or an empty credential.
 */
export function parseBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export interface ApiKeyPrincipal {
  userId: string;
  keyId: string;
  keyName: string;
}

/**
 * Resolves the caller behind a request's bearer token. Null means "no valid
 * key" (missing, malformed, or unknown) — callers turn that into a 401.
 * Bumps `lastUsedAt` fire-and-forget so auth never waits on the write.
 */
export async function authenticateApiKey(
  request: Request
): Promise<ApiKeyPrincipal | null> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token || !looksLikeApiKey(token)) return null;

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(token) },
    select: { id: true, name: true, userId: true, lastUsedAt: true },
  });
  if (!key) return null;

  // "Last used" renders at day granularity; throttle the write so an agent
  // loop doesn't turn every tool call into a row update.
  if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > LAST_USED_WRITE_INTERVAL_MS) {
    prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {
        /* best-effort telemetry — never fail auth on it */
      });
  }

  return { userId: key.userId, keyId: key.id, keyName: key.name };
}
