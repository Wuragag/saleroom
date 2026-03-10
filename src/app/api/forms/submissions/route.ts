import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("pageId");

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

  const submissions = await prisma.formSubmission.findMany({
    where: whereClause,
    include: { page: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
});
