import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId, requireTeamOwner } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

// GET /api/team — get current user's team info
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, lastName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(team);
});

// PUT /api/team — rename team (owner only)
export const PUT = withErrorHandler(async (request: Request) => {
  const { authorized, session, teamId, reason } = await requireTeamOwner();
  if (!authorized) {
    const status = !session ? 401 : 403;
    return NextResponse.json({ error: reason }, { status });
  }

  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const team = await prisma.team.update({
    where: { id: teamId! },
    data: { name: name.trim() },
  });

  return NextResponse.json(team);
});
