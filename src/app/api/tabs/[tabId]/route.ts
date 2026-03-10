import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ tabId: string }> }
) => {
  const { tabId } = await params;

  const existingTab = await prisma.tab.findUnique({
    where: { id: tabId },
    include: { page: true },
  });
  if (!existingTab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  // Use team-based auth via the parent page
  const access = await checkPageAccess(existingTab.page.id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.content !== undefined) updateData.content = body.content;

  const tab = await prisma.tab.update({
    where: { id: tabId },
    data: updateData,
  });

  return NextResponse.json(tab);
});

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ tabId: string }> }
) => {
  const { tabId } = await params;

  // Find the tab to get its pageId
  const tab = await prisma.tab.findUnique({
    where: { id: tabId },
    include: { page: true },
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  // Use team-based auth via the parent page
  const access = await checkPageAccess(tab.page.id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  // Atomic count-check + delete inside a transaction to prevent
  // concurrent requests from deleting the last tab (TOCTOU race).
  try {
    await prisma.$transaction(async (tx) => {
      const tabCount = await tx.tab.count({
        where: { pageId: tab.pageId },
      });

      if (tabCount <= 1) {
        throw new Error("LAST_TAB");
      }

      await tx.tab.delete({
        where: { id: tabId },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "LAST_TAB") {
      return NextResponse.json(
        { error: "Cannot delete the last tab" },
        { status: 400 }
      );
    }
    throw err; // re-throw unexpected errors
  }

  return new NextResponse(null, { status: 204 });
});
