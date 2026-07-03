import { prisma } from "@/lib/prisma";
import { Prisma, type BillingPlan } from "@/generated/prisma";

// ──── Plan Limit Definitions ────

export interface PlanLimits {
  maxPages: number; // -1 = unlimited
  maxTabsPerPage: number; // -1 = unlimited
  maxTeamMembers: number; // -1 = unlimited
  maxSyncedBlocks: number; // -1 = unlimited
  passwordProtection: boolean;
  canInvite: boolean;
  // Flat monthly pool for AI actions (composer plan/build-tab/edit + document
  // import) — -1 = unlimited. See src/lib/ai-credits.ts for enforcement and
  // src/lib/ai-composer.ts / ai-page-generation.ts for the per-action costs.
  // Starting points to tune — not derived from real Anthropic per-token cost.
  aiCreditsPerMonth: number;
}

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  FREE: {
    maxPages: 1,
    maxTabsPerPage: 3,
    maxTeamMembers: 1,
    maxSyncedBlocks: 0,
    passwordProtection: false,
    canInvite: false,
    aiCreditsPerMonth: 20,
  },
  PRO: {
    maxPages: -1,
    maxTabsPerPage: -1,
    maxTeamMembers: 3,
    maxSyncedBlocks: 20,
    passwordProtection: true,
    canInvite: true,
    aiCreditsPerMonth: 300,
  },
  TEAM: {
    maxPages: -1,
    maxTabsPerPage: -1,
    maxTeamMembers: -1,
    maxSyncedBlocks: -1,
    passwordProtection: true,
    canInvite: true,
    aiCreditsPerMonth: 1000,
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

// ──── Atomic Enforcement (closes check-then-create TOCTOU races) ────
//
// The functions above read a count and the caller creates separately — two
// round-trips with no lock, so concurrent requests can each pass the check and
// collectively exceed the cap. The helpers below run the count + create inside
// one transaction guarded by a Postgres advisory lock, so callers sharing a key
// serialize and the cap holds under concurrency.

/** Thrown by the *Tx asserts below; mapped to a 403 PLAN_LIMIT by withErrorHandler. */
export class PlanLimitError extends Error {
  readonly code = "PLAN_LIMIT";
  constructor(
    message: string,
    readonly current: number,
    readonly limit: number
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/**
 * Run `fn` inside a transaction that first takes a transaction-scoped Postgres
 * advisory lock keyed on `lockKey`. Concurrent callers with the same key
 * serialize; the lock auto-releases on commit/rollback and never blocks a
 * different key, so unrelated teams/pages are unaffected.
 */
export async function withResourceLock<T>(
  lockKey: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;
    return fn(tx);
  });
}

/** Advisory-lock key for a team's (or teamless user's) page count. */
export function pageLockKey(teamId: string | null, userId: string): string {
  return teamId ? `team:${teamId}:pages` : `user:${userId}:pages`;
}

/**
 * Atomic page-limit assert. Teamless users (teamId === null) fall back to the
 * FREE cap counted against their own pages — closing the "no team => no limit"
 * bypass on AI write / import.
 */
export async function assertCanCreatePageTx(
  tx: Prisma.TransactionClient,
  teamId: string | null,
  userId: string
): Promise<void> {
  const { maxPages, plan } = teamId
    ? await getTeamPlanLimits(teamId)
    : { maxPages: PLAN_LIMITS.FREE.maxPages, plan: "FREE" as BillingPlan };
  if (maxPages === -1) return;
  const count = teamId
    ? await tx.page.count({ where: { teamId } })
    : await tx.page.count({ where: { userId } });
  if (count >= maxPages) {
    throw new PlanLimitError(
      `Your ${plan} plan allows ${maxPages} page${maxPages === 1 ? "" : "s"}. Upgrade to create more.`,
      count,
      maxPages
    );
  }
}

/** Atomic synced-block-limit assert. */
export async function assertCanCreateSyncedBlockTx(
  tx: Prisma.TransactionClient,
  teamId: string
): Promise<void> {
  const { maxSyncedBlocks, plan } = await getTeamPlanLimits(teamId);
  if (maxSyncedBlocks === -1) return;
  if (maxSyncedBlocks === 0) {
    throw new PlanLimitError(
      `Synced blocks are not available on the ${plan} plan. Upgrade to Pro or Team.`,
      0,
      0
    );
  }
  const count = await tx.syncedBlock.count({ where: { teamId } });
  if (count >= maxSyncedBlocks) {
    throw new PlanLimitError(
      `Your ${plan} plan allows ${maxSyncedBlocks} synced block${maxSyncedBlocks === 1 ? "" : "s"}. Upgrade to create more.`,
      count,
      maxSyncedBlocks
    );
  }
}

/** Atomic team-member-limit assert (members + still-pending invites). */
export async function assertCanAddTeamMemberTx(
  tx: Prisma.TransactionClient,
  teamId: string
): Promise<void> {
  const { maxTeamMembers, plan } = await getTeamPlanLimits(teamId);
  if (maxTeamMembers === -1) return;
  const [memberCount, pendingInviteCount] = await Promise.all([
    tx.teamMember.count({ where: { teamId } }),
    tx.teamInvite.count({
      where: { teamId, status: "PENDING", expiresAt: { gt: new Date() } },
    }),
  ]);
  const total = memberCount + pendingInviteCount;
  if (total >= maxTeamMembers) {
    throw new PlanLimitError(
      `Your ${plan} plan allows ${maxTeamMembers} team member${maxTeamMembers === 1 ? "" : "s"}. Upgrade to invite more.`,
      total,
      maxTeamMembers
    );
  }
}

/**
 * Atomic per-page tab-limit assert. `addCount` is how many tabs are about to be
 * created (1 for a single tab, N for a template/duplicate). Teamless users have
 * no per-page tab cap — the page cap already bounds them.
 */
export async function assertCanCreateTabsTx(
  tx: Prisma.TransactionClient,
  pageId: string,
  teamId: string | null,
  addCount: number
): Promise<void> {
  if (!teamId) return;
  const { maxTabsPerPage, plan } = await getTeamPlanLimits(teamId);
  if (maxTabsPerPage === -1) return;
  const existing = await tx.tab.count({ where: { pageId } });
  if (existing + addCount > maxTabsPerPage) {
    throw new PlanLimitError(
      `Your ${plan} plan allows ${maxTabsPerPage} tab${maxTabsPerPage === 1 ? "" : "s"} per page. Upgrade to add more.`,
      existing,
      maxTabsPerPage
    );
  }
}
