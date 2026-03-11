"use client"

import { useEffect, useRef, useState } from "react"

/* ── Shared browser chrome ── */
function BrowserChrome({
  url,
  children,
}: {
  url: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "var(--sr-surface)",
        borderRadius: 16,
        border: "1px solid var(--sr-border)",
        boxShadow:
          "0 24px 48px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--sr-border)",
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
            background: "var(--sr-surface-dim)",
            borderRadius: 8,
            padding: "6px 14px",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 12,
            color: "var(--sr-text-muted)",
          }}
        >
          {url}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Fade-in wrapper with intersection observer ── */
function FadeInView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 700ms ease, transform 700ms ease",
      }}
    >
      {children}
    </div>
  )
}

/* ── Page Builder mockup ── */
function PageBuilderMockup() {
  return (
    <BrowserChrome url="app.salesroom.com/editor">
      <div style={{ padding: 20, background: "#FCFCFB" }}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 16,
            padding: "8px 12px",
            background: "var(--sr-surface-dim)",
            borderRadius: 8,
          }}
        >
          {["T", "B", "I", "U", "|", "H1", "H2", "Q", "|", "+"].map(
            (item, i) => (
              <div
                key={i}
                style={{
                  padding: item === "|" ? "0 4px" : "4px 10px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  fontWeight: item === "B" ? 700 : 500,
                  fontStyle: item === "I" ? "italic" : "normal",
                  textDecoration: item === "U" ? "underline" : "none",
                  color:
                    item === "|"
                      ? "var(--sr-border)"
                      : item === "+"
                        ? "var(--sr-text)"
                        : "var(--sr-text-secondary)",
                  borderRadius: 4,
                  cursor: "default",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Content blocks */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 22,
              fontWeight: 400,
              color: "var(--sr-text)",
              marginBottom: 12,
            }}
          >
            Q4 Partnership Proposal
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {[100, 90, 75].map((w, i) => (
              <div
                key={i}
                style={{
                  width: `${w}%`,
                  height: 7,
                  borderRadius: 4,
                  background: "var(--sr-surface-dim)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Embedded video block */}
        <div
          style={{
            background: "var(--sr-surface-dim)",
            borderRadius: 12,
            padding: "24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--sr-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path d="M5 3L13 8L5 13V3Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Pricing table block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Starter", price: "$2,400" },
            { label: "Enterprise", price: "$8,900" },
          ].map(({ label, price }) => (
            <div
              key={label}
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--sr-border)",
                background: "var(--sr-surface)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--sr-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: 20,
                  color: "var(--sr-text)",
                }}
              >
                {price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ── Analytics mockup ── */
function AnalyticsMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <BrowserChrome url="app.salesroom.com/analytics">
        <div style={{ padding: 20, background: "#FCFCFB" }}>
          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid var(--sr-border)",
            }}
          >
            {[
              { label: "Unique visitors", value: "12" },
              { label: "Avg. time", value: "4m 32s" },
              { label: "Completion", value: "68%" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: 24,
                    color: "var(--sr-text)",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 11,
                    color: "var(--sr-text-muted)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Visitor row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid var(--sr-border)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--sr-surface-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--sr-text-secondary)",
              }}
            >
              S
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--sr-text)",
                }}
              >
                Sarah Chen
              </div>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 11,
                  color: "var(--sr-text-muted)",
                }}
              >
                4m 32s on Pricing
              </div>
            </div>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
              }}
            />
          </div>

          {/* Mini bar chart */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 56,
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
                    background:
                      i === 5
                        ? "var(--sr-text)"
                        : "var(--sr-surface-dim)",
                    transition: `height 600ms ${i * 70}ms ease`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </BrowserChrome>

      {/* Notification card */}
      <div
        style={{
          position: "relative",
          marginTop: -20,
          marginLeft: "auto",
          marginRight: 16,
          width: "fit-content",
        }}
      >
        <div
          style={{
            background: "var(--sr-surface)",
            border: "1px solid var(--sr-border)",
            borderRadius: 12,
            padding: "14px 18px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            width: 220,
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--sr-text)",
              marginBottom: 4,
            }}
          >
            Sarah just opened your page
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              color: "var(--sr-text-muted)",
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
      </div>
    </div>
  )
}

/* ── AI Content mockup ── */
function AIContentMockup() {
  return (
    <BrowserChrome url="app.salesroom.com/editor">
      <div style={{ padding: 20, background: "#FCFCFB" }}>
        {/* Existing content */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {[100, 85, 92].map((w, i) => (
              <div
                key={i}
                style={{
                  width: `${w}%`,
                  height: 7,
                  borderRadius: 4,
                  background: "var(--sr-surface-dim)",
                }}
              />
            ))}
          </div>
        </div>

        {/* AI suggestion panel */}
        <div
          style={{
            background: "linear-gradient(135deg, #F8F7FF, #F5F3FF)",
            border: "1px solid #E9E5FF",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M8 1L10 6L15 6.5L11 10L12.5 15L8 12L3.5 15L5 10L1 6.5L6 6L8 1Z"
                fill="#7C3AED"
                opacity="0.7"
              />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#7C3AED",
              }}
            >
              AI Suggestion
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 14,
              color: "var(--sr-text-secondary)",
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            Based on your top-performing proposals, adding a customer
            success story here increases engagement by 34%.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                background: "#7C3AED",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#FFFFFF",
              }}
            >
              Accept
            </div>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid #E9E5FF",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "#7C3AED",
              }}
            >
              Dismiss
            </div>
          </div>
        </div>

        {/* More content below */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[80, 95, 60].map((w, i) => (
              <div
                key={i}
                style={{
                  width: `${w}%`,
                  height: 7,
                  borderRadius: 4,
                  background: "var(--sr-surface-dim)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ── Collaboration mockup ── */
function CollaborationMockup() {
  return (
    <BrowserChrome url="app.salesroom.com/team">
      <div style={{ padding: 20, background: "#FCFCFB" }}>
        {/* Template grid header */}
        <div
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--sr-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}
        >
          Shared Templates
        </div>

        {/* Template cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            "Enterprise Proposal",
            "QBR Deck",
            "Onboarding Guide",
            "Partnership Brief",
          ].map((name) => (
            <div
              key={name}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--sr-border)",
                background: "var(--sr-surface)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 2,
                  background: "var(--sr-surface-dim)",
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sr-text)",
                }}
              >
                {name}
              </div>
            </div>
          ))}
        </div>

        {/* Team activity */}
        <div
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--sr-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}
        >
          Team Activity
        </div>
        {[
          { name: "Alex", action: "edited Enterprise Proposal", time: "2m ago" },
          { name: "Priya", action: "created QBR for Acme", time: "1h ago" },
          { name: "Jordan", action: "updated synced pricing block", time: "3h ago" },
        ].map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid var(--sr-border)",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--sr-surface-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--sr-text-secondary)",
              }}
            >
              {item.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--sr-text)",
                }}
              >
                {item.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  color: "var(--sr-text-muted)",
                }}
              >
                {" "}
                {item.action}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 11,
                color: "var(--sr-text-muted)",
              }}
            >
              {item.time}
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  )
}

/* ── Integrations mockup ── */
function IntegrationsMockup() {
  return (
    <div
      style={{
        background: "var(--sr-surface)",
        borderRadius: 16,
        border: "1px solid var(--sr-border)",
        boxShadow:
          "0 24px 48px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--sr-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 20,
        }}
      >
        Connected Apps
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { name: "Salesforce", status: "Connected", color: "#10B981" },
          { name: "HubSpot", status: "Connected", color: "#10B981" },
          { name: "Slack", status: "Connected", color: "#10B981" },
          { name: "Calendly", status: "Setup required", color: "#F59E0B" },
          { name: "Zapier", status: "Available", color: "var(--sr-text-muted)" },
        ].map((app) => (
          <div
            key={app.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid var(--sr-border)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--sr-surface-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--sr-text-secondary)",
              }}
            >
              {app.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--sr-text)",
                }}
              >
                {app.name}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: app.color,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 12,
                  color: "var(--sr-text-muted)",
                }}
              >
                {app.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Map slug to visual ── */
const MOCKUP_MAP: Record<string, React.FC> = {
  "page-builder": PageBuilderMockup,
  analytics: AnalyticsMockup,
  "ai-content": AIContentMockup,
  collaboration: CollaborationMockup,
  integrations: IntegrationsMockup,
}

export default function FeatureMockup({ slug }: { slug: string }) {
  const Component = MOCKUP_MAP[slug]
  if (!Component) return null

  return (
    <FadeInView>
      <Component />
    </FadeInView>
  )
}
