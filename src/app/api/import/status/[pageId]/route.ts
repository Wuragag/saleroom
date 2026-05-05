import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth<{ pageId: string }>(async (_request, { params, session }) => {
  const { pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      title: true,
      importStatus: true,
      importError: true,
      userId: true,
    },
  });

  if (!page) {
    // Page was deleted (AI write failure cleans up the page)
    return NextResponse.json({
      id: pageId,
      status: "error",
      error: "Page generation failed. Please try again.",
    });
  }

  // Only the owner can check import status
  if (page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: page.id,
    title: page.title,
    status: page.importStatus ?? "complete",
    error: page.importError,
  });
});
