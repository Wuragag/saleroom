import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  // Add to team + mark invite accepted in a transaction
  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: invite.teamId,
        role: "MEMBER",
      },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({
    message: "Welcome to the team!",
    teamName: invite.team.name,
  });
}
