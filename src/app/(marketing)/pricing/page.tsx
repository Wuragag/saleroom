import type { Metadata } from "next"
import { FAQ as PRICING_FAQ } from "@/data/marketing/pricing"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import PricingSection from "@/components/marketing/PricingSection"
import FAQ from "@/components/marketing/FAQ"
import JsonLd from "@/components/marketing/JsonLd"
import { faqJsonLd, pageTitle } from "@/lib/seo"

const DESCRIPTION = "Dealbeam pricing: Free forever for one deal page, Pro at $29/month and Team at $79/month. Flat prices for the whole workspace — nothing per seat."

export const metadata: Metadata = {
  title: pageTitle("Pricing"),
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { title: pageTitle("Pricing"), description: DESCRIPTION, url: "/pricing" },
}

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(PRICING_FAQ)} />
      <PageHero
        label="Pricing"
        heading="Three plans."
        headingAccent="No tiers of tiers."
        subtitle="Start free. Pay a flat price when the second deal needs a page. Nothing is counted per seat."
        crumbs={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]}
      />
      <PricingSection chapter={false} />
      <section className="mk-section-tight" aria-labelledby="pricing-faq-title">
        <div className="mk-container">
          <div className="mk-detail-grid faq">
            <div>
              <span className="mk-eyebrow">Questions</span>
              <h2 id="pricing-faq-title" className="mk-h2" style={{ marginTop: 16 }}>Terms, <em>plainly.</em></h2>
            </div>
            <FAQ entries={PRICING_FAQ} />
          </div>
        </div>
      </section>
      <CTABanner heading="Start with one page." headingAccent="Pay when you need two." subtitle="No credit card required. Upgrade or cancel from Settings at any time." />
    </>
  )
}
