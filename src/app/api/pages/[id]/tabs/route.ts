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

  // Atomic: find max order + create inside a transaction to prevent
  // concurrent requests from assigning the same order value.
  const tab = await prisma.$transaction(async (tx) => {
    const lastTab = await tx.tab.findFirst({
      where: { pageId: id },
      orderBy: { order: "desc" },
    });

    const nextOrder = (lastTab?.order ?? -1) + 1;

    return tx.tab.create({
      data: {
        name,
        order: nextOrder,
        content: '{"type":"doc","content":[{"type":"paragraph"}]}',
        pageId: id,
      },
    });
  });

  return NextResponse.json(tab, { status: 201 });
}
