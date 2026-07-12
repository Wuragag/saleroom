/**
 * Dealbeam — Marketing Landing Page
 *
 * Route: / (via the (marketing) route group). Product-forward: a dashboard
 * hero, a template gallery, alternating visual feature rows, a compact stoic
 * interlude, pricing, and a closing CTA.
 */

import Hero from "@/components/marketing/Hero"
import TemplateGallery from "@/components/marketing/TemplateGallery"
import FeatureRows from "@/components/marketing/FeatureRows"
import PhilosophySection from "@/components/marketing/PhilosophySection"
import PricingSection from "@/components/marketing/PricingSection"
import FinalCTA from "@/components/marketing/FinalCTA"

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <TemplateGallery />
      <FeatureRows />
      <PhilosophySection />
      <PricingSection />
      <FinalCTA />
    </>
  )
}
