import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { isDeletionConfirmed, planAccountDeletion } from "@/lib/account-deletion";
import { getStripe } from "@/lib/stripe";

/**
 * DELETE /api/account — erase the signed-in user (GDPR Art. 17, KVKK Art. 7,
 * CCPA §1798.105). Body: { password: string, confirmation: "DELETE" }.
 *
 * What is removed: the user row and, by cascade, every page they created
 * (tabs, views, buyer visitors/sessions/recordings, contacts, form
 * submissions, action plans), their deals, comments and memberships. Teams
 * where they were the only member are deleted too (brand kit, templates,
 * synced blocks, subscription rows), and any paid subscription on those
 * teams is cancelled at Stripe first. Teams with other members survive;
 * an OWNER of such a team must hand over ownership before deleting.
 *
 * Billing records held by Stripe are retained by Stripe for as long as tax
 * law requires; that retention is described in the privacy policy.
 */
export const DELETE = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = (await safeJson<{ password?: string; confirmation?: string }>(request)) ?? {};

  if (!isDeletionConfirmed(body.confirmation)) {
    return NextResponse.json({ error: "Type DELETE to confirm" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Password re-check: deletion is irreversible, so a stolen session alone
  // must not be enough. Accounts without a password (impersonation-only /
  // legacy) can't pass this and must go through support.
  if (!user.password || !body.password || !(await bcrypt.compare(body.password, user.password))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: {
      teamId: true,
      role: true,
      team: {
        select: {
          name: true,
          _count: { select: { members: true } },
          subscription: { select: { stripeSubscriptionId: true } },
        },
      },
    },
  });

  const plan = planAccountDeletion(
    memberships.map((m) => ({
      teamId: m.teamId,
      teamName: m.team.name,
      role: m.role as "OWNER" | "MEMBER",
      memberCount: m.team._count.members,
      stripeSubscriptionId: m.team.subscription?.stripeSubscriptionId ?? null,
    })),
  );

  if (!plan.ok) {
    return NextResponse.json(
      {
        error: `You own ${plan.teamNames.join(", ")} and other people are still in it. Transfer ownership or remove the members first.`,
        code: plan.code,
        teams: plan.teamNames,
      },
      { status: 409 },
    );
  }

  // Cancel paid subscriptions before the rows disappear, so nobody keeps
  // being charged for a workspace that no longer exists.
  for (const subId of plan.cancelStripeSubscriptionIds) {
    try {
      await getStripe().subscriptions.cancel(subId);
    } catch (err) {
      console.error(`[account:delete] Stripe cancel failed for ${subId}:`, err);
      return NextResponse.json(
        { error: "We couldn't cancel your subscription. Please cancel it from Billing first, then try again." },
        { status: 502 },
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (plan.leaveTeamIds.length) {
      await tx.teamMember.deleteMany({ where: { userId, teamId: { in: plan.leaveTeamIds } } });
    }
    if (plan.deleteTeamIds.length) {
      await tx.team.deleteMany({ where: { id: { in: plan.deleteTeamIds } } });
    }
    // Pages, deals, comments, contacts and buyer data cascade from the user.
    await tx.user.delete({ where: { id: userId } });
  });

  console.info(`[account:delete] user ${userId} erased (${plan.deleteTeamIds.length} team(s) removed, left ${plan.leaveTeamIds.length})`);
  return NextResponse.json({ deleted: true });
});
