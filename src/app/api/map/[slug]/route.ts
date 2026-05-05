import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";

/** GET /api/map/[slug] — fetch MAP for a published page (public, buyer-facing) */
export const GET = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: { id: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const map = await prisma.mutualActionPlan.findUnique({
    where: { pageId: page.id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!map) {
    return NextResponse.json({ map: null });
  }

  return NextResponse.json({ map });
});
