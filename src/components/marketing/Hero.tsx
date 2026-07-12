"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { BrowserFrame, DashboardVisual } from "./product-ui"
import { LANDING_METRICS } from "@/data/marketing/landing"

const MONO = "var(--font-mk-mono), ui-monospace, monospace"

/**
 * Product-forward hero: compact headline + CTA over a large, colourful
 * dashboard mock in a browser frame, with two floating UI chips that drift on
 * scroll (rAF parallax, disabled for prefers-reduced-motion).
 */
export default function Hero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const chipARef = useRef<HTMLDivElement>(null)
  const chipBRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (frameRef.current) frameRef.current.style.transform = `translateY(${y * -0.03}px)`
        if (chipARef.current) chipARef.current.style.transform = `translateY(${y * -0.11}px)`
        if (chipBRef.current) chipBRef.current.style.transform = `translateY(${y * -0.07}px)`
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <style>{`
        @keyframes mk-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .mk-hero-fade { opacity: 0; animation: mk-fade-up .6s cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) { .mk-hero-fade { animation: none; opacity: 1; } }
        .mk-hero-h1 {
          font-family: var(--font-serif), Georgia, serif; font-weight: 400;
          font-size: clamp(40px, 6.4vw, 82px); line-height: 1.0; letter-spacing: -0.02em;
          margin: 0; text-wrap: balance;
        }
        .mk-hero-chip { position: absolute; z-index: 3; will-change: transform; }
        @media (max-width: 820px) {
          .mk-hero-chip { display: none !important; }
          .mk-dash-side { display: none !important; }
          .mk-dash-grid { grid-template-columns: 1fr !important; }
          .mk-dash-stats { grid-template-columns: 1fr 1fr !important; }
          .mk-metrics { gap: 20px 28px !important; }
        }
      `}</style>

      <section id="top" style={{ position: "relative", overflow: "hidden", padding: "72px 24px 40px" }}>
        {/* colour glow */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "var(--mk-glow)", pointerEvents: "none" }} />

        <div className="mk-hero-fade" style={{ position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--db-text-secondary)", background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 999, padding: "6px 14px", boxShadow: "var(--db-shadow-1)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mk-emerald)" }} />
            Deal pages that read themselves
          </span>
          <h1 className="mk-hero-h1">
            One page. Every deal,<br /><em>in order</em>.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--db-text-secondary)", maxWidth: 540, margin: 0, textWrap: "pretty" }}>
            Proposal, pricing and next steps become one link your buyer actually
            reads — and you see every read as it happens.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/auth/signup" className="mk-cta mk-cta-lg">Create your page</Link>
            <Link href="#product" style={{ fontFamily: MONO, fontSize: 13, color: "var(--db-text-secondary)", textDecoration: "none", padding: "12px 8px" }}>
              See it working ↓
            </Link>
          </div>
        </div>

        {/* product frame + floating chips */}
        <div className="mk-hero-fade" id="product" style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "48px auto 0", animationDelay: ".12s" }}>
          <div ref={frameRef} style={{ willChange: "transform" }}>
            <BrowserFrame url="app.dealbeam.com/pages" live>
              <DashboardVisual />
            </BrowserFrame>
          </div>

          <div ref={chipARef} className="mk-hero-chip" style={{ right: -14, top: 92 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 12, boxShadow: "var(--db-shadow-3)", padding: "11px 15px" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: "color-mix(in srgb, var(--mk-emerald) 20%, var(--db-surface))", color: "var(--mk-emerald)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>Acme signed <strong style={{ fontWeight: 600 }}>Q3</strong></span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--db-text-muted)" }}>now</span>
            </div>
          </div>

          <div ref={chipBRef} className="mk-hero-chip" style={{ left: -18, bottom: 64 }}>
            <div style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 12, boxShadow: "var(--db-shadow-3)", padding: 14, width: 178 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>Reading now</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "color-mix(in srgb, var(--mk-violet) 22%, var(--db-surface))", color: "var(--mk-violet)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600 }}>MC</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Maya Chen</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 26, marginTop: 10 }}>
                {[0.4, 0.7, 0.5, 0.9, 0.65, 1, 0.8].map((h, i) => (
                  <span key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 1, background: "var(--mk-violet)", opacity: 0.85, transformOrigin: "bottom", animation: "wg-grow 2.6s ease-in-out infinite", animationDelay: `${i * 0.13}s` }} data-wg="" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* metric strip */}
        <div className="mk-metrics" style={{ position: "relative", zIndex: 2, maxWidth: 900, margin: "48px auto 0", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px 56px", borderTop: "1px solid var(--db-border)", paddingTop: 28 }}>
          {LANDING_METRICS.map((m) => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 30, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.04em", color: "var(--db-text-muted)", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
