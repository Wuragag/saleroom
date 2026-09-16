/**
 * SEO / GEO helpers for the public marketing site.
 *
 * Pure functions only (no React, no Next imports) so they are unit-testable
 * and usable from route handlers (sitemap, robots) and server components alike.
 *
 * GEO = generative-engine optimisation: the same structured data that helps
 * Google (Organization, SoftwareApplication, FAQPage, BreadcrumbList) is what
 * LLM crawlers use to answer "what is Dealbeam?" — so every builder here
 * favours plain, factual, self-contained statements.
 */
import { APP_NAME } from "@/lib/constants"

/** Canonical origin for the marketing site, without a trailing slash. */
export const SITE_URL = normalizeOrigin(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    process.env.NEXTAUTH_URL ||
    "https://dealbeam.com",
)

/** Optional public profiles for the Organization entity (comma-separated URLs in NEXT_PUBLIC_SOCIAL_LINKS). */
export const SOCIAL_LINKS = (process.env.NEXT_PUBLIC_SOCIAL_LINKS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => /^https?:\/\//.test(s))

/** One-line, factual product description reused in metadata and structured data. */
export const SITE_DESCRIPTION = `${APP_NAME} turns a proposal, its pricing and the next steps into one branded, trackable link — a deal page — and shows the seller exactly who read what, and for how long.`

/** Strip whitespace and any trailing slashes so joins are predictable. */
export function normalizeOrigin(input: string): string {
  return input.trim().replace(/\/+$/, "")
}

/** Absolute URL for a site-relative path ("/pricing" → "https://…/pricing"). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`
}

/**
 * Serialise JSON-LD for an inline <script>. `<` is escaped so untrusted text
 * can never close the script tag early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export interface FaqEntry {
  question: string
  answer: string
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: APP_NAME,
    alternateName: [`${APP_NAME} deal pages`, `${APP_NAME} digital sales room`],
    url: `${SITE_URL}/`,
    logo: absoluteUrl("/opengraph-image"),
    description: SITE_DESCRIPTION,
    // Disambiguation for answer engines: several unrelated products share the name.
    knowsAbout: ["deal pages", "digital sales rooms", "sales proposals", "mutual action plans", "buyer engagement analytics"],
    ...(SOCIAL_LINKS.length ? { sameAs: SOCIAL_LINKS } : {}),
  }
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: APP_NAME,
    url: `${SITE_URL}/`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  }
}

export interface SoftwareOffer {
  name: string
  /** Whole-dollar monthly price; 0 for the free plan. */
  priceMonthly: number
}

export function softwareApplicationJsonLd(opts: {
  offers: SoftwareOffer[]
  featureList: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: APP_NAME,
    url: `${SITE_URL}/`,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sales enablement",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    featureList: opts.featureList,
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: opts.offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.priceMonthly,
      priceCurrency: "USD",
      url: absoluteUrl("/pricing"),
      ...(o.priceMonthly > 0
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: o.priceMonthly,
              priceCurrency: "USD",
              billingDuration: "P1M",
              unitText: "MONTH",
            },
          }
        : {}),
    })),
  }
}

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  }
}

export interface Crumb {
  name: string
  /** Site-relative path, e.g. "/features". */
  path: string
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}

/**
 * Per-page <title>. The brand goes last so the page's own words lead in
 * search snippets; the root layout's template is deliberately not used
 * because a few pages (home) carry a slogan instead of a section name.
 */
export function pageTitle(section?: string): string {
  return section ? `${section} — ${APP_NAME}` : APP_NAME
}
