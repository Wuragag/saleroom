export interface UseCase {
  title: string
  description: string
  audience: string
}

export const USE_CASES: UseCase[] = [
  {
    title: "Sales Proposals",
    description:
      "Replace static PDFs with a live page that shows you exactly how your prospect engages. Know what matters to them before every follow-up.",
    audience: "Account Executives",
  },
  {
    title: "Mutual Action Plans",
    description:
      "Give every deal a shared workspace. Align stakeholders, track milestones, and keep the deal moving forward in one transparent page.",
    audience: "Sales Leaders",
  },
  {
    title: "Customer Onboarding",
    description:
      "Send new customers a single page with everything they need to get started — docs, videos, contacts, and next steps.",
    audience: "Customer Success",
  },
  {
    title: "Quarterly Business Reviews",
    description:
      "Build beautiful QBR decks your champions can share internally. Track which executives actually review them.",
    audience: "Account Managers",
  },
  {
    title: "Partnership Proposals",
    description:
      "Pitch potential partners with a polished, trackable page. See when they engage and follow up at the perfect moment.",
    audience: "Business Development",
  },
  {
    title: "Investor Updates",
    description:
      "Share investor updates in a branded page instead of a plain email. See who reads them and which metrics get the most attention.",
    audience: "Founders",
  },
]
