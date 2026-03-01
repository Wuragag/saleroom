import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client (avoids build-time errors when env var is missing) */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

/** Map plan name → Stripe price ID */
export const PLAN_PRICE_MAP: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  TEAM: process.env.STRIPE_TEAM_PRICE_ID ?? "",
};

/** Reverse: Stripe price ID → plan name */
export function getPlanFromPriceId(priceId: string): string | null {
  for (const [plan, id] of Object.entries(PLAN_PRICE_MAP)) {
    if (id === priceId) return plan;
  }
  return null;
}
