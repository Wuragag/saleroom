import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";
import { checkPageAccess } from "@/lib/team-auth";

export const POST = withErrorHandler(async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "edit");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const page = await prisma.page.findUnique({
    where: { id },
    select: { published: true },
  });

  if (!page?.published) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  await prisma.pageEvent.create({
    data: {
      pageId: id,
      type: "share",
      meta: JSON.stringify({ source: "copy_link" }),
    },
  });

  return NextResponse.json({ ok: true });
});
