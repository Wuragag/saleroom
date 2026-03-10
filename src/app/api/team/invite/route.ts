import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamOwner } from "@/lib/team-auth";
import { canAddTeamMember } from "@/lib/plan-limits";
import { sendTeamInviteEmail } from "@/lib/email";
import crypto from "crypto";
import { withErrorHandler } from "@/lib/api-error";

// POST /api/team/invite — send an invite (owner only)
export const POST = withErrorHandler(async (request: Request) => {
  const { authorized, session, teamId, reason } = await requireTeamOwner();
  if (!authorized) {
    const status = !session ? 401 : 403;
    return NextResponse.json({ error: reason }, { status });
  }

  const body = await request.json();
  const { email } = body as { email?: string };

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ── Plan limit check ──
  const limitCheck = await canAddTeamMember(teamId!);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.reason, code: "PLAN_LIMIT", current: limitCheck.current, limit: limitCheck.limit },
      { status: 403 }
    );
  }

  // Check if user is already a team member
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: existingUser.id,
          teamId: teamId!,
        },
      },
    });
    if (existingMembership) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 409 }
      );
    }
  }

  // Check for existing pending invite
  const existingInvite = await prisma.teamInvite.findFirst({
    where: {
      email: normalizedEmail,
      teamId: teamId!,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite is already pending for this email" },
      { status: 409 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.teamInvite.create({
    data: {
      email: normalizedEmail,
      teamId: teamId!,
      token,
      invitedById: session!.user.id,
      expiresAt,
    },
  });

  // Get team name for email
  const team = await prisma.team.findUnique({
    where: { id: teamId! },
    select: { name: true },
  });

  // Send email (non-blocking)
  try {
    await sendTeamInviteEmail(
      normalizedEmail,
      token,
      team?.name ?? "your team",
      session!.user.name ?? "A team member"
    );
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }

  return NextResponse.json(invite, { status: 201 });
});

// GET /api/team/invite — list pending invites (owner only)
export const GET = withErrorHandler(async () => {
  const { authorized, session, teamId, reason } = await requireTeamOwner();
  if (!authorized) {
    const status = !session ? 401 : 403;
    return NextResponse.json({ error: reason }, { status });
  }

  const invites = await prisma.teamInvite.findMany({
    where: { teamId: teamId!, status: "PENDING" },
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
});
