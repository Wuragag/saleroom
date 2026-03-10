import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamOwner } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

// DELETE /api/team/members/[id] — remove a member (owner only)
export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: memberId } = await params;
  const { authorized, session, teamId, reason } = await requireTeamOwner();

  if (!authorized) {
    const status = !session ? 401 : 403;
    return NextResponse.json({ error: reason }, { status });
  }

  // Find the member
  const member = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.teamId !== teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove yourself (the owner)
  if (member.userId === session!.user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself from the team" },
      { status: 400 }
    );
  }

  await prisma.teamMember.delete({
    where: { id: memberId },
  });

  return new NextResponse(null, { status: 204 });
});
