import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getPlanFromPriceId } from "@/lib/stripe";
import type { BillingPlan, SubscriptionStatus } from "@/generated/prisma";

function getWebhookStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
}

const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  trialing: "TRIALING",
  incomplete: "INCOMPLETE",
  unpaid: "UNPAID",
};

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getWebhookStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook error processing ${event.type}:`, err);
    // Still return 200 so Stripe doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const teamId = session.metadata?.teamId;
  if (!teamId || session.mode !== "subscription") return;

  const subscriptionId = session.subscription as string;
  const sub = await getWebhookStripe().subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : null;

  await prisma.subscription.update({
    where: { teamId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId ?? null,
      plan: (plan as BillingPlan) ?? "FREE",
      status: "ACTIVE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodStart: new Date(((sub as any).current_period_start ?? 0) * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodEnd: new Date(((sub as any).current_period_end ?? 0) * 1000),
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!subscription) return;

  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? getPlanFromPriceId(priceId) : null;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      stripePriceId: priceId ?? subscription.stripePriceId,
      plan: (plan as BillingPlan) ?? subscription.plan,
      status: STRIPE_STATUS_MAP[sub.status] ?? "ACTIVE",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodStart: new Date(((sub as any).current_period_start ?? 0) * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodEnd: new Date(((sub as any).current_period_end ?? 0) * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  // Downgrade to FREE when subscription is fully canceled
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subId = (invoice as any).subscription as string;
  if (!subId) return;
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { status: "PAST_DUE" },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subId = (invoice as any).subscription as string;
  if (!subId) return;
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { status: "ACTIVE" },
  });
}
