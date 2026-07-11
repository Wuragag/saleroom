import { USE_CASES } from "@/data/marketing/use-cases"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"

export const metadata = {
  title: "Use Cases — Dealbeam",
  description: "See how teams use Dealbeam across proposals, onboarding, QBRs, and more.",
}

export default function UseCasesPage() {
  return (
    <>
      <style>{`
        .sr-usecase-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sr-usecase-card {
          padding: 36px;
          background: var(--db-surface);
          border: 1px solid var(--db-border);
          border-radius: 16px;
          transition: border-color 200ms ease;
        }
        .sr-usecase-card:hover {
          border-color: var(--db-border-hover);
        }
        @media (max-width: 900px) {
          .sr-usecase-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .sr-usecase-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <PageHero
        label="Use Cases"
        heading="One tool,"
        headingAccent="every revenue moment"
        subtitle="From first pitch to renewal, Dealbeam keeps your buyers engaged and your team informed."
      />

      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-usecase-grid">
            {USE_CASES.map((uc, i) => (
              <ScrollReveal key={uc.title} delay={i * 80}>
              <div className="sr-usecase-card">
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--db-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12,
                  }}
                >
                  {uc.audience}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: 24,
                    fontWeight: 400,
                    color: "var(--db-text)",
                    lineHeight: 1.2,
                    margin: "0 0 12px",
                  }}
                >
                  {uc.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 15,
                    color: "var(--db-text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {uc.description}
                </p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        heading="Find your use case?"
        headingAccent="Start building today."
        subtitle="Create your first page in under 5 minutes. No credit card required."
      />
    </>
  )
}
