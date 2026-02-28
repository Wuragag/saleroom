import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkPageAccess } from "@/lib/team-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const access = await checkPageAccess(pageId, "view");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
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
