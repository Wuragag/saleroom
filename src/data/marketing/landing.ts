/**
 * Landing-page copy. Pure data so the sections in src/components/marketing/
 * stay presentational.
 *
 * Voice: stoic — short declaratives, no superlatives, nothing we cannot show.
 * Every claim here maps to a built feature in docs/FEATURES.md.
 */
import type { FeatureVisual } from "./features"
import type { FaqEntry } from "@/lib/seo"

/** "01", "02", … — the chapter numbering used across the landing page. */
export function indexLabel(i: number): string {
  return String(i + 1).padStart(2, "0")
}

export const HERO = {
  eyebrow: "Deal pages for people who say less",
  /** Rendered as two lines; the second carries the italic accent. */
  titleLine1: "One page.",
  titleLine2: "Every deal,",
  titleAccent: "in order.",
  subtitle:
    "Dealbeam turns your proposal, pricing and next steps into a single branded link your buyer opens without logging in — and shows you every read as it happens.",
  primaryCta: { label: "Create your page", href: "/auth/signup" },
  secondaryCta: { label: "See the product", href: "#product" },
  note: "Free plan. No credit card. Buyers never need an account.",
}

/** Facts, not vanity metrics — each one is a property of the product. */
export const LANDING_FACTS = [
  { value: "1", label: "link replaces the deck, the PDF and the thread" },
  { value: "0", label: "logins asked of your buyer" },
  { value: "$0", label: "until you need a second page" },
  { value: "3", label: "flat plans — nothing per seat" },
]

export interface ShowcaseTab {
  id: string
  /** Short tab label ("Write"). */
  label: string
  kicker: string
  title: string
  titleAccent: string
  body: string
  bullets: string[]
  href: string
  visual: FeatureVisual
  /** Accessible description of the product visual. */
  alt: string
}

/** The interactive product showcase — one tab per stage of a deal. */
export const SHOWCASE: ShowcaseTab[] = [
  {
    id: "write",
    label: "Write",
    kicker: "The editor",
    title: "A page,",
    titleAccent: "not a deck.",
    body:
      "Type a slash and insert what the deal needs: pricing tables, embeds, forms, contact cards, metrics. Split it into tabs. Every tab gets its own link.",
    bullets: ["Slash-command block editor", "Tabs with deep links", "Per-page brand, fonts and cover"],
    href: "/features/page-builder",
    visual: "editor",
    alt: "The Dealbeam editor with a proposal split into Overview, Pricing, Timeline and Next steps tabs, a slash-command menu open, and the design panel beside it.",
  },
  {
    id: "send",
    label: "Send",
    kicker: "The buyer view",
    title: "One link,",
    titleAccent: "your brand, no login.",
    body:
      "Buyers open a plain URL in any browser. Add a password or an email gate when the room needs a door; hand each stakeholder a personal link when you need names.",
    bullets: ["No buyer account, ever", "Password and email gates", "Per-recipient tracking links"],
    href: "/features/sharing",
    visual: "buyer",
    alt: "A published Dealbeam deal page on the seller's brand: cover, tab bar, pricing table, an Approve button and a mutual action plan, with a share dialog beside it.",
  },
  {
    id: "read",
    label: "Read",
    kicker: "Buyer intelligence",
    title: "Watch the deal",
    titleAccent: "read itself.",
    body:
      "Who opened, which tab held them, how far they scrolled, when they went quiet. Only visible-tab time counts. Every visit is scored into intent.",
    bullets: ["Engagement score and intent per visitor", "Per-tab dwell and scroll depth", "Timeline, notifications, session replay"],
    href: "/features/analytics",
    visual: "analytics",
    alt: "Dealbeam buyer analytics: a visitor table with engagement scores and High Intent, Warm and Cold labels, per-tab section engagement bars and an activity timeline.",
  },
  {
    id: "close",
    label: "Close",
    kicker: "Action plans & deals",
    title: "A plan",
    titleAccent: "both sides can see.",
    body:
      "The mutual action plan lives on the page: owners, due dates, done. Behind it, a light pipeline shows what is open, what is stalled and what it is worth.",
    bullets: ["Mutual action plan on the page", "Custom pipeline stages", "Engagement rolled up per deal"],
    href: "/features/action-plans",
    visual: "pipeline",
    alt: "The Dealbeam deals board with New, Qualified, Proposal and Negotiation columns, deal cards showing value and buyer intent, and a mutual action plan checklist.",
  },
]

export interface Step {
  title: string
  body: string
}

/** How it works — three steps, in order. */
export const STEPS: Step[] = [
  {
    title: "Describe the deal.",
    body: "One line to AI Write, or the PDF you already have. It drafts the title, tabs, pricing and next steps. You cut it down to what is true.",
  },
  {
    title: "Send one link.",
    body: "Your brand, no attachment, no login. A password or an email gate when the room needs a door.",
  },
  {
    title: "Act on evidence.",
    body: "Reads, dwell time, scroll depth and intent arrive as they happen. Follow up when the buyer is on the page, not when the calendar says so.",
  },
]

export type BentoVisual =
  | "templates"
  | "synced"
  | "ai"
  | "gates"
  | "notify"
  | "replay"
  | "brand"
  | "attention"

export interface BentoItem {
  title: string
  body: string
  visual: BentoVisual
  /** Grid span hint: wide tiles take two columns on desktop. */
  wide?: boolean
}

/**
 * The details grid — small things, done properly. Spans are tuned for the
 * 4-column desktop grid: [2,1,1] [1,2,1] [2,2] fills three rows exactly.
 */
export const BENTO: BentoItem[] = [
  {
    title: "Templates",
    body: "Eight built-in pages — call recap, proposal, action plan, battle card, onboarding, QBR, one-pager, ROI study. Save your own for the team.",
    visual: "templates",
    wide: true,
  },
  {
    title: "Synced blocks",
    body: "Write the pricing table once. Every page that uses it updates when you do.",
    visual: "synced",
  },
  {
    title: "AI Write & import",
    body: "Describe the deal, or upload a PDF, DOCX or PPTX. A structured draft in minutes, metered by monthly credits.",
    visual: "ai",
  },
  {
    title: "Access gates",
    body: "Password, email gate, per-recipient links. A retired link shows a courteous notice, never a 404.",
    visual: "gates",
  },
  {
    title: "View notifications",
    body: "An email the moment a new visitor opens the page. Throttled, so it stays worth reading.",
    visual: "notify",
    wide: true,
  },
  {
    title: "True attention time",
    body: "Only visible-tab time counts. A page left open in a background tab earns nothing.",
    visual: "attention",
  },
  {
    title: "Session replay",
    body: "Opt-in recording of scroll and cursor, inputs masked, stored privately. See the read with your own eyes.",
    visual: "replay",
    wide: true,
  },
  {
    title: "Brand kit",
    body: "Colors, logo, fonts, corners — set once, inherited by every page. Hide our badge on Pro.",
    visual: "brand",
    wide: true,
  },
]

export interface LandingTemplate {
  title: string
  kind: string
  /** Monochrome cover treatment. */
  tone: "ink" | "dim" | "paper"
  tabs: string[]
}

/** The eight seeded templates (prisma/seed.ts), in the order they ship. */
export const LANDING_TEMPLATES: LandingTemplate[] = [
  { title: "Call Recap", kind: "Post-call", tone: "ink", tabs: ["Summary", "Next steps"] },
  { title: "Business Proposal", kind: "Proposal", tone: "paper", tabs: ["Overview", "Pricing", "Timeline"] },
  { title: "Mutual Action Plan", kind: "Deal room", tone: "dim", tabs: ["Plan", "Owners", "Dates"] },
  { title: "Competitor Battle Card", kind: "Deal room", tone: "paper", tabs: ["Compare", "Objections"] },
  { title: "Customer Onboarding", kind: "Onboarding", tone: "ink", tabs: ["Welcome", "Setup", "Contacts"] },
  { title: "Quarterly Business Review", kind: "Onboarding", tone: "dim", tabs: ["Results", "Roadmap"] },
  { title: "Executive One-Pager", kind: "Proposal", tone: "paper", tabs: ["Summary"] },
  { title: "ROI Case Study", kind: "Deal room", tone: "ink", tabs: ["Problem", "Result", "Numbers"] },
]

export interface LandingTenet {
  title: string
  body: string
}

export const LANDING_QUOTE = {
  text: "If it is not right, do not do it; if it is not true, do not say it.",
  source: "Marcus Aurelius — Meditations, XII.17",
}

export const LANDING_TENETS: LandingTenet[] = [
  {
    title: "Remove the unnecessary",
    body: "Every slide, attachment and follow-up is a tax on the buyer's attention. A deal page holds what is needed to decide, and nothing else.",
  },
  {
    title: "Control what you can",
    body: "You cannot control when a buyer reads. You can control what they find: one current page, in order, with a clear next step.",
  },
  {
    title: "Judge by evidence",
    body: "Opinions about deal health are guesses. The page shows what was read, by whom, for how long — so you act on what happened.",
  },
]

/**
 * Landing FAQ — written as direct, self-contained answers so search engines
 * and AI assistants can quote them verbatim (FAQPage structured data).
 */
export const LANDING_FAQ: FaqEntry[] = [
  {
    question: "What is Dealbeam?",
    answer:
      "Dealbeam is a sales-enablement tool that turns a proposal, its pricing and the next steps into one branded, trackable web page — a deal page — shared as a single link. The seller sees who opened it, which sections they read, how long they stayed and how engaged they are.",
  },
  {
    question: "Do my buyers need an account?",
    answer:
      "No. Buyers open a normal link in any browser. The only things you can ask of them are a password or an email address, and only if you turn those gates on.",
  },
  {
    question: "What can a deal page contain?",
    answer:
      "Rich text, headings and tables; pricing tables and metrics; embedded video, documents and calendars (YouTube, Vimeo, Loom, Google Docs, Airtable, Calendly); lead-capture forms; contact cards; testimonials; banners; and a mutual action plan. Content is split into tabs, each with its own link.",
  },
  {
    question: "What does Dealbeam track?",
    answer:
      "Opens, visible-tab time on the page and on each tab, scroll depth per section, CTA clicks, downloads, form submissions and shares. Visitors receive an engagement score and an intent label — High Intent, Warm or Cold. Session replay is available as an opt-in.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Free includes one deal page with up to three tabs, full analytics, AI Write with 20 credits a month and five open deals. Pro ($29/month) and Team ($79/month) are flat prices for the whole workspace, not per seat.",
  },
  {
    question: "Does Dealbeam integrate with my CRM?",
    answer:
      "Not yet. Dealbeam has a deliberately light pipeline of its own — stages, owners, close dates, comments — and rolls buyer engagement up per deal. There is no Salesforce or HubSpot sync today.",
  },
]

/** Feature list for the SoftwareApplication structured data. */
export const FEATURE_LIST_FOR_SCHEMA = [
  "Block-based deal page editor with tabs and deep links",
  "Branded public link, no buyer login",
  "Password protection and email gates",
  "Per-recipient tracking links",
  "Buyer intelligence: engagement score, intent, per-tab dwell, scroll depth",
  "Activity timeline and view notifications",
  "Opt-in session replay",
  "AI Write drafting and PDF/DOCX/PPTX import",
  "Mutual action plans",
  "Deals pipeline with custom stages",
  "Templates, synced blocks and team brand kit",
]
