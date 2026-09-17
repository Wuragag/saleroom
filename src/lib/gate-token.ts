/**
 * Signed, short-lived tokens for the email-gate magic link.
 *
 * The gate POST emails `/api/pages/[id]/gate/verify?token=…` to the address
 * the buyer typed; only someone who can read that inbox can complete it.
 * Same HMAC scheme as `impersonation.ts` — no DB row, so a leaked database
 * alone can't forge one, and expiry is enforced on verify.
 */
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

export const GATE_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface GateTokenPayload {
  pageId: string;
  email: string;
  name: string | null;
  /** refToken of the personal link this browser arrived through, if any. */
  via: string | null;
  exp: number;
  nonce: string;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  return secret;
}

function sign(base64: string): string {
  return createHmac("sha256", getSecret()).update(base64).digest("base64url");
}

export function createGateToken(input: {
  pageId: string;
  email: string;
  name?: string | null;
  via?: string | null;
}): string {
  const payload: GateTokenPayload = {
    pageId: input.pageId,
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    via: input.via || null,
    exp: Date.now() + GATE_TOKEN_TTL_MS,
    nonce: randomBytes(12).toString("hex"),
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${base64}.${sign(base64)}`;
}

/** Verify a token; returns the payload, or null when tampered/expired/malformed. */
export function verifyGateToken(token: string): GateTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [base64, sig] = parts;

  const expected = sign(base64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const p = JSON.parse(Buffer.from(base64, "base64url").toString()) as Partial<GateTokenPayload>;
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    if (typeof p.pageId !== "string" || !p.pageId) return null;
    if (typeof p.email !== "string" || !p.email) return null;
    return {
      pageId: p.pageId,
      email: p.email,
      name: typeof p.name === "string" && p.name ? p.name : null,
      via: typeof p.via === "string" && p.via ? p.via : null,
      exp: p.exp,
      nonce: typeof p.nonce === "string" ? p.nonce : "",
    };
  } catch {
    return null;
  }
}

// ── Identity assertion ──────────────────────────────────────────────────────
//
// The identity cookie is httpOnly and scoped to /p/, so the buyer-analytics
// session endpoint never sees it — the published page (a Server Component)
// reads it and hands the token to the client tracker. To stop a client from
// posting any token it happens to know (a forwarded link) as its identity,
// the page also emits a server-signed assertion over (page, token, source)
// that the session endpoint verifies. Only a browser that legitimately held
// the cookie ever receives a valid assertion.

export type IdentityAssertionSource = "link" | "gate" | "verified";

export function signIdentityAssertion(
  pageId: string,
  token: string,
  source: IdentityAssertionSource
): string {
  return createHmac("sha256", getSecret())
    .update(`identity|${pageId}|${token}|${source}`)
    .digest("base64url");
}

export function verifyIdentityAssertion(
  pageId: string,
  token: string,
  source: IdentityAssertionSource,
  proof: string | undefined | null
): boolean {
  if (!proof) return false;
  const expected = signIdentityAssertion(pageId, token, source);
  const a = Buffer.from(proof);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
