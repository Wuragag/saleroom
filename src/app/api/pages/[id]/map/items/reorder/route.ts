import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

/** PUT /api/pages/[id]/map/items/reorder — reorder MAP items (auth required) */
export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const { itemIds } = await request.json();
  if (!Array.isArray(itemIds)) {
    return NextResponse.json({ error: "itemIds array required" }, { status: 400 });
  }

  // Verify all items belong to this page's MAP
  const map = await prisma.mutualActionPlan.findUnique({ where: { pageId: id }, select: { id: true } });
  if (!map) return NextResponse.json({ error: "MAP not found" }, { status: 404 });
  const validItems = await prisma.mapItem.findMany({
    where: { mapId: map.id, id: { in: itemIds } },
    select: { id: true },
  });
  const validIds = new Set(validItems.map((i) => i.id));
  const filteredIds = itemIds.filter((id: string) => validIds.has(id));

  await prisma.$transaction(
    filteredIds.map((itemId: string, index: number) =>
      prisma.mapItem.update({
        where: { id: itemId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
});
