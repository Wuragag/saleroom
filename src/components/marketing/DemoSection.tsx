"use client"

import { useEffect, useRef, useState } from "react"

/* ─────────────────────────────────────────────
   Static demo page — shown inside the browser
────────────────────────────────────────────── */
function DemoPageContent() {
  const TABS = ["Overview", "Pricing", "Team", "Next Steps"]
  const activeTab = "Pricing"

  return (
    <div
      style={{
        background: "#0F0F17",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #1E1E2E",
          flexShrink: 0,
          paddingLeft: 20,
        }}
      >
        {TABS.map((tab) => {
          const active = tab === activeTab
          return (
            <div
              key={tab}
              style={{
                padding: "10px 16px",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                color: active ? "#F8F7F4" : "#5C5C7A",
                borderBottom: `2px solid ${active ? "#3B82F6" : "transparent"}`,
                marginBottom: -1,
                cursor: "default",
                userSelect: "none",
              }}
            >
              {tab}
            </div>
          )
        })}
      </div>

      {/* Page body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Welcome header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#1E1E2E",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: 4, background: "#2E2E3E" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#F8F7F4",
                marginBottom: 3,
              }}
            >
              Q4 Pricing — Tailored for Acme
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 11,
                color: "#5C5C7A",
              }}
            >
              Prepared for Sarah Chen · Last updated today
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Starter",    price: "$29",  sub: "/mo · per seat", highlight: false },
            { label: "Enterprise", price: "$149", sub: "/mo · per seat", highlight: true  },
          ].map(({ label, price, sub, highlight }) => (
            <div
              key={label}
              style={{
                background: highlight ? "rgba(59,130,246,0.08)" : "#13131A",
                border: `1px solid ${highlight ? "rgba(59,130,246,0.3)" : "#1E1E2E"}`,
                borderRadius: 10,
                padding: "14px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: highlight ? "#3B82F6" : "#A8A8B3",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#F8F7F4",
                  }}
                >
                  {price}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 10,
                    color: "#5C5C7A",
                  }}
                >
                  {sub}
                </span>
              </div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                {[80, 65, 90, 50].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}%`,
                      height: 5,
                      borderRadius: 3,
                      background: highlight ? "rgba(59,130,246,0.2)" : "#1E1E2E",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* What's included section */}
        <div
          style={{
            background: "#13131A",
            border: "1px solid #1E1E2E",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              color: "#5C5C7A",
              marginBottom: 8,
            }}
          >
            INCLUDED IN YOUR PLAN
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Unlimited pages", checked: true  },
              { label: "Real-time analytics", checked: true  },
              { label: "Custom domain", checked: true  },
              { label: "Slack notifications", checked: true  },
            ].map(({ label, checked }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 11,
                  color: "#A8A8B3",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: checked ? "rgba(16,185,129,0.2)" : "#1E1E2E",
                    border: `1px solid ${checked ? "rgba(16,185,129,0.4)" : "#2E2E3E"}`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked && (
                    <span style={{ fontSize: 8, color: "#10B981", fontWeight: 700 }}>✓</span>
                  )}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* CTA button placeholder */}
        <div
          style={{
            height: 36,
            borderRadius: 8,
            background: "#3B82F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 8,
              borderRadius: 4,
              background: "rgba(10,10,15,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Notification card (reused from hero style)
────────────────────────────────────────────── */
function NotifCard({
  emoji,
  line1,
  line2,
}: {
  emoji: string
  line1: string
  line2: string
}) {
  return (
    <div
      style={{
        background: "#0F0F17",
        border: "1px solid #2E2E3E",
        borderLeft: "3px solid #3B82F6",
        borderRadius: 12,
        padding: "14px 18px",
        flex: 1,
        maxWidth: 280,
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#F8F7F4",
            lineHeight: 1.4,
          }}
        >
          {line1}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: 12,
          color: "#A8A8B3",
          paddingLeft: 26,
        }}
      >
        {line2}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main export
────────────────────────────────────────────── */
export default function DemoSection() {
  const mockupRef              = useRef<HTMLDivElement>(null)
  const [tilted, setTilted]    = useState(true)

  useEffect(() => {
    const el = mockupRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTilted(false)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .sr-demo-h2 { font-size: 36px !important; }
          .sr-demo-notifs { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      <section
        style={{
          background: "#0F0F17",
          borderTop: "1px solid #1E1E2E",
          borderBottom: "1px solid #1E1E2E",
          padding: "100px 0",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Section label + heading ── */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                color: "#5C5C7A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              See It Live
            </span>
            <h2
              className="sr-demo-h2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 52,
                fontWeight: 800,
                color: "#F8F7F4",
                lineHeight: 1.1,
                textAlign: "center",
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              This is what your buyer sees
            </h2>
          </div>

          {/* ── Tilting browser mockup ── */}
          <div
            ref={mockupRef}
            style={{
              maxWidth: 900,
              margin: "0 auto",
              transform: `perspective(1200px) rotateX(${tilted ? 4 : 0}deg)`,
              transition: "transform 600ms ease-out",
              transformOrigin: "center bottom",
              borderRadius: 12,
              boxShadow:
                "0 0 0 1px #1E1E2E, 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                background: "#1A1A27",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {[["#FF5F57"], ["#FFBD2E"], ["#28CA42"]].map(([color]) => (
                <span
                  key={color}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                />
              ))}
              <div
                style={{
                  flex: 1,
                  marginLeft: 8,
                  background: "#0F0F17",
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  color: "#5C5C7A",
                }}
              >
                acme.salesroom.app/q4-proposal
              </div>
            </div>

            {/* Demo page */}
            <div style={{ height: 500 }}>
              <DemoPageContent />
            </div>
          </div>

          {/* ── "While Sarah reads…" text ── */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 18,
              color: "#A8A8B3",
              textAlign: "center",
              marginTop: 60,
              marginBottom: 32,
            }}
          >
            While Sarah reads this, you see this 👇
          </p>

          {/* ── Two notification cards ── */}
          <div
            className="sr-demo-notifs"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <NotifCard
              emoji="🔔"
              line1="Sarah just opened your page"
              line2="Acme Corp · 3 minutes ago"
            />
            <NotifCard
              emoji="📊"
              line1="Spent 4m 32s on Pricing"
              line2="Your best section"
            />
          </div>
        </div>
      </section>
    </>
  )
}
