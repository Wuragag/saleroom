import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";

/**
 * DELETE /api/pages/[id]/contacts/[contactId]
 * Remove a contact (does not delete the visitor data, just unlinks).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  // Unlink visitors first, then delete the contact
  await prisma.$transaction([
    prisma.buyerVisitor.updateMany({
      where: { contactId },
      data: { contactId: null },
    }),
    prisma.pageContact.delete({
      where: { id: contactId, pageId: id },
    }),
  ]);

  return NextResponse.json({ success: true });
}
