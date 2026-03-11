"use client"

const FEATURES = [
  {
    number: "01",
    title: "One link, not six",
    description:
      "Combine your deck, case study, pricing, and demo recording into one beautiful page. Share a single link instead of a wall of attachments.",
  },
  {
    number: "02",
    title: "Real-time engagement",
    description:
      "Get notified the moment your buyer opens your page. See which sections they spend time on and when they share it internally.",
  },
  {
    number: "03",
    title: "Follow up with confidence",
    description:
      "No more guessing. Know exactly what interests your buyer before your next call. Time your follow-up perfectly.",
  },
]

export default function ProblemSection() {
  return (
    <>
      <style>{`
        .sr-feature-card {
          padding: 40px 0;
          border-bottom: 1px solid var(--sr-border);
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 0;
          align-items: start;
        }
        .sr-feature-card:first-child {
          border-top: 1px solid var(--sr-border);
        }

        @media (max-width: 640px) {
          .sr-feature-card { grid-template-columns: 1fr !important; gap: 8px !important; }
          .sr-features-h2 { font-size: 36px !important; }
          .sr-features-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section
        id="features"
        className="sr-features-section"
        style={{ padding: "120px 0" }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          {/* Section heading */}
          <div style={{ marginBottom: 64 }}>
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
              Why SalesRoom
            </p>
            <h2
              className="sr-features-h2"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 48,
                fontWeight: 400,
                color: "var(--sr-text)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Deals don&apos;t die on calls.
              <br />
              <em>They die between them.</em>
            </h2>
          </div>

          {/* Feature list */}
          {FEATURES.map((feature) => (
            <div key={feature.number} className="sr-feature-card">
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--sr-text-muted)",
                }}
              >
                {feature.number}
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--sr-text)",
                    margin: "0 0 12px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 16,
                    fontWeight: 400,
                    color: "var(--sr-text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 480,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
