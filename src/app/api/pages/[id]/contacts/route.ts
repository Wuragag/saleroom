import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { getIntentLabel, isPricingTabName } from "@/lib/engagement-score";
import { sharePageWithContacts, MAX_SHARE_CONTACTS } from "@/lib/page-share";
import { withErrorHandler } from "@/lib/api-error";

/**
 * GET /api/pages/[id]/contacts
 * List contacts for a page with engagement summary.
 */
export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "view");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const contacts = await prisma.pageContact.findMany({
    where: { pageId: id },
    include: {
      visitors: {
        select: {
          engagementScore: true,
          totalSessions: true,
          lastSeenAt: true,
          ctaClicked: true,
          sessions: {
            select: {
              tabViews: { select: { tabName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = contacts.map((c) => {
    const v = c.visitors[0]; // a contact maps to at most one visitor per page
    const pricingTabViewed = v?.sessions.some((s) =>
      s.tabViews.some((tv) => isPricingTabName(tv.tabName))
    ) ?? false;

    return {
      id: c.id,
      email: c.email,
      name: c.name,
      company: c.company,
      refToken: c.refToken,
      createdAt: c.createdAt.toISOString(),
      engagementScore: v?.engagementScore ?? 0,
      totalSessions: v?.totalSessions ?? 0,
      lastSeenAt: v?.lastSeenAt?.toISOString() ?? null,
      intent: v
        ? getIntentLabel(v.engagementScore, v.ctaClicked, pricingTabViewed)
        : null,
    };
  });

  return NextResponse.json({ contacts: rows });
});

/**
 * POST /api/pages/[id]/contacts
 * Create one or more contacts and optionally send share emails.
 * Body: { contacts: Array<{ email, name?, company? }>, sendEmail?: boolean }
 */
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = await req.json();
  const { contacts: contactInputs, sendEmail } = body as {
    contacts: Array<{ email: string; name?: string; company?: string }>;
    sendEmail?: boolean;
  };

  if (!Array.isArray(contactInputs) || contactInputs.length === 0) {
    return NextResponse.json({ error: "contacts array is required" }, { status: 400 });
  }

  if (contactInputs.length > MAX_SHARE_CONTACTS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SHARE_CONTACTS} contacts per request` },
      { status: 400 }
    );
  }

  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, teamId: true, userId: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Derive origin from the actual incoming request rather than a possibly
  // unset/misconfigured NEXTAUTH_URL — that fallback previously meant share
  // links sent to real prospects could contain http://localhost:3000.
  const created = await sharePageWithContacts({
    page,
    contacts: contactInputs,
    sendEmail: !!sendEmail,
    senderName: access.session?.user?.name ?? "Someone",
    appUrl: req.nextUrl.origin,
  });

  return NextResponse.json({ contacts: created });
});
