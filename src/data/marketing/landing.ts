/**
 * Landing-page copy — from the "Website" design (Claude Design handoff).
 *
 * Pure data so the sections in src/components/marketing/ stay presentational.
 */

export interface LandingStep {
  numeral: string
  title: string
  body: string
  /** Which CSS-drawn product mock the strip renders for this step. */
  mock: "assemble" | "send" | "observe" | "close"
  shotTitle: string
  shotCaption: string
}

export const LANDING_STEPS: LandingStep[] = [
  {
    numeral: "I",
    title: "Assemble",
    body: "Drop in proposal, pricing and files. AI Write drafts; you cut.",
    mock: "assemble",
    shotTitle: "Start from your notes.",
    shotCaption: "AI Write drafts the page; you keep what is true.",
  },
  {
    numeral: "II",
    title: "Send",
    body: "One link. No attachments, no decks, no versions.",
    mock: "send",
    shotTitle: "What the buyer sees.",
    shotCaption: "One current page, in order, with a clear next step.",
  },
  {
    numeral: "III",
    title: "Observe",
    body: "See who read what, and for how long.",
    mock: "observe",
    shotTitle: "Judge by evidence.",
    shotCaption: "Reads, time on section, and drop-off — per recipient.",
  },
  {
    numeral: "IV",
    title: "Close",
    body: "Approvals and signatures happen on the page.",
    mock: "close",
    shotTitle: "Every deal, in order.",
    shotCaption: "Pages, analytics and activity in one place.",
  },
]

export interface LandingFeature {
  /** SVG path (20×20 viewBox, stroked). */
  iconPath: string
  title: string
  body: string
  stat: string
  /** Which animated wireframe graphic the card shows. */
  graphic: "page" | "bars" | "type" | "pulse" | "marquee"
  /** Bento placement on the 4-column desktop grid. */
  span: "tall" | "wide" | "single" | "banner"
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    iconPath: "M4 3h12v14H4zM7.5 7.5h5M7.5 10.5h5",
    title: "One page per deal",
    body: "Proposal, pricing, timeline and files — assembled in minutes, shared as a single link.",
    stat: "4 min",
    graphic: "page",
    span: "tall",
  },
  {
    iconPath: "M4 16V10M10 16V4M16 16V8",
    title: "Buyer analytics",
    body: "Who opened, what they read, how long they stayed. Signal, not vanity metrics.",
    stat: "100%",
    graphic: "bars",
    span: "wide",
  },
  {
    iconPath: "M10 3l1.8 4.2L16 9l-4.2 1.8L10 15l-1.8-4.2L4 9l4.2-1.8z",
    title: "AI Write",
    body: "Drafts the first version from your notes. You cut it down to what is true.",
    stat: "AI",
    graphic: "type",
    span: "single",
  },
  {
    iconPath: "M10 4a6 6 0 1 0 6 6M13 3l4 4-4 0z",
    title: "Always current",
    body: "Edit once; every recipient sees the latest. No v7_final_FINAL.pdf.",
    stat: "Live",
    graphic: "pulse",
    span: "single",
  },
  {
    iconPath: "M5 10l3.5 3.5L15 6",
    title: "Your brand, quietly",
    body: "Your logo, your domain, no badge of ours. The work speaks; we stay silent.",
    stat: "∞",
    graphic: "marquee",
    span: "banner",
  },
]

/** Example custom domains scrolled through the "Your brand, quietly" marquee. */
export const MARQUEE_DOMAINS = [
  "acme.deal",
  "proposal.northwind.co",
  "offer.contoso.com",
  "deal.globex.io",
  "terms.initech.com",
]

export interface LandingTenet {
  numeral: string
  title: string
  body: string
}

export const LANDING_TENETS: LandingTenet[] = [
  {
    numeral: "I",
    title: "Remove the unnecessary",
    body: "Every deck slide, attachment and follow-up email is a tax on your buyer’s attention. A deal page holds only what is needed to decide — and nothing that is not.",
  },
  {
    numeral: "II",
    title: "Control what you can",
    body: "You cannot control when a buyer reads. You can control what they find when they do: one current page, in order, with a clear next step.",
  },
  {
    numeral: "III",
    title: "Judge by evidence",
    body: "Opinions about deal health are guesses. Page analytics show what was read, by whom, and for how long — so you act on what happened, not what you hope.",
  },
]
