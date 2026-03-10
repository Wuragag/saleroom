import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamOwner } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

// DELETE /api/team/invite/[id] — cancel an invite (owner only)
export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: inviteId } = await params;
  const { authorized, session, teamId, reason } = await requireTeamOwner();

  if (!authorized) {
    const status = !session ? 401 : 403;
    return NextResponse.json({ error: reason }, { status });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.teamId !== teamId) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await prisma.teamInvite.delete({
    where: { id: inviteId },
  });

  return new NextResponse(null, { status: 204 });
});
