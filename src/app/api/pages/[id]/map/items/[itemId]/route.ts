import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";

/** PUT /api/pages/[id]/map/items/[itemId] — update a MAP item (auth required) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.ownerType !== undefined) updateData.ownerType = body.ownerType;
  if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.completed !== undefined) updateData.completed = body.completed;
  if (body.order !== undefined) updateData.order = body.order;

  const item = await prisma.mapItem.update({
    where: { id: itemId },
    data: updateData,
  });

  return NextResponse.json({ item });
}

/** DELETE /api/pages/[id]/map/items/[itemId] — delete a MAP item (auth required) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  await prisma.mapItem.delete({ where: { id: itemId } });
  return new NextResponse(null, { status: 204 });
}
