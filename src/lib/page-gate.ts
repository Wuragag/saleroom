import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Shared enforcement for the two buyer-facing gates on a published page:
 *   - email gate (`requireEmail`)  → validated against a real PageContact.refToken
 *   - password gate (`password`)   → validated against an HMAC(pageId:passwordHash)
 *
 * Both the server-rendered page (`/p/[slug]`) and every sibling data endpoint
 * that serves gated content (e.g. `/api/map/[slug]`) MUST route through these so
 * the gate can't be bypassed by hitting the API directly.
 */

export function refCookieName(pageId: string): string {
  return `sr_ref_${pageId}`;
}

export function passwordCookieName(pageId: string): string {
  return `page_auth_${pageId}`;
}

/** HMAC token a valid password cookie must equal. Keyed on the server secret so
 *  a DB leak of the password hash alone can't forge access. */
export function expectedPasswordToken(pageId: string, passwordHash: string): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  return crypto
    .createHmac("sha256", secret)
    .update(`${pageId}:${passwordHash}`)
    .digest("hex");
}

export function isValidPasswordToken(
  pageId: string,
  passwordHash: string,
  token: string | undefined | null
): boolean {
  if (!token) return false;
  const expected = expectedPasswordToken(pageId, passwordHash);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  // Length check guards timingSafeEqual (which throws on length mismatch).
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** A ref token is valid only if it matches a real PageContact for this page —
 *  presence of *any* cookie value is not enough. */
export async function isValidRefToken(
  pageId: string,
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const contact = await prisma.pageContact.findFirst({
    where: { pageId, refToken: token },
    select: { id: true },
  });
  return !!contact;
}

/**
 * Returns true only if the caller satisfies every gate configured on the page.
 * `getCookie` reads a cookie value by name (adapt to next/headers cookies() or a
 * Request's cookie jar at the call site).
 */
export async function isPageGateSatisfied(
  page: { id: string; requireEmail: boolean; password: string | null },
  getCookie: (name: string) => string | undefined
): Promise<boolean> {
  if (page.requireEmail) {
    const ref = getCookie(refCookieName(page.id));
    if (!(await isValidRefToken(page.id, ref))) return false;
  }
  if (page.password) {
    const token = getCookie(passwordCookieName(page.id));
    if (!isValidPasswordToken(page.id, page.password, token)) return false;
  }
  return true;
}
