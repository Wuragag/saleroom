import Image from "next/image"
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
        .mk-phil-plate img { object-fit: cover; object-position: 72% center; }
        @media (max-width: 900px) {
          .mk-phil-grid { grid-template-columns: 1fr !important; }
          .mk-phil-lead { grid-template-columns: 1fr !important; }
          .mk-phil-plate { max-width: 420px; }
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

          <div
            className="mk-phil-lead"
            style={{
              display: "grid",
              gridTemplateColumns: "7fr 5fr",
              gap: 56,
              alignItems: "center",
              padding: "56px 0 64px",
            }}
          >
            <ScrollReveal>
              <blockquote style={{ margin: 0 }}>
                <p className="mk-phil-quote">
                  &ldquo;If it is not right, do not do it; if it is not true,
                  do not say it.&rdquo;
                </p>
                <footer className="mk-eyebrow" style={{ color: "var(--db-ink-faint)", marginTop: 24 }}>
                  Marcus Aurelius &mdash; Meditations, XII.17
                </footer>
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={140} distance={24}>
              <div
                className="mk-phil-plate"
                style={{
                  position: "relative",
                  aspectRatio: "5 / 4",
                  border: "1px solid var(--db-ink-rule)",
                  overflow: "hidden",
                }}
              >
                <Image
                  src="/redesign/aurelius.jpg"
                  alt="Engraved portrait of Marcus Aurelius"
                  fill
                  sizes="(max-width: 900px) 90vw, 440px"
                  quality={60}
                  className="mk-art-ink"
                />
                <span
                  className="mk-eyebrow"
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 10,
                    color: "var(--db-ink-faint)",
                  }}
                >
                  Fig. 03 &mdash; The examined deal
                </span>
              </div>
            </ScrollReveal>
          </div>

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
