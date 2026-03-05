import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";

/** PUT /api/pages/[id]/map/items/reorder — reorder MAP items (auth required) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  await prisma.$transaction(
    itemIds.map((itemId: string, index: number) =>
      prisma.mapItem.update({
        where: { id: itemId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
