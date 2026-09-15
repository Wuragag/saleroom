/**
 * Feature index + detail pages (/features, /features/[slug]).
 *
 * Everything listed here is built and documented in docs/FEATURES.md. Roadmap
 * items (CRM sync, Slack, SSO, webhooks) are deliberately absent — "if it is
 * not true, do not say it."
 */

/** Which product visual (src/components/marketing/product-ui.tsx) a feature renders. */
export type FeatureVisual = "editor" | "buyer" | "analytics" | "ai" | "dashboard" | "pipeline"

export interface Feature {
  slug: string
  title: string
  /** One-word chapter label ("Create", "Track", …). */
  label: string
  /** Index-card description (also the meta description). */
  description: string
  /** Detail-page H1. */
  detailHeading: string
  detailBody: string
  highlights: string[]
  visual: FeatureVisual
}

export const FEATURES: Feature[] = [
  {
    slug: "page-builder",
    title: "Page builder",
    label: "Write",
    description:
      "A block editor that turns a proposal into a page. Rich text, pricing tables, embeds, forms and metrics — split into tabs, each with its own link.",
    detailHeading: "A page, not a deck.",
    detailBody:
      "Type a slash to insert any block: headings, tables, pricing, video and calendar embeds, lead-capture forms, contact cards, testimonials, metrics and banners. Split the page into tabs — Overview, Pricing, Timeline, Next steps — and every tab gets a deep link a buyer can forward. Auto-save keeps the draft current; preview shows the page exactly as the buyer will see it.",
    highlights: [
      "Slash-command block editor (Tiptap)",
      "Tabs with per-tab deep links",
      "Embeds: YouTube, Vimeo, Loom, Google Docs, Airtable, Calendly",
      "Pricing tables, metrics, testimonials, contact cards, banners, forms",
      "Per-page branding: fonts, accent, cover, logo, layout width",
      "Auto-save, preview, duplicate, tags",
    ],
    visual: "editor",
  },
  {
    slug: "sharing",
    title: "Sharing & access",
    label: "Send",
    description:
      "One link on your brand. Add a password or an email gate, or hand each stakeholder a personal link so every read has a name.",
    detailHeading: "One link, your brand, no login.",
    detailBody:
      "Publish to a clean, readable URL. Buyers open it in any browser without an account. When the room needs a door, add a password (Pro) or an email gate; when you need names, share a per-recipient tracking link so engagement is attributed to a person, not an IP. A page that is unpublished or renamed shows a courteous 'link unavailable' screen rather than a 404.",
    highlights: [
      "Public link — buyers never sign up",
      "Password protection (Pro) and email gates",
      "Per-recipient tracking links",
      "Publish guard: warns about unfilled placeholders",
      "Hide the Dealbeam badge (Pro)",
      "Graceful 'link unavailable' page for retired links",
    ],
    visual: "buyer",
  },
  {
    slug: "analytics",
    title: "Buyer intelligence",
    label: "Read",
    description:
      "Who opened, which tab held them, how far they scrolled, when they went quiet. Every visit scored into intent.",
    detailHeading: "Watch the deal read itself.",
    detailBody:
      "Only visible-tab time counts, so the numbers mean what they say. Each visitor gets an engagement score and an intent label; expand a row to see dwell time and scroll depth per tab. A timeline lists every open, click and share in order. Turn on view notifications for an email the moment a new visitor arrives, or opt into session replay to watch a read unfold — inputs masked, stored privately.",
    highlights: [
      "True attention time (visible-tab only)",
      "Engagement score and intent label per visitor",
      "Per-tab dwell time and scroll depth",
      "Activity timeline: opens, clicks, shares, submissions",
      "View notifications by email, throttled",
      "Opt-in session replay with masked inputs",
    ],
    visual: "analytics",
  },
  {
    slug: "ai-content",
    title: "AI Write & import",
    label: "Draft",
    description:
      "Describe the deal in a line, or upload the PDF, DOCX or PPTX you already have. A structured, branded draft in minutes.",
    detailHeading: "A first draft in one line.",
    detailBody:
      "Tell AI Write what the deal is. It plans the buyer journey — title, hero, tabs, pricing, next steps, a call to action — and builds each tab into the live editor. Already have a document? Import a PDF, DOCX or PPTX and it becomes a page with the same structure. Generation runs in the background and is metered against a monthly credit pool, so a double click never costs twice.",
    highlights: [
      "Chat-driven drafting into the live editor",
      "Plans title, tabs, pricing and next steps",
      "Import PDF, DOCX and PPTX (up to 10 MB)",
      "Edit an existing page by chat",
      "Monthly AI credits on every plan",
    ],
    visual: "ai",
  },
  {
    slug: "action-plans",
    title: "Mutual action plans & deals",
    label: "Close",
    description:
      "A close plan both sides can see, and a light pipeline that shows what is open, what is stalled and what is worth.",
    detailHeading: "A plan both sides can see.",
    detailBody:
      "Put the mutual action plan on the page: ordered steps, an owner on each side, due dates and a target close. Buyers watch it move in real time. Behind it, a deliberately light pipeline — custom stages, owners, close dates, time in stage and team comments — rolls buyer engagement up from every linked room. Not a CRM, on purpose.",
    highlights: [
      "Mutual action plan on the buyer page",
      "Owner side, due date and completion per step",
      "Drag-and-drop pipeline with custom stages",
      "Deal-level engagement rollup and last activity",
      "Stakeholders, comments and time in stage",
    ],
    visual: "pipeline",
  },
  {
    slug: "collaboration",
    title: "Teams & brand",
    label: "Together",
    description:
      "A brand kit every page inherits, synced blocks that update everywhere, templates the whole team can use.",
    detailHeading: "One team, one source of truth.",
    detailBody:
      "Set the brand once — colors, logo, fonts, corners — and every new page inherits it. Write the pricing table as a synced block and each page that uses it updates when you do. Save any page as a team template. Team pages are visible to everyone; a member can lock a page while editing so nobody clobbers their work. Owners and members, nothing more elaborate.",
    highlights: [
      "Team brand kit with one-click apply",
      "Synced blocks: edit once, update everywhere",
      "Save as template, scoped to your team",
      "Team or private page visibility",
      "Edit locking against concurrent edits",
      "Flat pricing — no per-seat fees",
    ],
    visual: "dashboard",
  },
]
