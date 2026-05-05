import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const limiter = rateLimit({ limit: 30, window: "60s" });

/** POST /api/map/[slug]/toggle — buyer toggles a MAP item (public, rate-limited) */
export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const ip = getClientIp(req);
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { slug } = await params;
  const body = await req.json();
  const { itemId, completed } = body;

  if (!itemId || typeof completed !== "boolean") {
    return NextResponse.json({ error: "itemId and completed (boolean) are required" }, { status: 400 });
  }

  // Verify the page is published and the item belongs to it
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: { id: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const map = await prisma.mutualActionPlan.findUnique({
    where: { pageId: page.id },
    select: { id: true },
  });
  if (!map) {
    return NextResponse.json({ error: "MAP not found" }, { status: 404 });
  }

  // Only allow toggling buyer-owned items that belong to this MAP
  const item = await prisma.mapItem.findFirst({
    where: { id: itemId, mapId: map.id },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.ownerType !== "buyer") {
    return NextResponse.json({ error: "Only buyer items can be toggled" }, { status: 403 });
  }

  const updated = await prisma.mapItem.update({
    where: { id: itemId },
    data: { completed },
  });

  return NextResponse.json({ item: updated });
});
