import { EXAMPLES } from "@/data/marketing/examples"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"

export const metadata = {
  title: "Examples — Dealbeam",
  description: "See real pages built with Dealbeam — proposals, onboarding guides, investor updates, and more.",
}

function ExampleCard({ title, category, description, tabs }: {
  title: string
  category: string
  description: string
  tabs: string[]
}) {
  return (
    <div
      className="sr-example-card"
      style={{
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      {/* Mini browser mockup */}
      <div style={{ borderBottom: "1px solid var(--db-border)" }}>
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {["#FF5F57", "#FFBD2E", "#28CA42"].map((color) => (
            <span
              key={color}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                opacity: 0.7,
              }}
            />
          ))}
          <span
            style={{
              flex: 1,
              marginLeft: 8,
              background: "var(--db-surface-dim)",
              borderRadius: 6,
              padding: "4px 12px",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              color: "var(--db-text-muted)",
            }}
          >
            dealbeam.app/p/...
          </span>
        </div>

        {/* Tabs preview */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--db-border)",
          }}
        >
          {tabs.map((tab, i) => (
            <div
              key={tab}
              style={{
                padding: "8px 14px",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                color: i === 0 ? "var(--db-text)" : "var(--db-text-muted)",
                fontWeight: i === 0 ? 600 : 400,
                borderBottom: i === 0 ? "2px solid var(--db-text)" : "2px solid transparent",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Content placeholder */}
        <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[100, 80, 90, 60].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w}%`,
                height: 6,
                borderRadius: 3,
                background: "var(--db-surface-dim)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Card info */}
      <div style={{ padding: "24px 24px 28px" }}>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--db-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          {category}
        </p>
        <h3
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--db-text)",
            lineHeight: 1.3,
            margin: "0 0 8px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 14,
            color: "var(--db-text-secondary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

export default function ExamplesPage() {
  return (
    <>
      <style>{`
        .sr-examples-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sr-example-card:hover {
          border-color: var(--db-border-hover) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        @media (max-width: 900px) {
          .sr-examples-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .sr-examples-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <PageHero
        label="Examples"
        heading="See what you can build"
        headingAccent="with Dealbeam"
        subtitle="Real page templates for proposals, onboarding, investor updates, and everything in between."
      />

      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-examples-grid">
            {EXAMPLES.map((ex, i) => (
              <ScrollReveal key={ex.title} delay={i * 80}>
                <ExampleCard {...ex} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        heading="Inspired?"
        headingAccent="Start creating your own."
        subtitle="Build your first page in under 5 minutes. Free forever, no credit card required."
      />
    </>
  )
}
