import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { withErrorHandler } from "@/lib/api-error";

/**
 * DELETE /api/deals/[id]/comments/[commentId] — the author can always delete
 * their own comment; otherwise deal-delete privilege (deal owner / team OWNER)
 * moderates.
 */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) => {
  const { id, commentId } = await params;
  const access = await checkDealAccess(id, "view");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const comment = await prisma.dealComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.dealId !== id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.authorId !== access.session.user.id) {
    const moderator = await checkDealAccess(id, "delete");
    if (!moderator.authorized) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }
  }

  await prisma.dealComment.delete({ where: { id: commentId } });
  return new NextResponse(null, { status: 204 });
});
