import Link from "next/link"
import { LANDING_TEMPLATES } from "@/data/marketing/landing"

const SERIF = "var(--font-serif), Georgia, serif"
const MONO = "var(--font-mk-mono), ui-monospace, monospace"

/** A single deal-page cover card (coloured header + mini page body). */
function CoverCard({ title, kind, from, to }: { title: string; kind: string; from: string; to: string }) {
  return (
    <div className="mk-tpl-card" style={{ width: 236, flexShrink: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--db-border)", background: "var(--db-surface)", boxShadow: "var(--db-shadow-1)" }}>
      <div style={{ height: 118, background: `linear-gradient(130deg, var(${from}), var(${to}))`, position: "relative", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>{kind}</span>
        <span style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.15, color: "#fff", letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {[92, 78, 64].map((w, i) => (
          <span key={i} style={{ height: 6, borderRadius: 3, width: `${w}%`, background: "var(--db-surface-dim)" }} />
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: "var(--db-text-muted)" }}>Use template</span>
          <span style={{ color: "var(--db-text-muted)" }}>→</span>
        </div>
      </div>
    </div>
  )
}

export default function TemplateGallery() {
  // duplicated set for a seamless -50% marquee that never runs dry
  const track = [...LANDING_TEMPLATES, ...LANDING_TEMPLATES]
  return (
    <>
      <style>{`
        .mk-tpl-marquee:hover .mk-tpl-track { animation-play-state: paused; }
        .mk-tpl-card { transition: transform .2s ease, box-shadow .2s ease; }
        .mk-tpl-card:hover { transform: translateY(-4px); box-shadow: var(--db-shadow-2); }
        @media (prefers-reduced-motion: reduce) { .mk-tpl-track { animation: none !important; } }
      `}</style>
      <section style={{ padding: "72px 0 88px", borderTop: "1px solid var(--db-border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>01 — Templates</span>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(30px, 4vw, 44px)", letterSpacing: "-0.015em", lineHeight: 1.05, margin: "10px 0 0" }}>
              Start from a <em>proven page</em>.
            </h2>
          </div>
          <Link href="/examples" className="mk-plan-link" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--db-text-secondary)", textDecoration: "none", whiteSpace: "nowrap" }}>
            Browse all →
          </Link>
        </div>
        <div className="mk-tpl-marquee" style={{ overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)", maskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)" }}>
          <div className="mk-tpl-track" style={{ display: "flex", gap: 18, width: "max-content", padding: "0 24px", animation: "wg-marquee 46s linear infinite" }}>
            {track.map((t, i) => (
              <CoverCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
