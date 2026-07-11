/**
 * Dealbeam — Marketing Landing Page ("Website" design)
 *
 * Route: / (via the (marketing) route group)
 */

import Hero from "@/components/marketing/Hero"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureGrid from "@/components/marketing/FeatureGrid"
import PhilosophySection from "@/components/marketing/PhilosophySection"
import PricingSection from "@/components/marketing/PricingSection"
import FinalCTA from "@/components/marketing/FinalCTA"

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <PhilosophySection />
      <PricingSection />
      <FinalCTA />
    </>
  )
}
