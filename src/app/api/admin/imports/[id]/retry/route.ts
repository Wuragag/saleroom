import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
}
