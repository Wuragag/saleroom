import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await prisma.page.findUnique({
    where: { id },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  if (page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
}
