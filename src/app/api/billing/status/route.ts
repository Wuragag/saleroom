import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { PLAN_LIMITS, getTeamPlan } from "@/lib/plan-limits";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(async (_request, { session }) => {
  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const [subscription, pageCount, memberCount, pendingInviteCount] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { teamId } }),
      prisma.page.count({ where: { teamId } }),
      prisma.teamMember.count({ where: { teamId } }),
      prisma.teamInvite.count({
        where: { teamId, status: "PENDING", expiresAt: { gt: new Date() } },
      }),
    ]);

  const plan = await getTeamPlan(teamId);
  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    plan,
    status: subscription?.status ?? "ACTIVE",
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
    usage: {
      pages: { current: pageCount, limit: limits.maxPages },
      members: { current: memberCount + pendingInviteCount, limit: limits.maxTeamMembers },
    },
    features: {
      passwordProtection: limits.passwordProtection,
      canInvite: limits.canInvite,
    },
  });
});
