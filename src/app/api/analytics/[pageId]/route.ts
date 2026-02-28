import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  if (page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [viewStats, eventStats] = await Promise.all([
    prisma.pageView.aggregate({
      where: { pageId },
      _count: { id: true },
      _avg: { duration: true },
    }),
    prisma.pageEvent.groupBy({
      by: ["type"],
      where: { pageId },
      _count: { id: true },
    }),
  ]);

  const linkClicks =
    eventStats.find((e) => e.type === "link_click")?._count.id ?? 0;
  const shares =
    eventStats.find((e) => e.type === "share")?._count.id ?? 0;

  return NextResponse.json({
    views: viewStats._count.id,
    avgDuration: Math.round(viewStats._avg.duration ?? 0),
    linkClicks,
    shares,
  });
}
