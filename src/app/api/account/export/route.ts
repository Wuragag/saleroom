import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

// A full export is a heavy query and a complete personal dataset: a few per
// hour per user is enough for any legitimate use.
const limiter = rateLimit({ limit: 5, window: "3600s", prefix: "account-export" });

/**
 * GET /api/account/export — machine-readable copy of the signed-in user's
 * data (GDPR Art. 15 access + Art. 20 portability; CCPA right to know).
 *
 * Scope: the user's own profile, memberships, the pages they created (with
 * tab content, contacts, action plans and per-page engagement summaries),
 * the deals they own and their comments. Buyer-level rows (visitors,
 * sessions, recordings) belong to the buyers and the seller's page — they
 * are summarised, not dumped, so one export can't become a bulk transfer of
 * third-party personal data. Team-wide data other members created is not
 * included.
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { success } = await limiter.limit(userId);
  if (!success) {
    return NextResponse.json({ error: "Export limit reached. Try again in an hour." }, { status: 429 });
  }

  const [user, memberships, pages, deals, comments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, lastName: true, email: true, company: true, role: true,
        avatarUrl: true, createdAt: true, updatedAt: true, onboardingCompleted: true,
      },
    }),
    prisma.teamMember.findMany({
      where: { userId },
      select: { role: true, createdAt: true, team: { select: { id: true, name: true, createdAt: true } } },
    }),
    prisma.page.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, title: true, slug: true, published: true, visibility: true, createdAt: true, updatedAt: true,
        content: true, tags: true, font: true, headingFont: true, accentColor: true, background: true,
        requireEmail: true, notifyOnView: true, recordingEnabled: true,
        tabs: { orderBy: { order: "asc" }, select: { id: true, name: true, order: true, content: true } },
        contacts: { select: { email: true, name: true, company: true, createdAt: true } },
        mutualActionPlan: {
          select: {
            title: true, closeDate: true,
            items: { orderBy: { order: "asc" }, select: { title: true, ownerType: true, ownerName: true, dueDate: true, completed: true } },
          },
        },
        submissions: { select: { formId: true, data: true, createdAt: true } },
        _count: { select: { views: true, buyerVisitors: true } },
      },
    }),
    prisma.deal.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, value: true, status: true, expectedCloseDate: true, closedAt: true, createdAt: true, updatedAt: true,
        company: { select: { name: true } },
        stage: { select: { name: true } },
        stakeholders: { select: { name: true, email: true, title: true } },
      },
    }),
    prisma.dealComment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "asc" },
      select: { dealId: true, body: true, createdAt: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const payload = {
    exportedAt: new Date().toISOString(),
    format: "dealbeam-account-export/1",
    user,
    teams: memberships.map((m) => ({ ...m.team, role: m.role, joinedAt: m.createdAt })),
    pages: pages.map(({ _count, mutualActionPlan, ...p }) => ({ ...p, actionPlan: mutualActionPlan, engagement: { views: _count.views, buyers: _count.buyerVisitors } })),
    deals,
    comments,
  };

  const filename = `dealbeam-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
