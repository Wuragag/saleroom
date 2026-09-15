"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { HERO, LANDING_FACTS } from "@/data/marketing/landing"
import { BrowserFrame, DashboardVisual, VISUAL_URLS } from "./product-ui"

/**
 * Product-forward hero: headline + CTAs over a large dashboard mock in a
 * browser frame, with two floating "signal" chips that drift on scroll
 * (rAF parallax, off under prefers-reduced-motion).
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
        const y = Math.min(window.scrollY, 900)
        if (frameRef.current) frameRef.current.style.transform = `translateY(${y * -0.04}px)`
        if (chipARef.current) chipARef.current.style.transform = `translateY(${y * -0.12}px)`
        if (chipBRef.current) chipBRef.current.style.transform = `translateY(${y * -0.08}px)`
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="top" className="mk-hero" aria-labelledby="hero-title">
      <div className="mk-hero-grid" aria-hidden />
      <div className="mk-container">
        <div className="mk-hero-copy">
          <span className="mk-hero-badge mk-enter" style={{ ["--i" as string]: 0 }}><i aria-hidden />{HERO.eyebrow}</span>
          <h1 id="hero-title" className="mk-display mk-enter" style={{ ["--i" as string]: 1 }}>
            {HERO.titleLine1}{" "}<br />{HERO.titleLine2} <em>{HERO.titleAccent}</em>
          </h1>
          <p className="mk-lead mk-enter" style={{ ["--i" as string]: 2, maxWidth: 600 }}>{HERO.subtitle}</p>
          <div className="mk-hero-ctas mk-enter" style={{ ["--i" as string]: 3 }}>
            <Link href={HERO.primaryCta.href} className="mk-cta mk-cta-lg">{HERO.primaryCta.label}</Link>
            <Link href={HERO.secondaryCta.href} className="mk-cta-ghost mk-cta-lg">{HERO.secondaryCta.label} <span aria-hidden>↓</span></Link>
          </div>
          <p className="mk-small mk-enter" style={{ ["--i" as string]: 4 }}>{HERO.note}</p>
        </div>

        <div className="mk-hero-visual mk-enter-rise" style={{ ["--i" as string]: 4 }}>
          <div ref={frameRef} style={{ willChange: "transform" }}>
            <BrowserFrame
              url={VISUAL_URLS.dashboard}
              live
              label="The Dealbeam dashboard: a rail with Pages, Deals, Analytics, Submissions, Library and Settings; stat cards for total views, average time on page and live pages; and a grid of deal pages with view counts and Live or Draft status."
            >
              <DashboardVisual />
            </BrowserFrame>
          </div>

          <div ref={chipARef} className="mk-hero-chip" style={{ right: -22, top: 96 }} aria-hidden>
            <div className="mk-ui-panel" style={{ display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--db-shadow-3)", padding: "11px 15px", borderRadius: 12 }}>
              <span className="mk-ui-avatar ink" style={{ width: 28, height: 28, fontSize: 10 }}>MC</span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Maya Chen is reading</span>
                <span className="mk-ui-muted" style={{ fontSize: 10.5 }}>Pricing · 2m 10s · now</span>
              </span>
              <span style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 22, marginLeft: 6 }} data-wg="">
                {[0.4, 0.7, 0.5, 0.9, 0.65, 1, 0.8].map((h, i) => (
                  <span key={i} style={{ width: 3, height: `${h * 100}%`, borderRadius: 1, background: "var(--db-text)", transformOrigin: "bottom", animation: "mk-grow 2.6s ease-in-out infinite", animationDelay: `${i * 0.13}s` }} />
                ))}
              </span>
            </div>
          </div>

          <div ref={chipBRef} className="mk-hero-chip" style={{ left: -26, bottom: 72 }} aria-hidden>
            <div className="mk-ui-panel" style={{ boxShadow: "var(--db-shadow-3)", padding: 14, width: 190, borderRadius: 12 }}>
              <span className="mk-ui-label">Northwind · Q3</span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: "var(--mk-serif)", fontSize: 30, lineHeight: 1 }}>92</span>
                <span className="mk-ui-pill ink" style={{ fontSize: 9.5 }}>High Intent</span>
              </div>
              <div className="mk-ui-bar" style={{ marginTop: 10 }}><span data-wg="" style={{ width: "92%", animation: "mk-fill 1.6s var(--mk-ease) both" }} /></div>
              <div className="mk-ui-muted" style={{ fontSize: 10.5, marginTop: 6 }}>3 sessions · pricing viewed · CTA clicked</div>
            </div>
          </div>
        </div>

        <dl className="mk-facts">
          {LANDING_FACTS.map((m, i) => (
            <div key={m.label} className="mk-enter" style={{ ["--i" as string]: 6 + i }}>
              <dt className="mk-fact-value">{m.value}</dt>
              <dd className="mk-fact-label" style={{ margin: 0 }}>{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
