import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { PLAN_LIMITS, getTeamPlan } from "@/lib/plan-limits";
import { getRemainingCredits } from "@/lib/ai-credits";
import { withErrorHandler } from "@/lib/api-error";

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }

  const [subscription, pageCount, memberCount, pendingInviteCount, credits] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { teamId } }),
      prisma.page.count({ where: { teamId } }),
      prisma.teamMember.count({ where: { teamId } }),
      prisma.teamInvite.count({
        where: { teamId, status: "PENDING", expiresAt: { gt: new Date() } },
      }),
      getRemainingCredits(teamId, session.user.id),
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
      aiCredits: {
        current: credits.limit === -1 ? 0 : credits.limit - credits.remaining,
        limit: credits.limit,
      },
    },
    features: {
      passwordProtection: limits.passwordProtection,
      canInvite: limits.canInvite,
    },
  });
});
