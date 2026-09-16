import type { Metadata } from "next"
import { FEATURES } from "@/data/marketing/features"
import { PageHero, FeatureCard, CTABanner } from "@/components/marketing/shared"
import { ProductFrame } from "@/components/marketing/product-ui"
import ScrollReveal from "@/components/marketing/ScrollReveal"
import { pageTitle } from "@/lib/seo"

const DESCRIPTION = "Everything Dealbeam does, and nothing it doesn't: the page builder, sharing and access gates, buyer intelligence, AI Write and import, mutual action plans and deals, teams and brand."

export const metadata: Metadata = {
  title: pageTitle("Features"),
  description: DESCRIPTION,
  alternates: { canonical: "/features" },
  openGraph: { title: pageTitle("Features"), description: DESCRIPTION, url: "/features" },
}

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        label="Features"
        heading="Everything the deal needs."
        headingAccent="Nothing it doesn't."
        subtitle="Six surfaces, each documented and shipped. Pick one to see it in detail."
        crumbs={[{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]}
      />
      <section className="mk-section-tight" style={{ paddingTop: 8 }} aria-label="Feature list">
        <div className="mk-container">
          <div className="mk-grid-2">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.slug} delay={(i % 2) * 90} distance={18}>
                <FeatureCard
                  title={f.title}
                  description={f.description}
                  label={f.label}
                  href={`/features/${f.slug}`}
                  preview={<ProductFrame visual={f.visual} live={false} />}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <CTABanner
        heading="See it with your own deal."
        subtitle="Free until you need a second page. No credit card, no buyer login."
      />
    </>
  )
}
