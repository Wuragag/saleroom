import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { DEFAULT_TAB_NAME } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
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
