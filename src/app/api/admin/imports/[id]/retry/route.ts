import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-error";
import { processImportedPage } from "@/lib/import-processor";

export const maxDuration = 60;

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, userId: true, importStatus: true, importText: true },
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

  if (!page.importText) {
    return NextResponse.json(
      { error: "This import no longer has extracted text. Please re-upload the document." },
      { status: 400 }
    );
  }

  // Reset to processing and schedule server-side conversion immediately.
  await prisma.page.update({
    where: { id },
    data: {
      importStatus: "processing",
      importError: null,
    },
  });

  after(async () => {
    try {
      await processImportedPage(page.id, page.userId);
    } catch (err) {
      console.error("[admin import retry background processing]", err);
    }
  });

  return NextResponse.json({ success: true });
});
