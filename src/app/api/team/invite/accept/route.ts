import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canAddTeamMember } from "@/lib/plan-limits";

// POST /api/team/invite/accept — accept an invite (authenticated user)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { token } = body as { token?: string };

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json(
      { error: "This invite has already been used or expired" },
      { status: 400 }
    );
  }

  if (new Date() > invite.expiresAt) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  // ── Plan limit check ──
  const limitCheck = await canAddTeamMember(invite.teamId);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.reason, code: "PLAN_LIMIT", current: limitCheck.current, limit: limitCheck.limit },
      { status: 403 }
    );
  }

  // Check if already a member
  const existingMembership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: session.user.id,
        teamId: invite.teamId,
      },
    },
  });

  if (existingMembership) {
    // Mark invite as accepted anyway
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ message: "You are already a member of this team" });
  }

  // Leave existing team (if any) before joining the new one.
  // The system assumes one team per user. Signup auto-creates a personal
  // team, so we clean that up here to avoid broken multi-team state.
  await prisma.$transaction(async (tx) => {
    const oldMembership = await tx.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (oldMembership && oldMembership.teamId !== invite.teamId) {
      // Remove from old team
      await tx.teamMember.delete({ where: { id: oldMembership.id } });

      // If the old team is now empty, delete it
      const remaining = await tx.teamMember.count({
        where: { teamId: oldMembership.teamId },
      });
      if (remaining === 0) {
        // Reassign any pages from the old team to the new team
        await tx.page.updateMany({
          where: { teamId: oldMembership.teamId },
          data: { teamId: invite.teamId },
        });
        await tx.team.delete({ where: { id: oldMembership.teamId } });
      }
    }

    // Add to new team
    await tx.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: invite.teamId,
        role: "MEMBER",
      },
    });

    // Mark invite accepted
    await tx.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });
  });

  return NextResponse.json({
    message: "Welcome to the team!",
    teamName: invite.team.name,
  });
}
