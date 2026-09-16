/**
 * Dealbeam — marketing landing page (/).
 *
 * Product-forward, onepage-style structure in black and white: hero with the
 * dashboard, an interactive product tour, method, details grid, templates,
 * the stoic interlude, pricing, FAQ and a closing CTA. Structured data:
 * SoftwareApplication (with offers) + FAQPage; Organization + WebSite come
 * from the layout.
 */
import type { Metadata } from "next"
import Hero from "@/components/marketing/Hero"
import ProductSection from "@/components/marketing/ProductSection"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureBento from "@/components/marketing/FeatureBento"
import TemplateGallery from "@/components/marketing/TemplateGallery"
import PhilosophySection from "@/components/marketing/PhilosophySection"
import PricingSection from "@/components/marketing/PricingSection"
import FAQSection from "@/components/marketing/FAQSection"
import FinalCTA from "@/components/marketing/FinalCTA"
import JsonLd from "@/components/marketing/JsonLd"
import { FEATURE_LIST_FOR_SCHEMA, LANDING_FAQ } from "@/data/marketing/landing"
import { PRICING_TIERS } from "@/data/marketing/pricing"
import { faqJsonLd, softwareApplicationJsonLd } from "@/lib/seo"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function MarketingPage() {
  return (
    <>
      <JsonLd
        data={[
          softwareApplicationJsonLd({
            offers: PRICING_TIERS.map((t) => ({ name: t.name, priceMonthly: t.priceMonthly })),
            featureList: FEATURE_LIST_FOR_SCHEMA,
          }),
          faqJsonLd(LANDING_FAQ),
        ]}
      />
      <Hero />
      <ProductSection />
      <HowItWorks />
      <FeatureBento />
      <TemplateGallery />
      <PhilosophySection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </>
  )
}
