import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tabId: string }> }
) {
  const { tabId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingTab = await prisma.tab.findUnique({
    where: { id: tabId },
    include: { page: true },
  });
  if (!existingTab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }
  if (existingTab.page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tabId: string }> }
) {
  const { tabId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the tab to get its pageId
  const tab = await prisma.tab.findUnique({
    where: { id: tabId },
    include: { page: true },
  });

  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 });
  }

  if (tab.page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent deleting the last tab
  const tabCount = await prisma.tab.count({
    where: { pageId: tab.pageId },
  });

  if (tabCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last tab" },
      { status: 400 }
    );
  }

  await prisma.tab.delete({
    where: { id: tabId },
  });

  return new NextResponse(null, { status: 204 });
}
