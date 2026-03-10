import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPageAccess } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

// POST /api/pages/[id]/lock — toggle lock on a page
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Must have at least view access
  const access = await checkPageAccess(id, "view");
  if (!access.authorized) {
    const status = access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body = await request.json();
  const { locked } = body as { locked: boolean };

  const page = access.page;

  if (locked) {
    // Lock: only if not already locked by someone else
    if (page.lockedById && page.lockedById !== session.user.id) {
      return NextResponse.json(
        { error: "Page is already locked by another user" },
        { status: 409 }
      );
    }
    const updated = await prisma.page.update({
      where: { id },
      data: { lockedById: session.user.id },
    });
    const { password: _pw, ...safePage } = updated;
    return NextResponse.json({ ...safePage, hasPassword: !!_pw });
  } else {
    // Unlock: only the locking user or team owner can unlock
    if (page.lockedById && page.lockedById !== session.user.id) {
      // Check if current user is team owner
      if (page.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId: session.user.id,
              teamId: page.teamId,
            },
          },
        });
        if (!membership || membership.role !== "OWNER") {
          return NextResponse.json(
            { error: "Only the locking user or team owner can unlock" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Only the locking user can unlock" },
          { status: 403 }
        );
      }
    }
    const updated = await prisma.page.update({
      where: { id },
      data: { lockedById: null },
    });
    const { password: _pw, ...safePage } = updated;
    return NextResponse.json({ ...safePage, hasPassword: !!_pw });
  }
});
