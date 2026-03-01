import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, PLAN_PRICE_MAP } from "@/lib/stripe";
import { getUserTeamId } from "@/lib/team-auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { plan } = body as { plan: string };

    if (!plan || !["PRO", "TEAM"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: "Pricing not configured for this plan" },
        { status: 500 }
      );
    }

    const teamId = await getUserTeamId(session.user.id);
    if (!teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { teamId },
      select: { stripeCustomerId: true, stripeSubscriptionId: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription record not found" },
        { status: 404 }
      );
    }

    // Guard against manual-override placeholder customer IDs
    if (subscription.stripeCustomerId.startsWith("manual_override_")) {
      return NextResponse.json(
        { error: "No Stripe customer on file. Please contact support." },
        { status: 400 }
      );
    }

    // If they already have an active Stripe subscription, redirect to portal instead
    if (subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "You already have an active subscription. Use the billing portal to change plans." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: subscription.stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&upgraded=true`,
      cancel_url: `${appUrl}/settings?tab=billing`,
      metadata: { teamId, plan },
      subscription_data: {
        metadata: { teamId, plan },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
