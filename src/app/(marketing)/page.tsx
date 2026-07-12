/**
 * Dealbeam — Marketing Landing Page ("Website" design)
 *
 * Route: / (via the (marketing) route group)
 */

import Hero from "@/components/marketing/Hero"
import Ticker from "@/components/marketing/Ticker"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureIndex from "@/components/marketing/FeatureIndex"
import PhilosophySection from "@/components/marketing/PhilosophySection"
import PricingSection from "@/components/marketing/PricingSection"
import FinalCTA from "@/components/marketing/FinalCTA"

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Ticker />
      <HowItWorks />
      <FeatureIndex />
      <PhilosophySection />
      <PricingSection />
      <FinalCTA />
    </>
  )
}
