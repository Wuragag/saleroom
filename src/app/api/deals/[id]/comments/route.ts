import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { cleanString } from "@/lib/validation";

const COMMENT_MAX = 2000;

/** POST /api/deals/[id]/comments — add a comment (any member who can see the deal). */
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "view");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = (await safeJson<{ body?: unknown }>(request)) ?? {};
  const text = cleanString(body.body, COMMENT_MAX);
  if (!text) {
    return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });
  }

  const comment = await prisma.dealComment.create({
    data: { dealId: id, authorId: access.session.user.id, body: text },
    include: {
      author: { select: { id: true, name: true, lastName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    },
    { status: 201 }
  );
});
