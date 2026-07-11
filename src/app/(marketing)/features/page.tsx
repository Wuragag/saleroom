import { FEATURES } from "@/data/marketing/features"
import { PageHero, FeatureCard, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"

export const metadata = {
  title: "Features — Dealbeam",
  description: "Everything you need to create, share, and track winning proposals.",
}

export default function FeaturesPage() {
  return (
    <>
      <style>{`
        .sr-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sr-feature-card:hover {
          border-color: var(--db-border-hover) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        @media (max-width: 900px) {
          .sr-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .sr-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <PageHero
        label="Features"
        heading="Everything you need to"
        headingAccent="close with confidence"
        subtitle="From building beautiful proposals to tracking every buyer interaction — Dealbeam gives you the tools to win."
      />

      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-features-grid">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.slug} delay={i * 80}>
                <FeatureCard
                  title={f.title}
                  description={f.description}
                  label={f.label}
                  href={`/features/${f.slug}`}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        heading="Ready to win more deals"
        headingAccent="with less effort?"
        subtitle="Join 2,400+ account executives who close with confidence."
      />
    </>
  )
}
