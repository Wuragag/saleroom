"use client"

import { useEffect, useRef, useState } from "react"

/* ── Minimal browser mockup ── */
function BrowserMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--db-surface)",
        borderRadius: 16,
        border: "1px solid var(--db-border)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--db-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FFBD2E", "#28CA42"].map((color) => (
            <span
              key={color}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            marginLeft: 8,
            background: "var(--db-surface-dim)",
            borderRadius: 8,
            padding: "6px 14px",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 12,
            color: "var(--db-text-muted)",
          }}
        >
          acme.dealbeam.app/q4-proposal
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Page mockup content ── */
function PageMockupContent() {
  return (
    <div style={{ padding: 24, background: "#FCFCFB" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--db-surface-dim)",
          }}
        />
        <div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--db-text)",
            }}
          >
            Q4 Partnership Proposal
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              color: "var(--db-text-muted)",
            }}
          >
            Prepared for Sarah Chen
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--db-border)",
          marginBottom: 24,
        }}
      >
        {["Overview", "Pricing", "Team", "Next Steps"].map((tab) => {
          const active = tab === "Pricing"
          return (
            <div
              key={tab}
              style={{
                padding: "10px 16px",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--db-text)" : "var(--db-text-muted)",
                borderBottom: active ? "2px solid var(--db-text)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab}
            </div>
          )
        })}
      </div>

      {/* Content lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {[100, 85, 92, 65].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w}%`,
              height: 8,
              borderRadius: 4,
              background: "var(--db-surface-dim)",
            }}
          />
        ))}
      </div>

      {/* Pricing cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Starter", price: "$29", active: false },
          { label: "Enterprise", price: "$149", active: true },
        ].map(({ label, price, active }) => (
          <div
            key={label}
            style={{
              padding: "16px",
              borderRadius: 12,
              border: `1px solid ${active ? "var(--db-text)" : "var(--db-border)"}`,
              background: active ? "var(--db-text)" : "var(--db-surface)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: active ? "rgba(255,255,255,0.6)" : "var(--db-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 24,
                color: active ? "#FFFFFF" : "var(--db-text)",
              }}
            >
              {price}
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {[70, 55, 85].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: `${w}%`,
                    height: 5,
                    borderRadius: 3,
                    background: active ? "rgba(255,255,255,0.15)" : "var(--db-surface-dim)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Analytics mockup ── */
function AnalyticsMockup({ inView }: { inView: boolean }) {
  return (
    <div
      style={{
        background: "var(--db-surface)",
        borderRadius: 16,
        border: "1px solid var(--db-border)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        padding: 24,
      }}
    >
      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginBottom: 24,
          paddingBottom: 24,
          borderBottom: "1px solid var(--db-border)",
        }}
      >
        {[
          { label: "Visitors", value: "3" },
          { label: "Avg. time", value: "12m" },
          { label: "Completion", value: "68%" },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 28,
                color: "var(--db-text)",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                color: "var(--db-text-muted)",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Visitor rows */}
      {[
        { name: "Sarah Chen", company: "Acme Corp", detail: "4m 32s on Pricing", time: "2 min ago" },
        { name: "Marcus Johnson", company: "Acme Corp", detail: "1m 14s on Overview", time: "Yesterday" },
      ].map((v) => (
        <div
          key={v.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
            borderBottom: "1px solid var(--db-border)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--db-surface-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--db-text-secondary)",
              flexShrink: 0,
            }}
          >
            {v.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--db-text)",
              }}
            >
              {v.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                color: "var(--db-text-muted)",
              }}
            >
              {v.detail}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              color: "var(--db-text-muted)",
            }}
          >
            {v.time}
          </div>
        </div>
      ))}

      {/* Mini bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 48,
          marginTop: 20,
        }}
      >
        {[38, 55, 30, 72, 50, 100, 65].map((h, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: inView ? `${h}%` : "0%",
                borderRadius: 4,
                background: i === 5 ? "var(--db-text)" : "var(--db-surface-dim)",
                transition: `height 600ms ${i * 70}ms ease`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Notification card ── */
function NotificationCard() {
  return (
    <div
      style={{
        position: "absolute",
        top: -16,
        right: -16,
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
        width: 240,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--db-text)",
          marginBottom: 6,
        }}
      >
        Sarah just opened your page
      </div>
      <div
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 12,
          color: "var(--db-text-muted)",
        }}
      >
        Spending time on Pricing
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#10B981",
        }}
      />
    </div>
  )
}

/* ── Row data ── */
const ROWS = [
  {
    label: "Create",
    heading: "Beautiful pages, effortlessly",
    body: "Build proposals with a block editor that supports rich text, video embeds, tables, and AI-generated content. Your buyers get one clean link instead of six attachments.",
    visual: "page",
  },
  {
    label: "Track",
    heading: "See inside every deal",
    body: "Know the moment your buyer opens your page. See which sections they spend time on, whether it got shared internally, and exactly when to follow up.",
    visual: "analytics",
  },
]

/* ── Main export ── */
export default function SolutionSection() {
  const analyticsRef = useRef<HTMLDivElement>(null)
  const [analyticsInView, setAnalyticsInView] = useState(false)

  useEffect(() => {
    const el = analyticsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnalyticsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .sr-sol-row { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sr-sol-visual { order: -1 !important; }
        }
        @media (max-width: 640px) {
          .sr-sol-h2 { font-size: 36px !important; }
          .sr-sol-h3 { font-size: 28px !important; }
          .sr-sol-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section className="sr-sol-section" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          {/* Section header */}
          <div style={{ marginBottom: 80, maxWidth: 600 }}>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--db-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              How it works
            </p>
            <h2
              className="sr-sol-h2"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 48,
                fontWeight: 400,
                color: "var(--db-text)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Everything your buyer needs.
              <br />
              <em>Everything you need to know.</em>
            </h2>
          </div>

          {/* Feature rows */}
          {ROWS.map(({ label, heading, body, visual }, index) => (
            <div
              key={label}
              className="sr-sol-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 80,
                alignItems: "center",
                marginBottom: index < ROWS.length - 1 ? 100 : 0,
              }}
            >
              {/* Text */}
              <div style={{ order: index % 2 === 0 ? 1 : 2 }}>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--db-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                  }}
                >
                  {label}
                </p>
                <h3
                  className="sr-sol-h3"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: 36,
                    fontWeight: 400,
                    color: "var(--db-text)",
                    lineHeight: 1.2,
                    margin: "0 0 16px",
                  }}
                >
                  {heading}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 16,
                    color: "var(--db-text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 420,
                  }}
                >
                  {body}
                </p>
              </div>

              {/* Visual */}
              <div
                className="sr-sol-visual"
                style={{ order: index % 2 === 0 ? 2 : 1, position: "relative" }}
              >
                {visual === "page" ? (
                  <div style={{ position: "relative" }}>
                    <BrowserMockup>
                      <PageMockupContent />
                    </BrowserMockup>
                    <NotificationCard />
                  </div>
                ) : (
                  <div ref={analyticsRef}>
                    <AnalyticsMockup inView={analyticsInView} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
