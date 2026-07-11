/**
 * Dealbeam — Marketing Landing Page
 *
 * Route: / (via the (marketing) route group)
 */

import HeroSection from "@/components/marketing/HeroSection"
import ProblemSection from "@/components/marketing/ProblemSection"
import ComparisonSection from "@/components/marketing/ComparisonSection"
import SolutionSection from "@/components/marketing/SolutionSection"
import AISection from "@/components/marketing/AISection"
import DemoSection from "@/components/marketing/DemoSection"
import SocialProofSection from "@/components/marketing/SocialProofSection"

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <ComparisonSection />
      <SolutionSection />
      <AISection />
      <DemoSection />
      <SocialProofSection />
    </>
  )
}
