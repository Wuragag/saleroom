/**
 * Legal identity used across the privacy documents.
 *
 * The facts about the operating company cannot be inferred from the code, so
 * they are read from environment variables at build time (the legal pages
 * are static). Until they are set, the documents fall back to the brand name
 * and omit the address/country sentences rather than printing placeholders —
 * but note that GDPR Art. 13(1)(a) and KVKK Art. 10 require the controller's
 * identity and contact details, so set these before relying on the pages:
 *
 *   NEXT_PUBLIC_LEGAL_NAME      registered legal name of the operating company
 *   NEXT_PUBLIC_LEGAL_ADDRESS   registered address (one line)
 *   NEXT_PUBLIC_LEGAL_COUNTRY   country of establishment (governing law)
 *   NEXT_PUBLIC_LEGAL_EU_REP    EU representative (GDPR Art. 27), if any
 *   NEXT_PUBLIC_LEGAL_UK_REP    UK representative (UK GDPR Art. 27), if any
 *   NEXT_PUBLIC_LEGAL_VERBIS    KVKK VERBİS registration number, if required
 *   NEXT_PUBLIC_PRIVACY_EMAIL   monitored privacy mailbox (default below)
 *   NEXT_PUBLIC_SUPPORT_EMAIL   support mailbox (default below)
 */
import { APP_NAME } from "@/lib/constants"
import { SITE_URL } from "@/lib/seo"

const env = (key: string) => (process.env[key] ?? "").trim()

export const LEGAL = {
  /** Public brand. */
  brand: APP_NAME,
  /** Registered legal name; falls back to the brand until configured. */
  legalName: env("NEXT_PUBLIC_LEGAL_NAME") || APP_NAME,
  /** Registered address; empty until configured (sentences using it are omitted). */
  address: env("NEXT_PUBLIC_LEGAL_ADDRESS"),
  /** Country of establishment; empty until configured. */
  country: env("NEXT_PUBLIC_LEGAL_COUNTRY"),
  privacyEmail: env("NEXT_PUBLIC_PRIVACY_EMAIL") || "privacy@dealbeam.com",
  supportEmail: env("NEXT_PUBLIC_SUPPORT_EMAIL") || "support@dealbeam.com",
  euRepresentative: env("NEXT_PUBLIC_LEGAL_EU_REP"),
  ukRepresentative: env("NEXT_PUBLIC_LEGAL_UK_REP"),
  verbisNo: env("NEXT_PUBLIC_LEGAL_VERBIS"),
  /** Documents effective date (ISO). */
  effectiveDate: "2026-09-15",
  /** Site origin for absolute references. */
  site: SITE_URL,
}

/** "Registered address: …." or "" when not configured. */
export const ADDRESS_SENTENCE = LEGAL.address ? ` Registered address: ${LEGAL.address}.` : ""

/** Governing-law wording that stays valid before the country is configured. */
export const GOVERNING_LAW = LEGAL.country
  ? `the laws of ${LEGAL.country}, and its courts have jurisdiction`
  : `the laws of the country in which ${APP_NAME} is established, and its courts have jurisdiction`

/** Postal contact line for the KVKK application procedure. */
export const KVKK_ADDRESS_LINE = LEGAL.address
  ? `${LEGAL.address} adresine yazılı olarak (noter veya iadeli taahhütlü posta ile),`
  : `Veri sorumlusunun kayıtlı adresine yazılı olarak (noter veya iadeli taahhütlü posta ile),`

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Cookies & storage", href: "/legal/cookies" },
  { label: "Data Processing Addendum", href: "/legal/dpa" },
  { label: "KVKK Aydınlatma Metni", href: "/legal/kvkk" },
  { label: "US state privacy notice", href: "/legal/privacy#us-state-privacy" },
]
