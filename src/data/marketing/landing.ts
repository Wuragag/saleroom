/**
 * Landing-page copy — from the "Website" design (Claude Design handoff).
 *
 * Pure data so the sections in src/components/marketing/ stay presentational.
 */

/** "01", "02", … — the chapter/index numbering used across the landing page. */
export function indexLabel(i: number): string {
  return String(i + 1).padStart(2, "0")
}

/** Compact metric strip under the hero. */
export const LANDING_METRICS = [
  { value: "4 min", label: "to a sent page" },
  { value: "18k+", label: "buyer sessions read" },
  { value: "100%", label: "of reads, tracked" },
  { value: "$0", label: "to your first close" },
]

export interface LandingTemplate {
  title: string
  kind: string
  /** two-stop cover gradient (CSS var names) */
  from: string
  to: string
}

/** Cover cards for the "Start from a proven page" gallery. */
export const LANDING_TEMPLATES: LandingTemplate[] = [
  { title: "Q3 Partnership Proposal", kind: "Proposal", from: "--mk-indigo", to: "--mk-violet" },
  { title: "Mutual Action Plan", kind: "MAP", from: "--mk-sky", to: "--mk-cyan" },
  { title: "Onboarding Hub", kind: "Onboarding", from: "--mk-emerald", to: "--mk-cyan" },
  { title: "Renewal & Expansion", kind: "Renewal", from: "--mk-amber", to: "--mk-rose" },
  { title: "Executive Sales Deck", kind: "Deck", from: "--mk-rose", to: "--mk-violet" },
  { title: "Security & Legal Room", kind: "Vault", from: "--mk-violet", to: "--mk-indigo" },
]

export interface FeatureRow {
  kicker: string
  title: string
  titleAccent: string
  body: string
  href: string
  /** which product visual the row renders */
  visual: "analytics" | "editor" | "buyer"
}

/** Alternating visual feature rows. */
export const FEATURE_ROWS: FeatureRow[] = [
  {
    kicker: "Buyer analytics",
    title: "Watch the deal",
    titleAccent: "read itself.",
    body: "Who opened, which section held them, when they went quiet. Every read scored into intent — signal, not vanity metrics.",
    href: "/features/analytics",
    visual: "analytics",
  },
  {
    kicker: "AI Write",
    title: "A first draft",
    titleAccent: "in one line.",
    body: "Describe the deal; AI Write assembles proposal, pricing and next steps. You cut it down to what is true.",
    href: "/features/ai-content",
    visual: "editor",
  },
  {
    kicker: "The buyer view",
    title: "One link,",
    titleAccent: "always current.",
    body: "Your brand, your domain, no badge of ours. Approvals and signatures happen on the page — never a stale attachment.",
    href: "/features/page-builder",
    visual: "buyer",
  },
]

export interface LandingTenet {
  title: string
  body: string
}

export const LANDING_TENETS: LandingTenet[] = [
  {
    title: "Remove the unnecessary",
    body: "Every deck slide, attachment and follow-up email is a tax on your buyer’s attention. A deal page holds only what is needed to decide — and nothing that is not.",
  },
  {
    title: "Control what you can",
    body: "You cannot control when a buyer reads. You can control what they find when they do: one current page, in order, with a clear next step.",
  },
  {
    title: "Judge by evidence",
    body: "Opinions about deal health are guesses. Page analytics show what was read, by whom, and for how long — so you act on what happened, not what you hope.",
  },
]
