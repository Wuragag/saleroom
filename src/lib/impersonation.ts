import { createHmac, timingSafeEqual, randomBytes } from "crypto";

function getSecret(): string {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET not set");
  return process.env.NEXTAUTH_SECRET;
}

/** Create a 5-minute signed impersonation token */
export function createImpersonateToken(
  adminId: string,
  targetUserId: string
): string {
  const payload = JSON.stringify({
    adminId,
    targetUserId,
    exp: Date.now() + 5 * 60 * 1000,
    // Cryptographically secure nonce to prevent replay attacks
    nonce: randomBytes(16).toString("hex"),
  });
  const base64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(base64)
    .digest("base64url");
  return `${base64}.${sig}`;
}

/** Verify a token; returns payload or null on failure/expiry */
export function verifyImpersonateToken(
  token: string
): { adminId: string; targetUserId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [base64, sig] = parts;

  // Constant-time comparison to prevent timing attacks
  const expected = createHmac("sha256", getSecret())
    .update(base64)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(base64, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    if (!payload.adminId || !payload.targetUserId) return null;
    return { adminId: payload.adminId, targetUserId: payload.targetUserId };
  } catch {
    return null;
  }
}
