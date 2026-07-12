"use client"

import { useEffect, useRef } from "react"

/**
 * Hero product visual: a browser-framed deal page with floating engagement
 * panels, drifting at different rates on scroll (disabled for
 * prefers-reduced-motion). All chrome is drawn from the --db-* palette so it
 * follows the light/dark theme.
 */

const SERIF = "var(--font-serif), Georgia, serif"

function Rule() {
  return <div style={{ borderTop: "1px solid var(--db-border)" }} />
}

export default function HeroVisual() {
  const frameRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (frameRef.current) frameRef.current.style.transform = `translateY(${y * -0.02}px)`
        if (panelRef.current) panelRef.current.style.transform = `translateY(${y * -0.09}px)`
        if (toastRef.current) toastRef.current.style.transform = `translateY(${y * -0.055}px)`
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
    <>
      <style>{`
        @keyframes mk-hv-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mk-hv-in { opacity: 0; animation: mk-hv-up .7s cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .mk-hv-in { animation: none; opacity: 1; }
        }
        @media (max-width: 900px) {
          .mk-hv-float { display: none !important; }
          .mk-hv-frame { width: 100% !important; }
          .mk-hv-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ position: "relative", maxWidth: 1120, margin: "56px auto 0", padding: "0 24px" }}>
        {/* ── the deal page, in a browser frame ── */}
        <div
          className="mk-hv-in"
          style={{ animationDelay: ".12s" }}
        >
          <div
            ref={frameRef}
            className="mk-hv-frame"
            style={{
              width: "78%",
              margin: "0 auto",
              background: "var(--db-surface)",
              border: "1px solid var(--db-border)",
              borderRadius: 10,
              boxShadow: "var(--db-shadow-2)",
              overflow: "hidden",
              willChange: "transform",
            }}
          >
            {/* browser bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderBottom: "1px solid var(--db-border)",
              }}
            >
              <span style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--db-border-hover)" }} />
                ))}
              </span>
              <span
                className="mk-eyebrow"
                style={{
                  flex: 1,
                  maxWidth: 340,
                  margin: "0 auto",
                  textAlign: "center",
                  textTransform: "none",
                  letterSpacing: "0.02em",
                  background: "var(--db-surface-dim)",
                  borderRadius: 999,
                  padding: "5px 16px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                acme.dealbeam.com/q3-proposal
              </span>
              <span className="mk-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ position: "relative", width: 6, height: 6 }}>
                  <span
                    data-wg=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "1px solid var(--db-text)",
                      animation: "wg-pulse 2.4s ease-out infinite",
                    }}
                  />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--db-text)" }} />
                </span>
                Live
              </span>
            </div>

            {/* page body */}
            <div style={{ padding: "30px 36px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: "var(--db-cta-grad)",
                      color: "var(--db-on-accent)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    A
                  </span>
                  <span className="mk-eyebrow" style={{ color: "var(--db-text-secondary)" }}>
                    Acme &times; Northwind
                  </span>
                </span>
                <span className="mk-eyebrow">Valid until Aug 15</span>
              </div>

              <div style={{ fontFamily: SERIF, fontSize: 30, letterSpacing: "-0.015em", lineHeight: 1.1 }}>
                Q3 Partnership Proposal
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--db-text-secondary)", maxWidth: 560 }}>
                Scope, pricing and rollout for the Q3 expansion — everything
                needed to decide, on one page. Questions land in the thread,
                approvals happen below.
              </p>

              <div className="mk-hv-cols" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, marginTop: 6 }}>
                {/* pricing block */}
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <span className="mk-eyebrow" style={{ paddingBottom: 10 }}>Pricing</span>
                  <Rule />
                  {[
                    ["Platform licence, annual", "$48,000"],
                    ["Onboarding & migration", "$6,500"],
                    ["Total", "$54,500"],
                  ].map(([label, value], i) => (
                    <div key={label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 0",
                          fontSize: 13.5,
                          color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)",
                          fontWeight: i === 2 ? 600 : 400,
                        }}
                      >
                        <span>{label}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
                      </div>
                      <Rule />
                    </div>
                  ))}
                </div>
                {/* timeline block */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="mk-eyebrow" style={{ paddingBottom: 10 }}>Next steps</span>
                  <Rule />
                  {[
                    ["Kickoff call", "Jul 21", true],
                    ["Pilot live", "Aug 04", false],
                    ["Signature", "Aug 15", false],
                  ].map(([label, date, done]) => (
                    <div
                      key={label as string}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: "1px solid var(--db-border)",
                        fontSize: 13.5,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: done ? "var(--db-text)" : "transparent",
                          border: "1.5px solid var(--db-text)",
                          opacity: done ? 1 : 0.4,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "var(--db-text-secondary)" }}>{label}</span>
                      <span className="mk-eyebrow" style={{ marginLeft: "auto" }}>{date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
                <span className="mk-cta" style={{ fontSize: 13, padding: "9px 18px", cursor: "default" }}>
                  Approve &amp; sign
                </span>
                <span style={{ fontSize: 13, color: "var(--db-text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Book a call
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── floating: live engagement panel ── */}
        <div
          className="mk-hv-float mk-hv-in"
          style={{ position: "absolute", right: 24, top: 44, animationDelay: ".3s" }}
        >
          <div
            ref={panelRef}
            style={{
              width: 252,
              background: "var(--db-surface)",
              border: "1px solid var(--db-border)",
              borderRadius: 10,
              boxShadow: "var(--db-shadow-3)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              willChange: "transform",
            }}
          >
            <span className="mk-eyebrow">Live engagement</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Maya Chen</span>
              <span
                className="mk-eyebrow"
                style={{
                  color: "var(--db-on-accent)",
                  background: "var(--db-accent)",
                  borderRadius: 999,
                  padding: "3px 9px",
                }}
              >
                High intent
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--db-text-secondary)" }}>
              Reading <em style={{ fontFamily: SERIF }}>Pricing</em> &middot; 4:32 on page
            </span>
            <div data-wg="" style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 44 }}>
              {[0.35, 0.6, 0.45, 0.9, 0.7, 1, 0.55].map((b, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: Math.round(44 * b),
                    transformOrigin: "bottom",
                    background: "var(--db-text)",
                    opacity: 0.8,
                    borderRadius: "2px 2px 0 0",
                    animation: "wg-grow 2.6s ease-in-out infinite",
                    animationDelay: `${i * 0.14}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── floating: open notification ── */}
        <div
          className="mk-hv-float mk-hv-in"
          style={{ position: "absolute", left: 24, bottom: 40, animationDelay: ".45s" }}
        >
          <div
            ref={toastRef}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: "var(--db-surface)",
              border: "1px solid var(--db-border)",
              borderRadius: 999,
              boxShadow: "var(--db-shadow-2)",
              padding: "11px 18px 11px 12px",
              willChange: "transform",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--db-surface-dim)",
                border: "1px solid var(--db-border)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              N
            </span>
            <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>
              Northwind opened your page
            </span>
            <span className="mk-eyebrow" style={{ whiteSpace: "nowrap" }}>just now</span>
          </div>
        </div>
      </div>
    </>
  )
}
