import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

/**
 * DELETE /api/deals/[id]/rooms/[pageId] — unlink a room from the deal.
 * Symmetric with linking: mutating Page.dealId requires edit on the page too
 * (a member can't strip a PRIVATE or edit-locked room off a deal).
 */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) => {
  const { id, pageId } = await params;
  const access = await checkDealAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const pageAccess = await checkPageAccess(pageId, "edit");
  if (!pageAccess.authorized) {
    const status = pageAccess.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: pageAccess.reason }, { status });
  }

  const unlinked = await prisma.page.updateMany({
    where: { id: pageId, dealId: id },
    data: { dealId: null },
  });
  if (unlinked.count === 0) {
    return NextResponse.json(
      { error: "Room is not linked to this deal" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
});
