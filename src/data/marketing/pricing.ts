/**
 * Pricing copy. Limits mirror PLAN_LIMITS in src/lib/plan-limits.ts — keep the
 * two in step. Prices are display strings; Stripe prices are the billing truth.
 */

export interface PricingTier {
  name: string
  price: string
  /** Whole-dollar monthly price for structured data (0 = free). */
  priceMonthly: number
  period: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    priceMonthly: 0,
    period: "forever",
    description: "One page, properly done. Enough to close your first deal.",
    features: [
      "1 deal page, up to 3 tabs",
      "Buyer intelligence and analytics",
      "AI Write and document import (20 credits / month)",
      "Mutual action plans and forms",
      "5 open deals in the pipeline",
      "Dealbeam badge on the page",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    priceMonthly: 29,
    period: "per month",
    description: "Every deal on its own page. One flat price, not per seat.",
    features: [
      "Unlimited pages and tabs",
      "Up to 3 team members",
      "Password-protected pages",
      "Hide the Dealbeam badge",
      "20 synced blocks",
      "Unlimited open deals",
      "300 AI credits / month",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$79",
    priceMonthly: 79,
    period: "per month",
    description: "The whole team, one bill. Nothing counted per head.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Unlimited synced blocks",
      "Shared brand kit and templates",
      "1,000 AI credits / month",
    ],
    cta: "Start Team",
    highlighted: false,
  },
]

export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Can I try Dealbeam before paying?",
    answer:
      "Yes. The Free plan is yours for as long as you like, with no credit card: one page, three tabs, full analytics and AI Write. Upgrade when the second deal needs a page.",
  },
  {
    question: "What happens when I hit the Free page limit?",
    answer:
      "Your existing page keeps working and stays shared. To create another, upgrade to Pro or delete the page you no longer need.",
  },
  {
    question: "Is pricing per seat?",
    answer:
      "No. Pro and Team are flat monthly prices for the whole workspace. Pro allows up to three members; Team has no member limit.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no contracts or cancellation fees. Manage or cancel the subscription from Settings at any time; Stripe handles billing.",
  },
  {
    question: "Do my buyers need an account?",
    answer:
      "No. Buyers open a plain link in any browser. If you add a password or an email gate, that is all they are asked for.",
  },
  {
    question: "What are AI credits?",
    answer:
      "Every AI Write draft or document import spends credits from a monthly pool: 20 on Free, 300 on Pro, 1,000 on Team. Generation is claimed once, so a double click never charges twice.",
  },
]
