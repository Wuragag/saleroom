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
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const teamId = session.metadata?.teamId;
  if (!teamId || session.mode !== "subscription") return;

  const subscriptionId = session.subscription as string;
  const sub = await getWebhookStripe().subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price.id;
  const resolvedPlan = priceId ? getPlanFromPriceId(priceId) : null;
  if (!resolvedPlan) {
    console.error(`Unknown price ID ${priceId} from subscription ${subscriptionId} — cannot resolve plan`);
    throw new Error(`Unknown price ID: ${priceId}`);
  }
  const plan: BillingPlan = resolvedPlan as BillingPlan;

  await prisma.subscription.update({
    where: { teamId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId ?? null,
      plan,
      // Reflect the subscription's real status (e.g. incomplete/trialing) rather
      // than assuming ACTIVE — payment may not have fully cleared at checkout.
      status: STRIPE_STATUS_MAP[sub.status] ?? "ACTIVE",
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
  const resolvedPlan = priceId ? getPlanFromPriceId(priceId) : null;
  const plan = resolvedPlan ? (resolvedPlan as BillingPlan) : null;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      stripePriceId: priceId ?? subscription.stripePriceId,
      plan: plan ?? subscription.plan,
      status: STRIPE_STATUS_MAP[sub.status] ?? "INCOMPLETE",
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

  // Webhooks can be replayed and delivered out of order (Stripe retries), so a
  // stale `invoice.paid` must NOT blindly flip an unpaid/past_due subscription
  // back to ACTIVE. Read the subscription's authoritative current status from
  // Stripe and mirror that, rather than trusting the event's mere occurrence.
  const sub = await getWebhookStripe().subscriptions.retrieve(subId);
  const mappedStatus = STRIPE_STATUS_MAP[sub.status] ?? "INCOMPLETE";

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId, status: { not: "CANCELED" } },
    data: { status: mappedStatus },
  });
}
