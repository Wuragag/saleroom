import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

/** POST /api/pages/[id]/map/items — add item to the MAP (auth required) */
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const map = await prisma.mutualActionPlan.findUnique({
    where: { pageId: id },
    select: { id: true },
  });
  if (!map) {
    return NextResponse.json({ error: "MAP not found. Create one first." }, { status: 404 });
  }

  const body = await request.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Item title is required" }, { status: 400 });
  }

  // Get the next order value
  const maxOrder = await prisma.mapItem.aggregate({
    where: { mapId: map.id },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const item = await prisma.mapItem.create({
    data: {
      mapId: map.id,
      title: body.title.trim(),
      ownerType: body.ownerType ?? "seller",
      ownerName: body.ownerName ?? "",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completed: false,
      order: nextOrder,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
});
