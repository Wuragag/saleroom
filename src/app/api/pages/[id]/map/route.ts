import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

/** GET /api/pages/[id]/map — fetch the MAP for a page (auth required) */
export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "view");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const map = await prisma.mutualActionPlan.findUnique({
    where: { pageId: id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ map });
});

/** POST /api/pages/[id]/map — create or update the MAP (auth required) */
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

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.closeDate !== undefined) updateData.closeDate = body.closeDate ? new Date(body.closeDate) : null;

  const map = await prisma.mutualActionPlan.upsert({
    where: { pageId: id },
    create: {
      pageId: id,
      title: body.title ?? "Mutual Action Plan",
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
    },
    update: updateData,
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ map });
});

/** DELETE /api/pages/[id]/map — remove the MAP entirely (auth required) */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  await prisma.mutualActionPlan.deleteMany({ where: { pageId: id } });

  return new NextResponse(null, { status: 204 });
});
