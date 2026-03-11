"use client"

const TESTIMONIALS = [
  {
    quote:
      "SalesRoom became my mutual action plan for every deal. When a new stakeholder joins, I send them the page. They're up to speed in 4 minutes.",
    name: "Jordan Lee",
    role: "Senior AE, Gong",
  },
  {
    quote:
      "Reactivated a $50k closed-lost deal. The VP spent over a minute on our page and booked from the calendar embed.",
    name: "Alex R.",
    role: "AE, Salesforce",
  },
  {
    quote:
      "I spend 70% less time on follow-up emails. One page, one link, done.",
    name: "Maria K.",
    role: "AE, HubSpot",
  },
]

export default function SocialProofSection() {
  return (
    <>
      <style>{`
        .sr-testimonial-card {
          padding: 36px;
          background: var(--sr-surface);
          border: 1px solid var(--sr-border);
          border-radius: 16px;
          transition: border-color 200ms ease;
        }
        .sr-testimonial-card:hover {
          border-color: var(--sr-border-hover);
        }

        @media (max-width: 860px) {
          .sr-testimonial-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sr-proof-h2 { font-size: 36px !important; }
          .sr-proof-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section className="sr-proof-section" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 64, maxWidth: 500 }}>
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
              What people say
            </p>
            <h2
              className="sr-proof-h2"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 48,
                fontWeight: 400,
                color: "var(--sr-text)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Real results from
              <br />
              <em>real AEs</em>
            </h2>
          </div>

          <div
            className="sr-testimonial-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="sr-testimonial-card">
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 15,
                    color: "var(--sr-text-secondary)",
                    lineHeight: 1.7,
                    margin: "0 0 24px",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--sr-text)",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 13,
                      color: "var(--sr-text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
