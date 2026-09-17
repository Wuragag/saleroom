/**
 * GET /api/pages/[id]/gate/verify?token=<gate token>
 *
 * Target of the email-gate magic link. Proves the buyer controls the address
 * they typed: creates (or finds) the PageContact, stamps `verifiedAt`, sets
 * the identity cookie with the `.v` marker, and redirects to the page.
 *
 * May be opened in a different browser than the one that asked (mail app
 * → Safari), which is why the referrer (`via`) travels inside the token and
 * is re-issued as a cookie here.
 */
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, isPrismaKnownError } from "@/lib/api-error";
import { upsertContactFromActivity } from "@/lib/contacts";
import { verifyGateToken } from "@/lib/gate-token";
import {
  emailMatchesDomains,
  formatRefCookie,
  refCookieName,
  viaCookieName,
  gateCookieOptions,
} from "@/lib/page-gate";

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      slug: true,
      published: true,
      requireEmail: true,
      allowedDomains: true,
      teamId: true,
      userId: true,
    },
  });
  if (!page || !page.published) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const pageUrl = new URL(`/p/${page.slug}`, req.url);
  const fail = (reason: "expired" | "restricted") => {
    pageUrl.searchParams.set("gate", reason);
    return NextResponse.redirect(pageUrl);
  };

  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? verifyGateToken(token) : null;
  if (!payload || payload.pageId !== pageId || !payload.nonce) {
    return fail("expired");
  }

  // Single-use: record the nonce; a second redemption hits the primary key.
  // Prune tokens that have expired on their own while we're here.
  try {
    await prisma.$transaction([
      prisma.gateTokenUse.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.gateTokenUse.create({
        data: { nonce: payload.nonce, expiresAt: new Date(payload.exp) },
      }),
    ]);
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2002") {
      return fail("expired");
    }
    throw err;
  }

  // Settings may have changed between request and click — re-check.
  if (page.requireEmail && !emailMatchesDomains(payload.email, page.allowedDomains)) {
    return fail("restricted");
  }

  const now = new Date();
  await upsertContactFromActivity(
    { teamId: page.teamId, userId: page.userId },
    { email: payload.email, name: payload.name }
  );
  const contact = await prisma.pageContact.upsert({
    where: { pageId_email: { pageId, email: payload.email } },
    update: {
      verifiedAt: now,
      ...(payload.name ? { name: payload.name } : {}),
    },
    create: {
      pageId,
      email: payload.email,
      name: payload.name,
      refToken: nanoid(12),
      source: "GATE",
      verifiedAt: now,
    },
  });

  const res = NextResponse.redirect(pageUrl);
  res.cookies.set(
    refCookieName(pageId),
    formatRefCookie(contact.refToken, "verified"),
    gateCookieOptions()
  );
  if (payload.via) {
    res.cookies.set(viaCookieName(pageId), payload.via, gateCookieOptions());
  }
  return res;
});
