import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, PLAN_PRICE_MAP } from "@/lib/stripe";
import { requireTeamOwner } from "@/lib/team-auth";

export async function POST(request: Request) {
  // Billing changes are owner-only (matches the billing portal route).
  const ownerCheck = await requireTeamOwner();
  if (!ownerCheck.authorized) {
    const status = !ownerCheck.session ? 401 : 403;
    return NextResponse.json({ error: ownerCheck.reason }, { status });
  }
  const teamId = ownerCheck.teamId!;

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

    // Guard against placeholder customer IDs (manual overrides or pending Stripe setup)
    if (
      subscription.stripeCustomerId.startsWith("manual_override_") ||
      subscription.stripeCustomerId.startsWith("pending_")
    ) {
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

    const appUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

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
