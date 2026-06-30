import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { assertCanCreateTabsTx, withResourceLock } from "@/lib/plan-limits";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import { withErrorHandler, safeJson } from "@/lib/api-error";

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

  const body = await safeJson<{ name?: string }>(request) ?? {};
  const name = body.name || DEFAULT_TAB_NAME;

  // Atomic: take an advisory lock on the page, enforce the tab cap, and assign
  // the next order inside one transaction so concurrent requests can neither
  // exceed the plan limit nor collide on `order`.
  const tab = await withResourceLock(`page:${id}:tabs`, async (tx) => {
    await assertCanCreateTabsTx(tx, id, access.page?.teamId ?? null, 1);

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
});
