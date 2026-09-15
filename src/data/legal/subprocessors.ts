/**
 * Third parties that process personal data on Dealbeam's behalf. Verified
 * against the code: only services actually wired in appear here.
 */
export interface Subprocessor {
  name: string
  purpose: string
  data: string
  location: string
  /** Transfer mechanism outside the EU/UK/Türkiye. */
  transfer: string
}

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Neon (PostgreSQL)",
    purpose: "Primary database",
    data: "All account, page, contact, deal and buyer-analytics data, including session recordings.",
    location: "Region selected at deployment (EU or US)",
    transfer: "EU Standard Contractual Clauses / EU-US Data Privacy Framework where applicable",
  },
  {
    name: "Vercel",
    purpose: "Hosting, serverless functions, image optimisation, file storage (Vercel Blob)",
    data: "Request logs (IP address, user agent), uploaded logos, cover images and avatars.",
    location: "United States (edge network worldwide)",
    transfer: "EU Standard Contractual Clauses / EU-US Data Privacy Framework",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing",
    data: "Account holder name and email, workspace id, payment details (entered directly on Stripe, never stored by Dealbeam).",
    location: "United States / Ireland",
    transfer: "EU Standard Contractual Clauses / EU-US Data Privacy Framework",
  },
  {
    name: "Resend",
    purpose: "Transactional email",
    data: "Recipient email and name for password resets, team invitations, page-share emails sent on a seller's behalf, and view notifications to sellers.",
    location: "United States",
    transfer: "EU Standard Contractual Clauses / EU-US Data Privacy Framework",
  },
  {
    name: "Upstash (Redis)",
    purpose: "Rate limiting and throttling",
    data: "Short-lived counters keyed by IP address or email address; expire within minutes.",
    location: "Region selected at deployment",
    transfer: "EU Standard Contractual Clauses",
  },
  {
    name: "Anthropic",
    purpose: "AI Write and document import",
    data: "The seller's instructions, the page content being edited and the text of documents the seller uploads. Buyer analytics are never sent.",
    location: "United States",
    transfer: "EU Standard Contractual Clauses; inputs are not used to train models under Anthropic's commercial terms",
  },
  {
    name: "Google Fonts",
    purpose: "Web fonts on published buyer pages",
    data: "The browser's IP address and user agent when a published page loads a font the seller chose. The website and app self-host their fonts.",
    location: "United States (global CDN)",
    transfer: "Google's Standard Contractual Clauses",
  },
  {
    name: "Embedded content providers (YouTube, Vimeo, Loom, Google Docs, Airtable, Calendly)",
    purpose: "Embeds a seller places on a page",
    data: "Whatever the provider collects when its frame loads in your browser, under that provider's own policy. Only loaded on pages that contain such an embed.",
    location: "Provider-dependent",
    transfer: "Provider-dependent",
  },
]
