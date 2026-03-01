import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_PLANS = ["FREE", "PRO", "TEAM"] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Upsert subscription — use a placeholder stripeCustomerId if the team
  // has no Stripe customer yet (manual override doesn't need one)
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
      // Placeholder — no real Stripe customer for manual overrides
      stripeCustomerId: `manual_override_${teamId}`,
    },
  });

  return NextResponse.json({ plan: subscription.plan, status: subscription.status });
}
