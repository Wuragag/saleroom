import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("pageId");

  // Get all pages for the current user to scope submissions
  const userPages = await prisma.page.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const pageIds = userPages.map((p) => p.id);

  const whereClause: Record<string, unknown> = {
    pageId: { in: pageIds },
  };
  if (pageId) {
    // Only filter by specific pageId if it belongs to the current user
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
}
