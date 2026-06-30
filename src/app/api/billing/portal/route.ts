import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { requireTeamOwner } from "@/lib/team-auth";

export async function POST() {
  const ownerCheck = await requireTeamOwner();
  if (!ownerCheck.authorized) {
    const status = !ownerCheck.session ? 401 : 403;
    return NextResponse.json({ error: ownerCheck.reason }, { status });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { teamId: ownerCheck.teamId! },
      select: { stripeCustomerId: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription record not found" },
        { status: 404 }
      );
    }

    if (
      subscription.stripeCustomerId.startsWith("manual_override_") ||
      subscription.stripeCustomerId.startsWith("pending_")
    ) {
      return NextResponse.json(
        { error: "No Stripe customer on file. Please contact support." },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/settings?tab=billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal session error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
