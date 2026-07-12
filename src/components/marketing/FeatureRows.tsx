import Link from "next/link"
import { FEATURE_ROWS, indexLabel } from "@/data/marketing/landing"
import { BrowserFrame, FEATURE_VISUALS } from "./product-ui"
import ScrollReveal from "@/components/marketing/ScrollReveal"

const SERIF = "var(--font-serif), Georgia, serif"
const MONO = "var(--font-mk-mono), ui-monospace, monospace"

const URLS: Record<string, string> = {
  analytics: "app.dealbeam.com/analytics",
  editor: "app.dealbeam.com/editor",
  buyer: "acme.dealbeam.com/q3",
}

export default function FeatureRows() {
  return (
    <>
      <style>{`
        .mk-fr-row { display: grid; grid-template-columns: 1fr 1.15fr; gap: 56px; align-items: center; }
        .mk-fr-row.rev .mk-fr-copy { order: 2; }
        .mk-fr-row.rev .mk-fr-visual { order: 1; }
        @media (max-width: 900px) {
          .mk-fr-row { grid-template-columns: 1fr !important; gap: 28px !important; }
          .mk-fr-row.rev .mk-fr-copy { order: 1; }
          .mk-fr-row.rev .mk-fr-visual { order: 2; }
        }
      `}</style>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 104 }}>
        {FEATURE_ROWS.map((f, i) => {
          const Visual = FEATURE_VISUALS[f.visual]
          const reversed = i % 2 === 1
          return (
            <ScrollReveal key={f.visual} distance={26}>
              <div className={`mk-fr-row${reversed ? " rev" : ""}`}>
                <div className="mk-fr-copy" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>
                    {indexLabel(i + 1)} — {f.kicker}
                  </span>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(30px, 3.6vw, 46px)", lineHeight: 1.04, letterSpacing: "-0.02em", margin: 0 }}>
                    {f.title} <em>{f.titleAccent}</em>
                  </h3>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--db-text-secondary)", margin: 0, textWrap: "pretty" }}>{f.body}</p>
                  <Link href={f.href} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.04em", color: "var(--db-text)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Learn more <span aria-hidden>→</span>
                  </Link>
                </div>
                <div className="mk-fr-visual">
                  <BrowserFrame url={URLS[f.visual]} live={f.visual !== "editor"}>
                    <Visual />
                  </BrowserFrame>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </section>
    </>
  )
}
