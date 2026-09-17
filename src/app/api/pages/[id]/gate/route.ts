import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { upsertContactFromActivity } from "@/lib/contacts";
import { withErrorHandler } from "@/lib/api-error";
import { createGateToken } from "@/lib/gate-token";
import { sendGateVerifyEmail } from "@/lib/email";
import {
  EMAIL_RE,
  emailMatchesDomains,
  formatRefCookie,
  refCookieName,
  gateCookieOptions,
} from "@/lib/page-gate";

const limiter = rateLimit({ limit: 10, window: "60s" });
// Magic links land in someone's inbox — cap per address so the gate can't be
// used to spam a third party.
const verifyLimiter = rateLimit({ limit: 3, window: "10m", prefix: "gate-verify" });

/**
 * POST /api/pages/[id]/gate
 * Email gate submission. Body: { email: string, name?: string, via?: string }
 *   via — refToken of the personal link this browser arrived through. The
 *         page passes it from the (httpOnly, /p/-scoped) referrer cookie,
 *         which this endpoint cannot read itself.
 *
 * Plain mode: creates/finds a PageContact and sets the identity cookie.
 * Verify mode (page.verifyEmail): emails a magic link instead; the contact
 * is only created — and marked verified — when that link is opened.
 */
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id: pageId } = await params;
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const name = (body.name as string)?.trim() || null;
    const viaInput = typeof body.via === "string" && body.via ? body.via : null;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        slug: true,
        title: true,
        requireEmail: true,
        verifyEmail: true,
        allowedDomains: true,
        published: true,
        teamId: true,
        userId: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const gated = page.requireEmail && page.published;

    if (gated && !emailMatchesDomains(email, page.allowedDomains)) {
      // Don't echo the allow-list: it would tell a stranger holding the link
      // which organisation this page was built for.
      return NextResponse.json(
        {
          error: "This page is restricted to specific email domains. Please use your work email.",
          code: "DOMAIN_NOT_ALLOWED",
        },
        { status: 403 }
      );
    }

    // Whose personal link this browser arrived through. Client-supplied, so
    // only keep it if it really is a contact of this page.
    const via = viaInput
      ? (
          await prisma.pageContact.findFirst({
            where: { refToken: viaInput, pageId },
            select: { refToken: true },
          })
        )?.refToken ?? null
      : null;

    // ── Verify mode: send a magic link, create nothing yet ──
    if (gated && page.verifyEmail) {
      const { success: canSend } = await verifyLimiter.limit(`${pageId}:${email}`);
      if (!canSend) {
        return NextResponse.json(
          { error: "We just sent you a link — check your inbox before requesting another." },
          { status: 429 }
        );
      }
      const token = createGateToken({ pageId, email, name, via });
      const verifyUrl = `${req.nextUrl.origin}/api/pages/${pageId}/gate/verify?token=${encodeURIComponent(token)}`;
      await sendGateVerifyEmail(email, verifyUrl, page.title);
      return NextResponse.json({ verificationSent: true });
    }

    // An email-gate signup is a capture moment — mirror it into the canonical
    // Contacts book (fire-safe, adds no failure mode to this public route).
    // Only for pages actually serving a gate: this route is unauthenticated,
    // so an arbitrary page id must not be a write path into a team's book.
    if (gated) {
      await upsertContactFromActivity(
        { teamId: page.teamId, userId: page.userId },
        { email, name }
      );
    }

    // Upsert the contact
    const contact = await prisma.pageContact.upsert({
      where: { pageId_email: { pageId, email } },
      update: { ...(name ? { name } : {}) },
      create: {
        pageId,
        email,
        name,
        refToken: nanoid(12),
        source: "GATE",
      },
    });

    // Set the identity cookie so future visits bypass the gate. The `.g`
    // suffix records that this identity was typed, not proven.
    const res = NextResponse.json({ success: true });
    res.cookies.set(
      refCookieName(pageId),
      formatRefCookie(contact.refToken, "gate"),
      gateCookieOptions()
    );
    return res;
  } catch (err) {
    console.error("[gate POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
