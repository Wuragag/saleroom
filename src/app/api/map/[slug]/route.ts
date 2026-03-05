import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/map/[slug] — fetch MAP for a published page (public, buyer-facing) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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
}
