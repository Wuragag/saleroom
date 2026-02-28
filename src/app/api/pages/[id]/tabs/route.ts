import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DEFAULT_TAB_NAME } from "@/lib/constants";

export async function POST(
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

  const body = await request.json().catch(() => ({}));
  const name = body.name || DEFAULT_TAB_NAME;

  // Find the highest order value
  const lastTab = await prisma.tab.findFirst({
    where: { pageId: id },
    orderBy: { order: "desc" },
  });

  const nextOrder = (lastTab?.order ?? -1) + 1;

  const tab = await prisma.tab.create({
    data: {
      name,
      order: nextOrder,
      content: '{"type":"doc","content":[{"type":"paragraph"}]}',
      pageId: id,
    },
  });

  return NextResponse.json(tab, { status: 201 });
}
