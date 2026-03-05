"use client"

import { useEffect, useRef, useState } from "react"

/* ─────────────────────────────────────────────
   Hooks
────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1100, trigger = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trigger) return
    let frame = 0
    const totalFrames = Math.round(duration / 16)
    const step = target / totalFrames

    const timer = setInterval(() => {
      frame++
      const next = Math.min(Math.round(step * frame), target)
      setCount(next)
      if (next >= target) clearInterval(timer)
    }, 16)

    return () => clearInterval(timer)
  }, [trigger, target, duration])

  return count
}

/* ─────────────────────────────────────────────
   Shared primitives
────────────────────────────────────────────── */
function FeatureNumber({ n }: { n: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-syne), sans-serif",
        fontSize: 13,
        color: "#3B82F6",
        letterSpacing: "0.1em",
      }}
    >
      {n}
    </span>
  )
}

function FeaturePills({ pills }: { pills: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
      {pills.map((pill) => (
        <span
          key={pill}
          style={{
            background: "#13131A",
            border: "1px solid #1E1E2E",
            borderRadius: 100,
            padding: "6px 14px",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            color: "#A8A8B3",
          }}
        >
          {pill}
        </span>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ROW 1 visual — Editor mockup
────────────────────────────────────────────── */
function EditorMockup() {
  return (
    <div
      style={{
        background: "#0F0F17",
        borderRadius: 16,
        border: "1px solid #1E1E2E",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "10px 16px",
          borderBottom: "1px solid #1E1E2E",
          background: "#13131A",
        }}
      >
        {[
          { label: "B", style: { fontWeight: 700 } },
          { label: "I", style: { fontStyle: "italic" } },
          { label: "U", style: { textDecoration: "underline" } },
        ].map(({ label, style }) => (
          <div
            key={label}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: "#1E1E2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              color: "#A8A8B3",
              cursor: "default",
              ...style,
            }}
          >
            {label}
          </div>
        ))}

        <div style={{ width: 1, height: 14, background: "#2E2E3E", margin: "0 6px" }} />

        {["H₁", "⌘", "· · ·"].map((t) => (
          <div
            key={t}
            style={{
              padding: "0 6px",
              height: 26,
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              color: "#5C5C7A",
              cursor: "default",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Editor body */}
      <div style={{ padding: "20px 20px 0" }}>
        {/* Heading placeholder */}
        <div
          style={{
            width: "75%",
            height: 18,
            borderRadius: 4,
            background: "rgba(248,247,244,0.15)",
            marginBottom: 14,
          }}
        />

        {/* Body lines */}
        {[100, 90, 100, 72, 85].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w}%`,
              height: 7,
              borderRadius: 4,
              background: "#1E1E2E",
              marginBottom: 8,
            }}
          />
        ))}

        {/* Embed block */}
        <div
          style={{
            marginTop: 14,
            height: 56,
            border: "1.5px dashed #2E2E3E",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 4, background: "#2E2E3E" }} />
          <div style={{ width: 70, height: 7, borderRadius: 3, background: "#2E2E3E" }} />
        </div>

        {/* Slash-command menu */}
        <div
          style={{
            background: "#0A0A0F",
            border: "1px solid #2E2E3E",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: "7px 12px",
              borderBottom: "1px solid #1E1E2E",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              color: "#5C5C7A",
            }}
          >
            / Commands
          </div>
          {[
            { icon: "📝", label: "Text Block",  active: false },
            { icon: "H",  label: "Heading",     active: true  },
            { icon: "🎬", label: "Video Embed", active: false },
            { icon: "📊", label: "Table",       active: false },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                background: active ? "rgba(59,130,246,0.1)" : "transparent",
                borderLeft: `2px solid ${active ? "#3B82F6" : "transparent"}`,
              }}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{icon}</span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  color: active ? "#F8F7F4" : "#A8A8B3",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ROW 2 visual — Analytics dashboard
────────────────────────────────────────────── */
const VISITORS = [
  { initial: "S", name: "Sarah Chen", company: "Acme Corp",  section: "4m 32s on Pricing",  time: "2 min ago",  color: "#3B82F6" },
  { initial: "M", name: "Marcus Johnson", company: "Acme Corp", section: "1m 14s on Overview", time: "Yesterday", color: "#10B981" },
]

const BAR_HEIGHTS = [38, 55, 30, 72, 50, 100, 65]

function AnalyticsMockup({ inView }: { inView: boolean }) {
  const visitors = useCountUp(3,  900, inView)
  const avgTime  = useCountUp(12, 1100, inView)

  return (
    <div
      style={{
        background: "#0F0F17",
        borderRadius: 16,
        border: "1px solid #1E1E2E",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
        padding: 24,
      }}
    >
      {/* Stat bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "12px 16px",
          background: "#13131A",
          borderRadius: 10,
          border: "1px solid #1E1E2E",
          marginBottom: 16,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: "#F8F7F4",
            }}
          >
            {visitors}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              color: "#5C5C7A",
              marginLeft: 5,
            }}
          >
            visitors
          </span>
        </div>
        <div style={{ width: 1, height: 22, background: "#2E2E3E" }} />
        <div>
          <span
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: "#F8F7F4",
            }}
          >
            {avgTime}m
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              color: "#5C5C7A",
              marginLeft: 5,
            }}
          >
            avg time
          </span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}
          />
          <span
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              color: "#10B981",
            }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Visitor rows */}
      {VISITORS.map((v) => (
        <div
          key={v.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid #1E1E2E",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `${v.color}1A`,
              border: `1px solid ${v.color}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: v.color,
              }}
            >
              {v.initial}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#F8F7F4",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {v.name} · {v.company}
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 11,
                color: "#A8A8B3",
                marginTop: 2,
              }}
            >
              {v.section}
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              color: "#5C5C7A",
              flexShrink: 0,
            }}
          >
            {v.time}
          </div>
        </div>
      ))}

      {/* Micro bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 5,
          height: 44,
          marginTop: 16,
          padding: "0 2px",
        }}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: inView ? `${h}%` : "0%",
                borderRadius: 3,
                background: i === 5 ? "#3B82F6" : "#1E1E2E",
                transition: `height 600ms ${i * 70}ms ease`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ROW 3 visual — Template grid
────────────────────────────────────────────── */
const TEMPLATES = [
  { emoji: "📞", name: "Call Recap" },
  { emoji: "📄", name: "Proposal" },
  { emoji: "📋", name: "Mutual Action" },
  { emoji: "🃏", name: "Battle Card" },
  { emoji: "🎓", name: "Onboarding" },
  { emoji: "✨", name: "AI from PDF" },
]

function TemplateGridMockup() {
  return (
    <div
      style={{
        background: "#0F0F17",
        borderRadius: 16,
        border: "1px solid #1E1E2E",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
        padding: 24,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {TEMPLATES.map((t) => (
          <div key={t.name} className="sr-tmpl-card">
            <span style={{ fontSize: 22, lineHeight: 1, display: "block", marginBottom: 8 }}>
              {t.emoji}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                color: "#A8A8B3",
                lineHeight: 1.3,
              }}
            >
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section data
────────────────────────────────────────────── */
const ROWS = [
  {
    n: "01",
    heading: "One link. Not six.",
    body: "Create a beautiful page with everything your buyer needs — demo recording, pricing, case studies, next steps — and share one clean link instead of a wall of attachments.",
    pills: ["Block editor", "Embed anything", "Custom URL", "Tabs"],
    reversed: false,
    visualKey: "editor",
  },
  {
    n: "02",
    heading: "See inside your deal",
    body: "Get notified the moment your buyer opens your page. See which sections they spent time on. Know if it got shared internally. Never follow up blind again.",
    pills: ["Real-time alerts", "Time per section", "Slack detection"],
    reversed: true,
    visualKey: "analytics",
  },
  {
    n: "03",
    heading: "Built for every stage",
    body: "Templates for every moment in your deal — call recaps, proposals, mutual action plans, battle cards, onboarding. Start from a template or let AI build it from your deck.",
    pills: ["6 templates", "AI from PDF", "Custom templates"],
    reversed: false,
    visualKey: "templates",
  },
]

/* ─────────────────────────────────────────────
   Main export
────────────────────────────────────────────── */
export default function SolutionSection() {
  const analyticsRef                    = useRef<HTMLDivElement>(null)
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

  function renderVisual(key: string) {
    if (key === "editor")    return <EditorMockup />
    if (key === "analytics") return (
      <div ref={analyticsRef}>
        <AnalyticsMockup inView={analyticsInView} />
      </div>
    )
    return <TemplateGridMockup />
  }

  return (
    <>
      <style>{`
        .sr-tmpl-card {
          background: #13131A;
          border: 1px solid #1E1E2E;
          border-radius: 10px;
          padding: 14px 12px;
          transition: border-color 200ms ease;
          cursor: default;
        }
        .sr-tmpl-card:hover { border-color: #3B82F6; }

        @media (max-width: 900px) {
          .sr-sol-row  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sr-sol-rev  { order: 0 !important; }
          .sr-sol-txt-rev { order: 1 !important; }
        }
        @media (max-width: 640px) {
          .sr-sol-h2 { font-size: 36px !important; }
          .sr-sol-h3 { font-size: 26px !important; }
          .sr-sol-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section className="sr-sol-section" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Section header ── */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                color: "#5C5C7A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              The Solution
            </span>
            <h2
              className="sr-sol-h2"
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
              Everything your buyer needs.
              <br />
              Everything you need to know.
            </h2>
          </div>

          {/* ── Feature rows ── */}
          {ROWS.map(({ n, heading, body, pills, reversed, visualKey }) => (
            <div
              key={n}
              className="sr-sol-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 80,
                alignItems: "center",
                padding: "80px 0",
                borderBottom: "1px solid #1E1E2E",
              }}
            >
              {/* Text */}
              <div
                className={reversed ? "sr-sol-txt-rev" : ""}
                style={{ order: reversed ? 2 : 1 }}
              >
                <FeatureNumber n={n} />
                <h3
                  className="sr-sol-h3"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#F8F7F4",
                    lineHeight: 1.15,
                    marginTop: 12,
                    marginBottom: 0,
                  }}
                >
                  {heading}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 17,
                    color: "#A8A8B3",
                    lineHeight: 1.7,
                    marginTop: 16,
                    marginBottom: 0,
                  }}
                >
                  {body}
                </p>
                <FeaturePills pills={pills} />
              </div>

              {/* Visual */}
              <div
                className={reversed ? "sr-sol-rev" : ""}
                style={{ order: reversed ? 1 : 2 }}
              >
                {renderVisual(visualKey)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
