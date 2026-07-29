import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";

/**
 * POST /api/deals/[id]/rooms — link an existing room to the deal.
 * Requires edit on both the deal and the page. Linking a PRIVATE room is an
 * explicit act of sharing its summary stats (title, views, warmth) with the
 * team via the deal; full analytics stay gated by page access.
 */
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = (await safeJson<{ pageId?: unknown }>(request)) ?? {};
  if (!body.pageId || typeof body.pageId !== "string") {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  const pageAccess = await checkPageAccess(body.pageId, "edit");
  if (!pageAccess.authorized) {
    const status = pageAccess.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: pageAccess.reason }, { status });
  }

  // dealId guard makes the link atomic; already-linked-here is idempotent.
  const linked = await prisma.page.updateMany({
    where: { id: body.pageId, OR: [{ dealId: null }, { dealId: id }] },
    data: { dealId: id },
  });
  if (linked.count === 0) {
    return NextResponse.json(
      { error: "This room is already linked to another deal" },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
});
