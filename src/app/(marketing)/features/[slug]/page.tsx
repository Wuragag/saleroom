import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { FEATURES } from "@/data/marketing/features"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import { ProductFrame } from "@/components/marketing/product-ui"
import ScrollReveal from "@/components/marketing/ScrollReveal"
import { pageTitle } from "@/lib/seo"

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const feature = FEATURES.find((f) => f.slug === slug)
  if (!feature) return { title: pageTitle("Feature") }
  const title = pageTitle(feature.title)
  return {
    title,
    description: feature.description,
    alternates: { canonical: `/features/${feature.slug}` },
    openGraph: { title, description: feature.description, url: `/features/${feature.slug}` },
  }
}

export default async function FeatureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const feature = FEATURES.find((f) => f.slug === slug)
  if (!feature) notFound()

  const featureIndex = FEATURES.findIndex((f) => f.slug === slug)
  const nextFeature = FEATURES[(featureIndex + 1) % FEATURES.length]

  return (
    <>
      <PageHero
        label={feature.label}
        heading={feature.detailHeading}
        subtitle={feature.description}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
          { name: feature.title, path: `/features/${feature.slug}` },
        ]}
      />

      <section aria-label={`${feature.title} in the product`} style={{ padding: "0 0 72px" }}>
        <div className="mk-container mk-enter-rise" style={{ ["--i" as string]: 3, maxWidth: 1040 }}>
          <ProductFrame visual={feature.visual} label={`${feature.title}: ${feature.description}`} />
        </div>
      </section>

      <section className="mk-section-tight" style={{ paddingTop: 0 }} aria-labelledby="detail-title">
        <div className="mk-container">
          <div className="mk-detail-grid">
            <ScrollReveal>
              <h2 id="detail-title" className="mk-h3" style={{ marginBottom: 18 }}>{feature.label}, in practice</h2>
              <p className="mk-body" style={{ fontSize: 16.5, lineHeight: 1.7, marginBottom: 32 }}>{feature.detailBody}</p>
              <Link href="/auth/signup" className="mk-cta mk-cta-lg">Try it free</Link>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <h2 className="mk-eyebrow" style={{ marginBottom: 8 }}>What is included</h2>
              <ul className="mk-list">{feature.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="mk-section-tight mk-rule" aria-label="Next feature">
        <div className="mk-container">
          <p className="mk-eyebrow" style={{ marginBottom: 14 }}>Next</p>
          <Link href={`/features/${nextFeature.slug}`} className="mk-h2 mk-underline" style={{ textDecoration: "none", display: "inline-block" }}>
            {nextFeature.title} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <CTABanner heading="Ready to see it on a real deal?" subtitle="Free until you need a second page. No credit card required." />
    </>
  )
}
