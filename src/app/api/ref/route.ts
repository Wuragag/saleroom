/**
 * GET /api/ref?token=<refToken>&slug=<slug>
 *
 * Entry point for a personal share link. Validates the token, decides what
 * this browser may claim, sets cookies, and redirects back to the published
 * page without the ?ref= param.
 *
 * A personal link is a *referrer*, not proof of identity: only the first
 * browser to open it claims the contact's identity. Any later browser (a
 * forward, or the recipient on another device — we can't tell) gets a
 * referrer-only cookie and, on gated pages, meets the gate. On pages that
 * require verified email the link never grants identity at all.
 * Rules live in `src/lib/page-gate.ts` (`decideRefLinkGrant`).
 *
 * This exists because Server Components cannot set cookies — only
 * Route Handlers and Server Actions can.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";
import { evaluatePageAccess } from "@/lib/team-auth";
import {
  decideRefLinkGrant,
  formatRefCookie,
  parseRefCookie,
  refCookieName,
  legacyRefCookieName,
  viaCookieName,
  gateCookieOptions,
  CLAIM_LOCK_MIN_SECONDS,
} from "@/lib/page-gate";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get("token");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!token || !slug) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const contact = await prisma.pageContact.findUnique({
    where: { refToken: token },
    select: {
      id: true,
      pageId: true,
      page: {
        select: {
          slug: true,
          requireEmail: true,
          verifyEmail: true,
          // for the seller-preview ACL check below (no refetch)
          userId: true,
          teamId: true,
          visibility: true,
          lockedById: true,
        },
      },
    },
  });

  if (!contact || contact.page.slug !== slug) {
    // Invalid token — redirect to page without ref
    return NextResponse.redirect(new URL(`/p/${slug}`, req.url));
  }

  // Build redirect URL preserving other query params (name, company)
  const target = new URL(`/p/${slug}`, req.url);
  for (const [key, val] of req.nextUrl.searchParams.entries()) {
    if (key !== "token" && key !== "slug") {
      target.searchParams.set(key, val);
    }
  }
  const res = NextResponse.redirect(target);

  // This browser already holds an identity for the page (e.g. the recipient
  // re-opening the email on the same device) — leave it alone, but only if
  // that identity still resolves. A cookie for a contact the seller has since
  // removed must not block the new link (or keep bypassing the gate).
  const existing =
    parseRefCookie(req.cookies.get(refCookieName(contact.pageId))?.value) ??
    parseRefCookie(req.cookies.get(legacyRefCookieName(contact.pageId))?.value);
  if (existing) {
    const stillValid =
      existing.token === token ||
      !!(await prisma.pageContact.findFirst({
        where: { refToken: existing.token, pageId: contact.pageId },
        select: { id: true },
      }));
    if (stillValid) return res;
  }

  // Reps click their own share links to check them; that must never claim
  // (or burn) the buyer's identity, nor count as a buyer visit.
  const session = await auth();
  let viewerHasPageAccess = false;
  if (session?.user?.id) {
    const access = await evaluatePageAccess(session.user.id, contact.page, "view");
    viewerHasPageAccess = access.authorized;
  }

  // Claimed = some browser is already attributed to this contact AND has
  // shown human engagement (a session with visible time). Requiring
  // engagement means a JS-executing mail scanner or two near-simultaneous
  // opens can't lock the recipient out of their own identity; until the
  // claim locks, a later browser simply claims too (the old behaviour).
  const alreadyClaimed = viewerHasPageAccess
    ? false
    : !!(await prisma.buyerVisitor.findFirst({
        where: {
          contactId: contact.id,
          sessions: { some: { duration: { gte: CLAIM_LOCK_MIN_SECONDS } } },
        },
        select: { id: true },
      }));

  const grant = decideRefLinkGrant({
    viewerHasPageAccess,
    requireEmail: contact.page.requireEmail,
    verifyEmail: contact.page.verifyEmail,
    alreadyClaimed,
  });

  if (grant === "identity") {
    res.cookies.set(refCookieName(contact.pageId), formatRefCookie(token, "link"), gateCookieOptions());
  }
  if (grant !== "none") {
    res.cookies.set(viaCookieName(contact.pageId), token, gateCookieOptions());
  }

  return res;
});
