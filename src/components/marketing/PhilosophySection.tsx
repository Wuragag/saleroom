import { LANDING_TENETS, indexLabel } from "@/data/marketing/landing"
import ScrollReveal from "@/components/marketing/ScrollReveal"

/**
 * "Philosophy" — the page's full-bleed ink chapter. Inverted via the
 * accent/on-accent pair (mk-ink also flips ::selection), so it reads
 * black-on-light in light mode and white-on-dark in dark mode.
 */
export default function PhilosophySection() {
  return (
    <>
      <style>{`
        .mk-phil-quote {
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-style: italic;
          font-size: clamp(30px, 4.4vw, 52px);
          line-height: 1.18;
          letter-spacing: -0.015em;
          margin: 0;
          text-wrap: balance;
        }
        @media (max-width: 900px) {
          .mk-phil-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <section
        id="philosophy"
        className="mk-ink"
        style={{ background: "var(--db-accent)", color: "var(--db-on-accent)" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px 96px" }}>
          <div className="mk-chapter" style={{ borderTop: "1px solid var(--db-ink-rule)" }}>
            <span className="mk-eyebrow" style={{ color: "var(--db-ink-faint)" }}>
              03 &mdash; Philosophy
            </span>
            <h2 className="mk-eyebrow" style={{ color: "var(--db-ink-faint)", margin: 0 }}>
              The deal is lost in the noise, not in the room
            </h2>
          </div>

          <ScrollReveal>
            <blockquote style={{ margin: 0, padding: "64px 0 72px", maxWidth: 880 }}>
              <p className="mk-phil-quote">
                &ldquo;If it is not right, do not do it; if it is not true, do
                not say it.&rdquo;
              </p>
              <footer className="mk-eyebrow" style={{ color: "var(--db-ink-faint)", marginTop: 24 }}>
                Marcus Aurelius &mdash; Meditations, XII.17
              </footer>
            </blockquote>
          </ScrollReveal>

          <div
            className="mk-phil-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 40,
              borderTop: "1px solid var(--db-ink-rule)",
              paddingTop: 40,
            }}
          >
            {LANDING_TENETS.map((t, i) => (
              <ScrollReveal key={t.title} delay={i * 100}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <span className="mk-eyebrow" style={{ color: "var(--db-ink-faint)" }}>
                    {indexLabel(i)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: 24,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {t.title}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.65, color: "var(--db-ink-muted)", textWrap: "pretty" }}>
                    {t.body}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
