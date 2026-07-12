import { LANDING_TENETS } from "@/data/marketing/landing"

/**
 * "Philosophy" — the page's full-bleed ink chapter. Inverted via the
 * accent/on-accent pair, so it reads black-on-light in light mode and
 * white-on-dark in dark mode.
 */

const INK_MUTED = "color-mix(in srgb, var(--db-on-accent) 62%, transparent)"
const INK_FAINT = "color-mix(in srgb, var(--db-on-accent) 38%, transparent)"
const INK_RULE = "color-mix(in srgb, var(--db-on-accent) 18%, transparent)"

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
          .mk-phil-tenet { border-left: none !important; padding-left: 0 !important; }
        }
      `}</style>
      <section
        id="philosophy"
        style={{ background: "var(--db-accent)", color: "var(--db-on-accent)" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px 96px" }}>
          <div
            className="mk-chapter"
            style={{ borderTop: `1px solid ${INK_RULE}` }}
          >
            <span className="mk-eyebrow" style={{ color: INK_FAINT }}>
              03 &mdash; Philosophy
            </span>
            <span className="mk-eyebrow" style={{ color: INK_FAINT }}>
              The deal is lost in the noise, not in the room
            </span>
          </div>

          <blockquote style={{ margin: 0, padding: "64px 0 72px", maxWidth: 880 }}>
            <p className="mk-phil-quote">
              &ldquo;If it is not right, do not do it; if it is not true, do
              not say it.&rdquo;
            </p>
            <footer className="mk-eyebrow" style={{ color: INK_FAINT, marginTop: 24 }}>
              Marcus Aurelius &mdash; Meditations, XII.17
            </footer>
          </blockquote>

          <div
            className="mk-phil-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 40,
              borderTop: `1px solid ${INK_RULE}`,
              paddingTop: 40,
            }}
          >
            {LANDING_TENETS.map((t, i) => (
              <div key={t.numeral} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="mk-eyebrow" style={{ color: INK_FAINT }}>
                  {String(i + 1).padStart(2, "0")}
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
                <span style={{ fontSize: 14, lineHeight: 1.65, color: INK_MUTED, textWrap: "pretty" }}>
                  {t.body}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
