import Image from "next/image"
import { LANDING_TENETS } from "@/data/marketing/landing"

const SERIF = "var(--font-serif), Georgia, serif"
const MONO = "var(--font-mk-mono), ui-monospace, monospace"

/**
 * Compact stoic interlude — a single inverted band: the framed Marcus Aurelius
 * plate beside the quote, with the three tenets as one-line footnotes. Keeps
 * the brand's voice without a wall of prose.
 */
export default function PhilosophySection() {
  return (
    <>
      <style>{`
        .mk-phil-plate img { object-fit: cover; object-position: 68% center; }
        .mk-phil-in { display: grid; grid-template-columns: 300px 1fr; gap: 48px; align-items: center; }
        @media (max-width: 860px) {
          .mk-phil-in { grid-template-columns: 1fr !important; gap: 28px !important; }
          .mk-phil-plate { max-width: 320px; }
          .mk-phil-tenets { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <section id="philosophy" className="mk-ink" style={{ background: "var(--db-accent)", color: "var(--db-on-accent)", margin: "104px 0 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px" }}>
          <div className="mk-phil-in">
            <div className="mk-phil-plate" style={{ position: "relative", aspectRatio: "5 / 6", border: "1px solid var(--db-ink-rule)", overflow: "hidden", borderRadius: 4 }}>
              <Image src="/redesign/aurelius.jpg" alt="Engraved portrait of Marcus Aurelius" fill sizes="(max-width:860px) 90vw, 300px" quality={60} className="mk-art-ink" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--db-ink-faint)" }}>Why it&rsquo;s built this way</span>
              <blockquote style={{ margin: 0 }}>
                <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(26px, 3.4vw, 40px)", lineHeight: 1.2, letterSpacing: "-0.01em", margin: 0, textWrap: "balance" }}>
                  &ldquo;If it is not right, do not do it; if it is not true, do not say it.&rdquo;
                </p>
                <footer style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: "var(--db-ink-faint)", marginTop: 18 }}>
                  Marcus Aurelius — Meditations, XII.17
                </footer>
              </blockquote>
              <div className="mk-phil-tenets" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, borderTop: "1px solid var(--db-ink-rule)", paddingTop: 22 }}>
                {LANDING_TENETS.map((t) => (
                  <div key={t.title}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--db-ink-muted)" }}>{t.body.split(".")[0]}.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
