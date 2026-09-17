/**
 * Pure rules for buyer identity on published pages.
 *
 * The model: a personal `?ref=` link is a *referrer* ("whose link brought
 * this browser here"); the visitor's *identity* ("who this browser is") is a
 * separate claim. The two coincide for the intended recipient opening their
 * own link, and diverge when a link is forwarded — which is exactly the
 * signal sellers want.
 *
 * Two cookies carry this to the page (both httpOnly, scoped to `/p/`):
 *   db_ref_<pageId>  — identity: `<refToken>` (personal-link claim),
 *                      `<refToken>.g` (typed at the gate) or
 *                      `<refToken>.v` (magic-link verified)
 *   db_via_<pageId>  — referrer only: `<refToken>` of the link that was opened
 *
 * Everything here is side-effect free and unit-tested in
 * `src/lib/__tests__/page-gate.test.ts`.
 */

import type { IdentitySource } from "@/generated/prisma";

/** How the identity cookie was issued. Encoded as a suffix on the cookie value. */
export type RefCookieSource = "link" | "gate" | "verified";

export const REF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
export const MAX_ALLOWED_DOMAINS = 20;

/**
 * A personal-link claim only "locks" once the claiming browser has shown
 * human engagement — a session with at least this much visible time. Until
 * then a later browser on the same link may also claim (the pre-existing
 * behaviour), so a JS-executing mail scanner or link-preview sandbox that
 * opens the link first can't turn the real recipient into an anonymous
 * "via their own link" visitor.
 */
export const CLAIM_LOCK_MIN_SECONDS = 10;

/** Cookie attributes shared by every route that issues identity/referrer cookies. */
export function gateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/p/",
    sameSite: "lax" as const,
    maxAge: REF_COOKIE_MAX_AGE,
  };
}

export function refCookieName(pageId: string): string {
  return `db_ref_${pageId}`;
}

/** Pre-rebrand cookie name — still honoured so in-flight links keep working. */
export function legacyRefCookieName(pageId: string): string {
  return `sr_ref_${pageId}`;
}

export function viaCookieName(pageId: string): string {
  return `db_via_${pageId}`;
}

const SOURCE_SUFFIX: Record<RefCookieSource, string> = {
  link: "",
  gate: ".g",
  verified: ".v",
};

export function formatRefCookie(token: string, source: RefCookieSource): string {
  return `${token}${SOURCE_SUFFIX[source]}`;
}

/**
 * Parse an identity cookie value. A bare token (legacy and personal-link
 * claims) means "link". Ref tokens are nanoid — never contain a dot — so the
 * suffix is unambiguous. Returns null for anything malformed.
 */
export function parseRefCookie(
  value: string | null | undefined
): { token: string; source: RefCookieSource } | null {
  if (!value) return null;
  const [token, suffix, ...rest] = value.split(".");
  if (!token || rest.length > 0) return null;
  if (suffix === undefined) return { token, source: "link" };
  if (suffix === "g") return { token, source: "gate" };
  if (suffix === "v") return { token, source: "verified" };
  return null;
}

/**
 * Map a cookie source to the persisted IdentitySource. "verified" is only
 * honoured when the contact really carries `verifiedAt` — the cookie value
 * reaches the session endpoint via the client, so it can't be the sole proof.
 */
export function resolveIdentitySource(
  source: RefCookieSource,
  contactVerified: boolean
): IdentitySource {
  if (source === "verified") return contactVerified ? "VERIFIED" : "GATE";
  if (source === "gate") return "GATE";
  return "LINK";
}

/**
 * What `/api/ref` should hand the browser when a personal link is opened.
 *
 *   identity — first browser to open this link: claim the contact's identity
 *   referrer — record only that this link was opened (gate decides identity)
 *   none     — a teammate previewing their own share link: track nothing
 */
export type RefLinkGrant = "identity" | "referrer" | "none";

export function decideRefLinkGrant(input: {
  /** The viewer is signed in and has access to the page (seller side). */
  viewerHasPageAccess: boolean;
  /** Page requires verified email — links never grant identity by themselves. */
  verifyEmail: boolean;
  requireEmail: boolean;
  /** Some browser already holds this contact's identity. */
  alreadyClaimed: boolean;
}): RefLinkGrant {
  if (input.viewerHasPageAccess) return "none";
  if (input.requireEmail && input.verifyEmail) return "referrer";
  if (input.alreadyClaimed) return "referrer";
  return "identity";
}

/**
 * Normalise a seller-entered domain list: lower-case, strip a leading `@` or
 * scheme, drop blanks/invalid entries and duplicates, cap the count.
 * Accepts a comma/whitespace-separated string or an array.
 */
export function normalizeDomains(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  const parts = Array.isArray(input) ? input : input.split(/[\s,;]+/);
  const out: string[] = [];
  for (const raw of parts) {
    if (typeof raw !== "string") continue;
    let d = raw.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/^@/, "").replace(/\/.*$/, "");
    if (!isValidDomain(d)) continue;
    if (!out.includes(d)) out.push(d);
    if (out.length >= MAX_ALLOWED_DOMAINS) break;
  }
  return out;
}

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function isValidDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain);
}

/**
 * Does an email belong to one of the allowed domains? An empty allow-list
 * allows everyone. Sub-domains of an allowed domain are allowed too
 * (`eu.acme.com` matches `acme.com`) — Dock-style "entire organisation".
 */
export function emailMatchesDomains(email: string, domains: readonly string[]): boolean {
  if (domains.length === 0) return true;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const host = email.slice(at + 1).toLowerCase();
  if (!host) return false;
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * A visitor "arrived through a forward" when we know whose link they opened
 * but they are not (or not yet known to be) that person.
 */
export function isForwardedVisitor(v: {
  contactId: string | null;
  referredByContactId: string | null;
}): boolean {
  return !!v.referredByContactId && v.contactId !== v.referredByContactId;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
