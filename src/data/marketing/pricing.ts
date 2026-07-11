export interface PricingTier {
  name: string
  price: string
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
    period: "forever",
    description: "Perfect for trying Dealbeam on your next deal.",
    features: [
      "1 page",
      "Up to 3 tabs per page",
      "Basic analytics",
      "Dealbeam branding",
      "Email support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "Full visibility into every deal. One flat price, no per-seat fees.",
    features: [
      "Unlimited pages",
      "Unlimited tabs",
      "Advanced analytics",
      "Password protection",
      "AI content generation",
      "Custom branding",
      "Up to 3 team members",
      "20 synced blocks",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "per month",
    description: "One flat price for your entire sales team. No per-seat surprises.",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Unlimited synced blocks",
      "Shared template library",
      "Team analytics dashboard",
      "Role-based permissions",
      "CRM integrations",
      "SSO & provisioning",
      "Dedicated support",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
]

export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Can I try Dealbeam before paying?",
    answer:
      "Yes. The Free plan is yours forever with no credit card required. When you're ready for more, Pro comes with a 14-day free trial.",
  },
  {
    question: "What happens when I hit my page limit?",
    answer:
      "You can still view and share existing pages. To create new ones, upgrade your plan or archive an old page to free up a slot.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or cancellation fees. Downgrade or cancel from your settings page at any time.",
  },
  {
    question: "Do my buyers need an account?",
    answer:
      "No. Buyers view your page via a simple link — no sign-up, no login, no friction.",
  },
  {
    question: "How does team billing work?",
    answer:
      "Both Pro and Team are simple flat-rate plans — one price for your whole team, no per-seat billing. Upgrade or downgrade anytime from your settings.",
  },
]
