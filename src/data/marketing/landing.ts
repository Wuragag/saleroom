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
