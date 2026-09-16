import type { Metadata } from "next"
import { USE_CASES } from "@/data/marketing/use-cases"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"
import { pageTitle } from "@/lib/seo"

const DESCRIPTION = "How teams use Dealbeam deal pages: sales proposals, mutual action plans, customer onboarding, quarterly business reviews, partnership proposals and investor updates."

export const metadata: Metadata = {
  title: pageTitle("Use cases"),
  description: DESCRIPTION,
  alternates: { canonical: "/use-cases" },
  openGraph: { title: pageTitle("Use cases"), description: DESCRIPTION, url: "/use-cases" },
}

export default function UseCasesPage() {
  return (
    <>
      <PageHero
        label="Use cases"
        heading="One tool,"
        headingAccent="every revenue moment."
        subtitle="From first pitch to renewal, the same page keeps the buyer informed and the seller honest."
        crumbs={[{ name: "Home", path: "/" }, { name: "Use cases", path: "/use-cases" }]}
      />
      <section className="mk-section-tight" style={{ paddingTop: 8 }} aria-label="Use cases">
        <div className="mk-container">
          <div className="mk-grid-3">
            {USE_CASES.map((uc, i) => (
              <ScrollReveal key={uc.title} as="article" className="mk-card mk-card-hover" delay={(i % 3) * 80} distance={18} style={{ padding: "30px 30px 32px" }}>
                <p className="mk-eyebrow" style={{ margin: "0 0 12px" }}>{uc.audience}</p>
                <h2 className="mk-h3" style={{ fontSize: 24, marginBottom: 10 }}>{uc.title}</h2>
                <p className="mk-body" style={{ fontSize: 14.5 }}>{uc.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <CTABanner heading="Found yours?" headingAccent="Build it today." subtitle="Your first page is free. No credit card required." />
    </>
  )
}
