export interface Example {
  title: string
  category: string
  description: string
  tabs: string[]
}

export const EXAMPLES: Example[] = [
  {
    title: "Q4 Enterprise Proposal",
    category: "Sales Proposal",
    description:
      "A multi-tab proposal with pricing, team bios, and a case study. Built for a six-figure SaaS deal.",
    tabs: ["Overview", "Pricing", "Case Study", "Team"],
  },
  {
    title: "Customer Kickoff Guide",
    category: "Onboarding",
    description:
      "Everything a new customer needs in one page — setup checklist, video walkthrough, and key contacts.",
    tabs: ["Welcome", "Setup Guide", "Resources"],
  },
  {
    title: "Series A Investor Update",
    category: "Investor Update",
    description:
      "Monthly investor update with key metrics, product milestones, and fundraising progress.",
    tabs: ["Highlights", "Metrics", "Roadmap"],
  },
  {
    title: "Annual Partnership Review",
    category: "QBR",
    description:
      "A quarterly review page with engagement analytics, ROI summary, and renewal details.",
    tabs: ["Executive Summary", "Analytics", "Next Steps"],
  },
  {
    title: "Product Launch Brief",
    category: "Mutual Action Plan",
    description:
      "Coordinated launch plan shared between sales and marketing with embedded timelines and ownership.",
    tabs: ["Timeline", "Stakeholders", "Assets"],
  },
  {
    title: "Agency Pitch Deck",
    category: "Sales Proposal",
    description:
      "A creative agency pitch with portfolio embeds, pricing options, and a calendar booking link.",
    tabs: ["About Us", "Portfolio", "Pricing", "Book a Call"],
  },
]
