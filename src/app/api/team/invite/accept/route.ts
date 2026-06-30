import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canAddTeamMember, assertCanAddTeamMemberTx } from "@/lib/plan-limits";
import { withErrorHandler } from "@/lib/api-error";

// POST /api/team/invite/accept — accept an invite (authenticated user)
export const POST = withErrorHandler(async (request: Request) => {
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

  // ── Email binding ──
  // The invite is issued to a specific (normalized) email; only the logged-in
  // user who owns that address may accept it. Without this check, anyone who
  // obtains the link (forwarded email, leaked URL) could join the team.
  const sessionEmail = session.user.email?.trim().toLowerCase();
  if (!sessionEmail || sessionEmail !== invite.email) {
    return NextResponse.json(
      { error: "This invite was issued to a different email address." },
      { status: 403 }
    );
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResult = await prisma.$transaction(async (tx: any) => {
    // Serialize concurrent accepts for this team so the seat cap can't be raced,
    // and re-check the limit authoritatively inside the locked transaction.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${invite.teamId}:members`})::bigint)`;
    await assertCanAddTeamMemberTx(tx, invite.teamId);

    const oldMembership = await tx.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (oldMembership && oldMembership.teamId !== invite.teamId) {
      // Only allow leaving if user is the sole OWNER of a personal team,
      // or if they are a regular MEMBER. Prevent team owners with other
      // members from silently abandoning their team.
      if (oldMembership.role === "OWNER") {
        const otherMembers = await tx.teamMember.count({
          where: {
            teamId: oldMembership.teamId,
            userId: { not: session.user.id },
          },
        });
        if (otherMembers > 0) {
          // Abort the transaction — caller handles the response
          return "OWNER_HAS_MEMBERS" as const;
        }
      }

      // Remove from old team
      await tx.teamMember.delete({ where: { id: oldMembership.id } });

      // Only clean up personal (now-empty) teams.
      // Delete the user's own pages in that team rather than leaking
      // them to the new team.
      const remaining = await tx.teamMember.count({
        where: { teamId: oldMembership.teamId },
      });
      if (remaining === 0) {
        // Delete pages that belonged to this user in the old team
        // instead of reassigning them across team boundaries.
        await tx.page.deleteMany({
          where: {
            teamId: oldMembership.teamId,
            userId: session.user.id,
          },
        });
        // Delete any remaining orphaned pages in the empty team
        await tx.page.deleteMany({
          where: { teamId: oldMembership.teamId },
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

    return "OK" as const;
  });

  if (txResult === "OWNER_HAS_MEMBERS") {
    return NextResponse.json(
      { error: "You must transfer team ownership before joining another team" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    message: "Welcome to the team!",
    teamName: invite.team.name,
  });
});
