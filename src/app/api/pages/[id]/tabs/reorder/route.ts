import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

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

  const { tabIds } = await request.json();

  if (!Array.isArray(tabIds)) {
    return NextResponse.json(
      { error: "tabIds must be an array" },
      { status: 400 }
    );
  }

  // Verify ALL submitted tab IDs actually belong to this page
  const ownedTabs = await prisma.tab.findMany({
    where: { pageId: id },
    select: { id: true },
  });
  const ownedTabIdSet = new Set(ownedTabs.map((t) => t.id));
  const allOwned = tabIds.every((tabId: string) => ownedTabIdSet.has(tabId));
  if (!allOwned) {
    return NextResponse.json(
      { error: "One or more tab IDs do not belong to this page" },
      { status: 403 }
    );
  }

  // Update each tab's order in a transaction
  await prisma.$transaction(
    tabIds.map((tabId: string, index: number) =>
      prisma.tab.update({
        where: { id: tabId },
        data: { order: index },
      })
    )
  );

  const tabs = await prisma.tab.findMany({
    where: { pageId: id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(tabs);
});
