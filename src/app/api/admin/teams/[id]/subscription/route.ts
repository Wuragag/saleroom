import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-error";

const VALID_PLANS = ["FREE", "PRO", "TEAM"] as const;
type Plan = (typeof VALID_PLANS)[number];

export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: teamId } = await params;
  const body = await request.json();
  const { plan } = body as { plan: Plan };

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: `plan must be one of: ${VALID_PLANS.join(", ")}` },
      { status: 400 }
    );
  }

  // Verify team exists
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Check if team already has a subscription with a real Stripe customer ID
  const existing = await prisma.subscription.findUnique({
    where: { teamId },
    select: { stripeCustomerId: true },
  });

  // Upsert subscription — only use a placeholder stripeCustomerId when creating
  // a brand-new record (i.e., when the team has never been through Stripe checkout)
  const subscription = await prisma.subscription.upsert({
    where: { teamId },
    update: {
      plan,
      status: "ACTIVE",
      // Clear cancellation state on manual override
      cancelAtPeriodEnd: false,
    },
    create: {
      teamId,
      plan,
      status: "ACTIVE",
      // Preserve any existing Stripe customer ID, otherwise use a sentinel
      // that's clearly not a real Stripe ID so it won't collide
      stripeCustomerId: existing?.stripeCustomerId ?? `manual_override_${teamId}`,
    },
  });

  return NextResponse.json({ plan: subscription.plan, status: subscription.status });
});
