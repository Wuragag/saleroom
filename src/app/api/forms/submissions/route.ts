import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserTeamId } from "@/lib/team-auth";
import { withAuth } from "@/lib/api-auth";
import { parsePagination } from "@/lib/pagination-utils";

export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("pageId");
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 50 });

  const teamId = await getUserTeamId(session.user.id);

  // Get team pages (TEAM visibility) + user's own private pages
  const accessiblePages = await prisma.page.findMany({
    where: teamId
      ? {
          OR: [
            { teamId, visibility: "TEAM" },
            { userId: session.user.id, visibility: "PRIVATE" },
          ],
        }
      : { userId: session.user.id },
    select: { id: true },
  });
  const pageIds = accessiblePages.map((p) => p.id);

  const whereClause: Record<string, unknown> = {
    pageId: { in: pageIds },
  };
  if (pageId) {
    // Only filter by specific pageId if it belongs to accessible pages
    if (!pageIds.includes(pageId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    whereClause.pageId = pageId;
  }

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where: whereClause,
      include: { page: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.formSubmission.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    submissions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
