/**
 * Legal identity used across the privacy documents. Everything marked TODO
 * must be completed by the company before the legal pages go live — these
 * are facts about the business that cannot be inferred from the codebase.
 */
import { APP_NAME } from "@/lib/constants"

export const LEGAL = {
  /** Public brand. */
  brand: APP_NAME,
  /** TODO: registered legal name of the operating company (controller / veri sorumlusu). */
  legalName: `${APP_NAME} [legal entity name — TODO]`,
  /** TODO: registered address. */
  address: "[Registered address — TODO]",
  /** TODO: country of establishment; drives the lead supervisory authority. */
  country: "[Country of establishment — TODO]",
  /** Privacy contact — TODO: confirm the mailbox exists and is monitored. */
  privacyEmail: "privacy@dealbeam.com",
  /** General support contact. */
  supportEmail: "support@dealbeam.com",
  /** TODO: name the EU representative (GDPR Art. 27) if not established in the EU, else leave empty. */
  euRepresentative: "",
  /** TODO: name the UK representative (UK GDPR Art. 27) if applicable, else leave empty. */
  ukRepresentative: "",
  /** TODO: KVKK — VERBİS registration number if the company is required to register. */
  verbisNo: "",
  /** Documents effective date (ISO). */
  effectiveDate: "2026-09-15",
  /** Site origin for absolute references. */
  site: "https://dealbeam.com",
}

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Cookies & storage", href: "/legal/cookies" },
  { label: "Data Processing Addendum", href: "/legal/dpa" },
  { label: "KVKK Aydınlatma Metni", href: "/legal/kvkk" },
  { label: "US state privacy notice", href: "/legal/privacy#us-state-privacy" },
]
