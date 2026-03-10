import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

// GET /api/team/members — list team members
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true, lastName: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
});
