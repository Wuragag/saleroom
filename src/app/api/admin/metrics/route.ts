import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-error";

export const GET = withErrorHandler(async () => {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalTeams,
    totalPages,
    newUsersLast30Days,
    newTeamsLast30Days,
    proCount,
    teamCount,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.team.count(),
    prisma.page.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.team.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.subscription.count({ where: { plan: "PRO" } }),
    prisma.subscription.count({ where: { plan: "TEAM" } }),
  ]);

  const planDistribution = {
    FREE: Math.max(0, totalTeams - proCount - teamCount),
    PRO: proCount,
    TEAM: teamCount,
  };

  return NextResponse.json({
    totalUsers,
    totalTeams,
    totalPages,
    newUsersLast30Days,
    newTeamsLast30Days,
    planDistribution,
  });
});
