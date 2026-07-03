import { prisma } from "@/lib/prisma";
import type { BillingPlan } from "@/generated/prisma";
import { getTeamPlanLimits, PLAN_LIMITS, withResourceLock } from "@/lib/plan-limits";

/**
 * Flat per-action AI credit costs, deducted from a monthly per-team pool.
 * Deliberately NOT derived from actual token usage (Anthropic's `usage`
 * payload isn't captured anywhere in this codebase) — a flat cost keeps the
 * model simple and predictable. Tune these integers freely; no schema
 * change needed to adjust them.
 */
export const AI_CREDIT_COSTS = {
  plan: 1,
  buildTab: 2,
  edit: 2,
  import: 3,
} as const;

export type AiCreditAction = keyof typeof AI_CREDIT_COSTS;

/** Thrown when a team/user lacks enough credits for a requested action. */
export class InsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS";
  constructor(
    message: string,
    readonly required: number,
    readonly available: number
  ) {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Scope a credits row by team when the caller has one; falls back to the
 * user when it doesn't (mirrors assertCanCreatePageTx's teamless fallback —
 * still enforces the FREE cap against the user's own usage rather than
 * letting the edge case bypass the limit).
 */
function creditsWhere(teamId: string | null, userId: string) {
  return teamId ? { teamId } : { userId };
}

/** Advisory-lock key for a team's (or teamless user's) AI credits. */
function creditsLockKey(teamId: string | null, userId: string): string {
  return teamId ? `team:${teamId}:ai-credits` : `user:${userId}:ai-credits`;
}

/** Calendar-month rollover (UTC) — not tied to Stripe's billing period since
 *  FREE teams have no Subscription row at all. */
function isSamePeriod(periodStart: Date, now: Date): boolean {
  return (
    periodStart.getUTCFullYear() === now.getUTCFullYear() &&
    periodStart.getUTCMonth() === now.getUTCMonth()
  );
}

async function resolveLimits(teamId: string | null) {
  return teamId
    ? await getTeamPlanLimits(teamId)
    : { ...PLAN_LIMITS.FREE, plan: "FREE" as BillingPlan };
}

export interface CreditsSnapshot {
  remaining: number; // -1 = unlimited
  limit: number; // -1 = unlimited
  plan: BillingPlan;
}

/**
 * Read-only: how many AI credits does this team/user have left this month?
 * Does NOT create rows or reset the period as a side effect — safe to call
 * on every plan response for the client-facing "can we afford the build"
 * estimate.
 */
export async function getRemainingCredits(
  teamId: string | null,
  userId: string
): Promise<CreditsSnapshot> {
  const { aiCreditsPerMonth, plan } = await resolveLimits(teamId);
  if (aiCreditsPerMonth === -1) return { remaining: -1, limit: -1, plan };

  const row = await prisma.teamAiCredits.findUnique({
    where: creditsWhere(teamId, userId),
  });
  const now = new Date();
  const used = row && isSamePeriod(row.periodStart, now) ? row.creditsUsed : 0;
  return {
    remaining: Math.max(0, aiCreditsPerMonth - used),
    limit: aiCreditsPerMonth,
    plan,
  };
}

/**
 * Read-only pre-flight check — throws InsufficientCreditsError if `amount`
 * credits aren't available, but does NOT deduct. Used for fast-fail checks
 * before spending CPU (document parsing) or before committing to a
 * multi-call build the team can't finish.
 */
export async function assertHasCredits(
  teamId: string | null,
  userId: string,
  amount: number
): Promise<void> {
  const { remaining, limit, plan } = await getRemainingCredits(teamId, userId);
  if (limit === -1) return;
  if (remaining < amount) {
    throw new InsufficientCreditsError(
      `Your ${plan} plan doesn't have enough AI credits left this month (need ${amount}, have ${remaining}). Upgrade for more.`,
      amount,
      remaining
    );
  }
}

/**
 * Atomically assert-and-deduct `amount` credits, using the same
 * advisory-lock + transaction pattern as plan-limits.ts's `*Tx` helpers.
 * Lazily creates the TeamAiCredits row on first use; resets creditsUsed to
 * 0 when the calendar month has rolled over. Call this immediately before
 * each real Claude call — never before, never batched.
 */
export async function chargeCredits(
  teamId: string | null,
  userId: string,
  amount: number
): Promise<void> {
  const { aiCreditsPerMonth, plan } = await resolveLimits(teamId);
  if (aiCreditsPerMonth === -1) return;

  await withResourceLock(creditsLockKey(teamId, userId), async (tx) => {
    const where = creditsWhere(teamId, userId);
    const row = await tx.teamAiCredits.findUnique({ where });
    const now = new Date();

    const creditsUsed = row && isSamePeriod(row.periodStart, now) ? row.creditsUsed : 0;
    const remaining = Math.max(0, aiCreditsPerMonth - creditsUsed);
    if (remaining < amount) {
      throw new InsufficientCreditsError(
        `Your ${plan} plan doesn't have enough AI credits left this month (need ${amount}, have ${remaining}). Upgrade for more.`,
        amount,
        remaining
      );
    }

    const newUsed = creditsUsed + amount;
    if (row) {
      await tx.teamAiCredits.update({
        where,
        data: {
          creditsUsed: newUsed,
          // Only reset periodStart if we detected a rollover above.
          periodStart: isSamePeriod(row.periodStart, now) ? row.periodStart : now,
        },
      });
    } else {
      await tx.teamAiCredits.create({
        data: { teamId, userId: teamId ? null : userId, creditsUsed: newUsed, periodStart: now },
      });
    }
  });
}
