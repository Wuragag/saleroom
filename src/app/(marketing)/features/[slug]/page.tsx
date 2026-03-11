import { notFound } from "next/navigation"
import Link from "next/link"
import { FEATURES } from "@/data/marketing/features"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import FeatureMockup from "@/components/marketing/FeatureMockups"
import ScrollReveal from "@/components/marketing/ScrollReveal"

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }))
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // Note: generateMetadata receives params as a Promise in Next.js 15
  return params.then(({ slug }) => {
    const feature = FEATURES.find((f) => f.slug === slug)
    if (!feature) return { title: "Feature — SalesRoom" }
    return {
      title: `${feature.title} — SalesRoom`,
      description: feature.description,
    }
  })
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const feature = FEATURES.find((f) => f.slug === slug)
  if (!feature) notFound()

  const featureIndex = FEATURES.findIndex((f) => f.slug === slug)
  const nextFeature = FEATURES[(featureIndex + 1) % FEATURES.length]

  return (
    <>
      <style>{`
        .sr-cta-pill {
          transition: opacity 150ms ease;
        }
        .sr-cta-pill:hover {
          opacity: 0.85;
        }
        .sr-next-link {
          transition: opacity 150ms ease;
        }
        .sr-next-link:hover {
          opacity: 0.6;
        }
        .sr-highlight-list li {
          padding: 16px 0;
          border-bottom: 1px solid var(--sr-border);
          font-family: var(--font-inter), sans-serif;
          font-size: 16px;
          color: var(--sr-text-secondary);
          line-height: 1.6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sr-highlight-list li::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sr-text);
          flex-shrink: 0;
        }
        .sr-feature-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .sr-feature-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>

      <PageHero
        label={feature.label}
        heading={feature.detailHeading}
        subtitle={feature.description}
      />

      {/* Visual mockup */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
          <FeatureMockup slug={slug} />
        </div>
      </section>

      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-feature-detail-grid">
            {/* Detail text */}
            <ScrollReveal>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 17,
                  color: "var(--sr-text-secondary)",
                  lineHeight: 1.8,
                  margin: "0 0 40px",
                }}
              >
                {feature.detailBody}
              </p>

              <Link
                href="/auth/signup"
                className="sr-cta-pill"
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  background: "var(--sr-text)",
                  color: "#FFFFFF",
                  borderRadius: 100,
                  padding: "14px 32px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Try it free
              </Link>
            </div>
            </ScrollReveal>

            {/* Highlights */}
            <ScrollReveal delay={120}>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--sr-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                Key capabilities
              </h3>
              <ul
                className="sr-highlight-list"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {feature.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Next feature */}
      <section
        style={{
          padding: "80px 0",
          borderTop: "1px solid var(--sr-border)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--sr-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            Next feature
          </p>
          <Link
            href={`/features/${nextFeature.slug}`}
            className="sr-next-link"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 32,
              fontWeight: 400,
              color: "var(--sr-text)",
              textDecoration: "none",
              lineHeight: 1.2,
            }}
          >
            {nextFeature.title} &rarr;
          </Link>
        </div>
      </section>

      <CTABanner
        heading="Ready to close deals"
        headingAccent="with confidence?"
        subtitle="Join 2,400+ account executives who know exactly what their buyers care about."
      />
    </>
  )
}
