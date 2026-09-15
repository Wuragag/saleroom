import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { isDeletionConfirmed, planAccountDeletion } from "@/lib/account-deletion";
import { getStripe } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";
import { del } from "@vercel/blob";

// The password check makes this endpoint a brute-force target for anyone
// holding a stolen session; five attempts a minute per user is plenty.
const limiter = rateLimit({ limit: 5, window: "60s", prefix: "account-delete" });

/**
 * Best-effort removal of the account's own public Blob files, so an erased
 * account leaves no images behind. Page logo/cover URLs are user-editable
 * (any https URL is accepted by the page style API) and brand logos are
 * shared with the whole team, so — exactly like the upload routes — a file is
 * deleted only when its path proves it belongs to this user, this page, or a
 * team being deleted here. Anything else is left alone.
 */
async function deleteOwnedBlobs(targets: Array<{ url: string | null | undefined; prefix: string }>) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const urls = new Set<string>();
  for (const { url, prefix } of targets) {
    if (!url?.startsWith("https://")) continue;
    try {
      const u = new URL(url);
      if (u.hostname.endsWith(".public.blob.vercel-storage.com") && u.pathname.startsWith(prefix)) urls.add(url);
    } catch {
      // not a URL — ignore
    }
  }
  await Promise.allSettled([...urls].map((u) => del(u)));
}

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
  const { success } = await limiter.limit(userId);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }
  const body = (await safeJson<{ password?: string; confirmation?: string }>(request)) ?? {};

  if (!isDeletionConfirmed(body.confirmation)) {
    return NextResponse.json({ error: "Type DELETE to confirm" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, email: true, avatarUrl: true },
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

  // Collect public image files before the rows that reference them vanish.
  const [pageImages, brandLogos] = await Promise.all([
    prisma.page.findMany({ where: { userId }, select: { id: true, logoUrl: true, coverImage: true } }),
    plan.deleteTeamIds.length
      ? prisma.brandKit.findMany({ where: { teamId: { in: plan.deleteTeamIds } }, select: { teamId: true, logoUrl: true } })
      : Promise.resolve([] as { teamId: string; logoUrl: string | null }[]),
  ]);

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

  await deleteOwnedBlobs([
    { url: user.avatarUrl, prefix: `/avatars/${userId}-` },
    ...pageImages.flatMap((p) => [
      { url: p.logoUrl, prefix: `/logos/${p.id}-` },
      { url: p.coverImage, prefix: `/covers/${p.id}-` },
    ]),
    // Brand logos only for teams erased in this request: a surviving team's
    // logo is shared by its other members' pages and must stay.
    ...brandLogos.map((b) => ({ url: b.logoUrl, prefix: `/brand-logos/${b.teamId}-` })),
  ]);

  console.info(`[account:delete] user ${userId} erased (${plan.deleteTeamIds.length} team(s) removed, left ${plan.leaveTeamIds.length})`);
  return NextResponse.json({ deleted: true });
});
