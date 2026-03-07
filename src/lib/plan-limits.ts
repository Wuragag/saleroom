import { prisma } from "@/lib/prisma";
import type { BillingPlan } from "@/generated/prisma";

// ──── Plan Limit Definitions ────

export interface PlanLimits {
  maxPages: number; // -1 = unlimited
  maxTabsPerPage: number; // -1 = unlimited
  maxTeamMembers: number; // -1 = unlimited
  maxSyncedBlocks: number; // -1 = unlimited
  passwordProtection: boolean;
  canInvite: boolean;
}

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  FREE: {
    maxPages: 1,
    maxTabsPerPage: 3,
    maxTeamMembers: 1,
    maxSyncedBlocks: 0,
    passwordProtection: false,
    canInvite: false,
  },
  PRO: {
    maxPages: -1,
    maxTabsPerPage: -1,
    maxTeamMembers: 3,
    maxSyncedBlocks: 20,
    passwordProtection: true,
    canInvite: true,
  },
  TEAM: {
    maxPages: -1,
    maxTabsPerPage: -1,
    maxTeamMembers: -1,
    maxSyncedBlocks: -1,
    passwordProtection: true,
    canInvite: true,
  },
};

// ──── Fetchers ────

/** Get the team's current billing plan. Returns FREE if no subscription exists. */
export async function getTeamPlan(teamId: string): Promise<BillingPlan> {
  const sub = await prisma.subscription.findUnique({
    where: { teamId },
    select: { plan: true, status: true },
  });
  // Only count ACTIVE or TRIALING subscriptions as having a paid plan
  if (sub && (sub.status === "ACTIVE" || sub.status === "TRIALING")) {
    return sub.plan;
  }
  return "FREE";
}

/** Get plan limits for a team. */
export async function getTeamPlanLimits(
  teamId: string
): Promise<PlanLimits & { plan: BillingPlan }> {
  const plan = await getTeamPlan(teamId);
  return { ...PLAN_LIMITS[plan], plan };
}

// ──── Enforcement Checks ────

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}

/** Can this team create a new page? */
export async function canCreatePage(
  teamId: string
): Promise<LimitCheckResult> {
  const { maxPages, plan } = await getTeamPlanLimits(teamId);
  if (maxPages === -1) return { allowed: true, current: 0, limit: -1 };

  const count = await prisma.page.count({ where: { teamId } });
  return {
    allowed: count < maxPages,
    reason:
      count >= maxPages
        ? `Your ${plan} plan allows ${maxPages} page${maxPages === 1 ? "" : "s"}. Upgrade to create more.`
        : undefined,
    current: count,
    limit: maxPages,
  };
}

/** Can this page have a new tab? */
export async function canCreateTab(
  pageId: string,
  teamId: string
): Promise<LimitCheckResult> {
  const { maxTabsPerPage, plan } = await getTeamPlanLimits(teamId);
  if (maxTabsPerPage === -1) return { allowed: true, current: 0, limit: -1 };

  const count = await prisma.tab.count({ where: { pageId } });
  return {
    allowed: count < maxTabsPerPage,
    reason:
      count >= maxTabsPerPage
        ? `Your ${plan} plan allows ${maxTabsPerPage} tab${maxTabsPerPage === 1 ? "" : "s"} per page. Upgrade to add more.`
        : undefined,
    current: count,
    limit: maxTabsPerPage,
  };
}

/** Can this team add another member (or send an invite)? */
export async function canAddTeamMember(
  teamId: string
): Promise<LimitCheckResult> {
  const { maxTeamMembers, plan } = await getTeamPlanLimits(teamId);
  if (maxTeamMembers === -1) return { allowed: true, current: 0, limit: -1 };

  const [memberCount, pendingInviteCount] = await Promise.all([
    prisma.teamMember.count({ where: { teamId } }),
    prisma.teamInvite.count({
      where: { teamId, status: "PENDING", expiresAt: { gt: new Date() } },
    }),
  ]);
  const total = memberCount + pendingInviteCount;

  return {
    allowed: total < maxTeamMembers,
    reason:
      total >= maxTeamMembers
        ? `Your ${plan} plan allows ${maxTeamMembers} team member${maxTeamMembers === 1 ? "" : "s"}. Upgrade to invite more.`
        : undefined,
    current: total,
    limit: maxTeamMembers,
  };
}

/** Can this team create a new synced block? */
export async function canCreateSyncedBlock(
  teamId: string
): Promise<LimitCheckResult> {
  const { maxSyncedBlocks, plan } = await getTeamPlanLimits(teamId);
  if (maxSyncedBlocks === -1) return { allowed: true, current: 0, limit: -1 };
  if (maxSyncedBlocks === 0) {
    return {
      allowed: false,
      reason: `Synced blocks are not available on the ${plan} plan. Upgrade to Pro or Team.`,
      current: 0,
      limit: 0,
    };
  }

  const count = await prisma.syncedBlock.count({ where: { teamId } });
  return {
    allowed: count < maxSyncedBlocks,
    reason:
      count >= maxSyncedBlocks
        ? `Your ${plan} plan allows ${maxSyncedBlocks} synced block${maxSyncedBlocks === 1 ? "" : "s"}. Upgrade to create more.`
        : undefined,
    current: count,
    limit: maxSyncedBlocks,
  };
}

/** Can this team set a page password? */
export async function canSetPassword(
  teamId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const { passwordProtection, plan } = await getTeamPlanLimits(teamId);
  return {
    allowed: passwordProtection,
    reason: !passwordProtection
      ? `Password protection is not available on the ${plan} plan. Upgrade to Pro or Team.`
      : undefined,
  };
}
