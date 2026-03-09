import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { sendSharePageEmail } from "@/lib/email";
import { getIntentLabel } from "@/lib/engagement-score";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * GET /api/pages/[id]/contacts
 * List contacts for a page with engagement summary.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      s.tabViews.some((tv) => tv.tabName.toLowerCase().includes("pric"))
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
}

/**
 * POST /api/pages/[id]/contacts
 * Create one or more contacts and optionally send share emails.
 * Body: { contacts: Array<{ email, name?, company? }>, sendEmail?: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (contactInputs.length > 50) {
    return NextResponse.json({ error: "Maximum 50 contacts per request" }, { status: 400 });
  }

  const page = await prisma.page.findUnique({
    where: { id },
    select: { title: true, slug: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const senderName = access.session?.user?.name ?? "Someone";
  const created: Array<{ id: string; email: string; name: string | null; refToken: string; link: string }> = [];

  for (const input of contactInputs) {
    const email = input.email?.trim().toLowerCase();
    if (!email) continue;

    const contact = await prisma.pageContact.upsert({
      where: { pageId_email: { pageId: id, email } },
      update: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.company ? { company: input.company.trim() } : {}),
      },
      create: {
        pageId: id,
        email,
        name: input.name?.trim() ?? null,
        company: input.company?.trim() ?? null,
        refToken: nanoid(12),
      },
    });

    const link = `${APP_URL}/p/${page.slug}?ref=${contact.refToken}`;
    created.push({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      refToken: contact.refToken,
      link,
    });

    if (sendEmail) {
      try {
        await sendSharePageEmail(email, link, page.title, senderName, contact.name ?? undefined);
      } catch (err) {
        console.error(`[contacts] Failed to send email to ${email}:`, err);
      }
    }
  }

  return NextResponse.json({ contacts: created });
}
