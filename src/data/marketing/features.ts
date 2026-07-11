export interface Feature {
  slug: string
  title: string
  label: string
  description: string
  detailHeading: string
  detailBody: string
  highlights: string[]
}

export const FEATURES: Feature[] = [
  {
    slug: "page-builder",
    title: "Page Builder",
    label: "Create",
    description:
      "A block editor that makes proposals look like products. Rich text, embeds, tables, and AI content in one clean link.",
    detailHeading: "Build proposals your buyers actually want to read",
    detailBody:
      "Drag and drop blocks to craft a beautiful, branded proposal. Embed videos, add pricing tables, and let AI help you write — all in a live page your buyer can open from any device.",
    highlights: [
      "Block-based drag & drop editor",
      "Video, calendar, and file embeds",
      "AI-powered content generation",
      "Custom branding and theming",
      "Mobile-optimized pages",
    ],
  },
  {
    slug: "analytics",
    title: "Analytics & Tracking",
    label: "Track",
    description:
      "See who opened your page, which sections they read, and how long they spent. Know exactly when to follow up.",
    detailHeading: "See inside every deal, in real time",
    detailBody:
      "The moment your buyer opens your page, you get a notification. Watch which sections they spend time on, whether they shared it internally, and spot buying signals before your competitors do.",
    highlights: [
      "Real-time visitor notifications",
      "Section-level engagement tracking",
      "Time-on-page analytics",
      "Internal share detection",
      "Visitor identification",
    ],
  },
  {
    slug: "ai-content",
    title: "AI Content",
    label: "Generate",
    description:
      "Let AI draft proposals, rewrite sections, and suggest improvements based on what's working across your team.",
    detailHeading: "Write better proposals in a fraction of the time",
    detailBody:
      "Use AI to generate first drafts, polish your writing, and translate content. Built-in suggestions learn from your best-performing pages to help every rep write like your top closer.",
    highlights: [
      "One-click proposal drafts",
      "Tone and style suggestions",
      "Content performance insights",
      "Multi-language support",
      "Brand voice consistency",
    ],
  },
  {
    slug: "collaboration",
    title: "Team Collaboration",
    label: "Collaborate",
    description:
      "Work together on proposals with your team. Share templates, sync blocks, and keep everyone aligned.",
    detailHeading: "One team, one source of truth",
    detailBody:
      "Build a shared library of templates and synced blocks so every rep sends consistent, on-brand proposals. Assign roles, leave comments, and track who changed what.",
    highlights: [
      "Shared template library",
      "Synced content blocks",
      "Role-based permissions",
      "Team activity feed",
      "Version history",
    ],
  },
  {
    slug: "integrations",
    title: "Integrations",
    label: "Connect",
    description:
      "Connect Dealbeam to your CRM, calendar, and communication tools. Keep your workflow in one place.",
    detailHeading: "Fits right into your existing stack",
    detailBody:
      "Push engagement data to Salesforce or HubSpot automatically. Embed your Calendly link for instant booking. Get Slack alerts the moment a key buyer engages with your proposal.",
    highlights: [
      "Salesforce & HubSpot sync",
      "Calendar embedding (Calendly, Cal.com)",
      "Slack & email notifications",
      "Zapier & webhooks",
      "SSO & team provisioning",
    ],
  },
]
