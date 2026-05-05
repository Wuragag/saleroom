import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/admin-auth";

export const POST = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, importStatus: true, importText: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!page.importStatus) {
    return NextResponse.json(
      { error: "This page was not created via import" },
      { status: 400 }
    );
  }

  // Reset to processing so the user can re-trigger
  await prisma.page.update({
    where: { id },
    data: {
      importStatus: "processing",
      importError: null,
    },
  });

  return NextResponse.json({ success: true });
});
