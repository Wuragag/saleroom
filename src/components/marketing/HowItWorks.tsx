"use client"

import { useState } from "react"
import { LANDING_STEPS, type LandingStep } from "@/data/marketing/landing"

/**
 * Step tabs (Assemble → Send → Observe → Close) driving the product strip
 * below them. The design's static product screenshots are rendered here as
 * theme-aware CSS mocks so they follow the light/dark palette.
 */

/* ── shared mock atoms ── */

function Line({ w, h = 8, style }: { w: number | string; h?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: h / 2,
        background: "var(--db-surface-dim)",
        ...style,
      }}
    />
  )
}

function Panel({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        borderRadius: 10,
        boxShadow: "var(--db-shadow-1)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── per-step mock scenes ── */

function AssembleMock() {
  return (
    <div style={{ display: "flex", gap: 14, height: "100%" }}>
      <Panel style={{ width: 130, padding: 12, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
        <Line w="55%" h={7} />
        {[80, 65, 72, 50, 60].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "var(--db-surface-dim)", flexShrink: 0 }} />
            <Line w={`${w}%`} h={6} />
          </div>
        ))}
        <span
          style={{
            marginTop: "auto",
            alignSelf: "flex-start",
            fontSize: 10,
            fontWeight: 500,
            color: "var(--db-on-accent)",
            background: "var(--db-cta-grad)",
            borderRadius: 999,
            padding: "4px 9px",
          }}
        >
          ✦ AI Write
        </span>
      </Panel>
      <Panel style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--db-surface-dim)" }} />
          <Line w="42%" h={10} />
        </div>
        {[92, 74, 84, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 4,
              width: `${w}%`,
              background: "var(--db-surface-dim)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--db-text)",
                opacity: 0.72,
                animation: "wg-type 3.8s ease-in-out infinite",
                animationDelay: `${i * 0.45}s`,
              }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 9,
                background: "var(--db-surface-dim)",
                animation: "wg-float 3.2s ease-in-out infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </Panel>
    </div>
  )
}

function SendMock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <Panel style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--db-border-hover)" }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            maxWidth: 320,
            margin: "0 auto",
            fontSize: 11,
            color: "var(--db-text-muted)",
            background: "var(--db-surface-dim)",
            borderRadius: 999,
            padding: "5px 14px",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          acme.deal/q3-proposal
        </div>
      </Panel>
      <Panel style={{ flex: 1, padding: "22px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: "min(420px, 72%)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--db-cta-grad)" }} />
            <Line w={72} h={7} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 22,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "var(--db-text)",
            }}
          >
            A proposal for Acme
          </div>
          <Line w="88%" h={7} />
          <Line w="70%" h={7} />
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1, height: 44, borderRadius: 9, background: "var(--db-surface-dim)" }} />
            <div style={{ flex: 1, height: 44, borderRadius: 9, background: "var(--db-surface-dim)" }} />
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              marginTop: 4,
              fontSize: 11,
              fontWeight: 500,
              color: "var(--db-on-accent)",
              background: "var(--db-cta-grad)",
              borderRadius: 999,
              padding: "7px 16px",
            }}
          >
            Accept &amp; continue
          </div>
        </div>
      </Panel>
    </div>
  )
}

function ObserveMock() {
  const bars = [0.42, 0.68, 0.5, 0.86, 0.6, 1, 0.78]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", gap: 12 }}>
        {[
          ["Opens", "18"],
          ["Read time", "6:24"],
          ["Intent", "High"],
        ].map(([label, value]) => (
          <Panel key={label} style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>
              {label}
            </span>
            <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, color: "var(--db-text)" }}>
              {value}
            </span>
          </Panel>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        <Panel style={{ flex: 3, padding: 16, display: "flex", alignItems: "flex-end", gap: 7 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.round(b * 100)}%`,
                transformOrigin: "bottom",
                background: "var(--db-text)",
                opacity: 0.82,
                borderRadius: "3px 3px 0 0",
                animation: "wg-grow 2.6s ease-in-out infinite",
                animationDelay: `${i * 0.14}s`,
              }}
            />
          ))}
        </Panel>
        <Panel style={{ flex: 2, padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
          {[78, 62, 70].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--db-surface-dim)", flexShrink: 0 }} />
              <Line w={`${w}%`} h={7} />
              <div
                style={{
                  marginLeft: "auto",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--db-text)",
                  opacity: 0.8,
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

function CloseMock() {
  return (
    <div style={{ display: "flex", gap: 12, height: "100%" }}>
      <div style={{ flex: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {["Signed", "In review", "Opened", "Draft"].map((status, i) => (
          <Panel key={status} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Line w="52%" h={8} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: i === 0 ? "var(--db-on-accent)" : "var(--db-text-secondary)",
                  background: i === 0 ? "var(--db-cta-grad)" : "var(--db-surface-dim)",
                  borderRadius: 999,
                  padding: "3px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {status}
              </span>
            </div>
            <Line w="86%" h={6} />
            <Line w="64%" h={6} />
          </Panel>
        ))}
      </div>
      <Panel style={{ flex: 2, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <Line w="45%" h={7} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--db-text)",
                opacity: 0.75 - i * 0.15,
                flexShrink: 0,
              }}
            />
            <Line w={`${82 - i * 12}%`} h={6} />
          </div>
        ))}
      </Panel>
    </div>
  )
}

const MOCKS: Record<LandingStep["mock"], () => React.ReactNode> = {
  assemble: AssembleMock,
  send: SendMock,
  observe: ObserveMock,
  close: CloseMock,
}

/* ── section ── */

export default function HowItWorks() {
  const [active, setActive] = useState(0)
  const step = LANDING_STEPS[active]
  const Mock = MOCKS[step.mock]

  return (
    <>
      <style>{`
        .mk-step-tab {
          font-family: inherit;
          display: inline-flex; align-items: baseline; gap: 10px;
          padding: 14px 2px;
          font-size: 15px; font-weight: 500; letter-spacing: -0.01em;
          cursor: pointer;
          color: var(--db-text-muted);
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          margin-bottom: -1px;
          transition: color .15s ease, border-color .15s ease;
        }
        .mk-step-tab:hover { color: var(--db-text-secondary); }
        .mk-step-tab[aria-selected="true"] {
          color: var(--db-text);
          border-bottom: 1px solid var(--db-text);
        }
        .mk-step-num {
          font-family: var(--font-mk-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
        }
        @media (max-width: 900px) {
          .mk-step-row { flex-direction: column !important; align-items: flex-start !important; }
          .mk-step-body { text-align: left !important; max-width: 100% !important; }
          .mk-strip-mock { aspect-ratio: auto !important; height: 300px; padding: 20px 20px 24px !important; }
          .mk-strip-caption {
            position: static !important;
            background: none !important;
            padding: 20px 24px 24px !important;
            flex-direction: column;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
      `}</style>

      <section id="product" style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px 104px" }}>
        <div className="mk-chapter">
          <span className="mk-eyebrow">01 &mdash; Method</span>
          <span className="mk-eyebrow">Four moves, in order</span>
        </div>

        <div
          className="mk-step-row"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            padding: "28px 0 20px",
          }}
        >
          <div role="tablist" aria-label="How it works" style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
            {LANDING_STEPS.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === active}
                className="mk-step-tab"
                onClick={() => setActive(i)}
              >
                <span className="mk-step-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
          <p
            className="mk-step-body"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--db-text-secondary)",
              margin: 0,
              maxWidth: 340,
              textAlign: "right",
            }}
          >
            {step.body}
          </p>
        </div>

        <div
          style={{
            position: "relative",
            border: "1px solid var(--db-border)",
            borderRadius: 8,
            background: "var(--db-surface)",
            boxShadow: "var(--db-shadow-1)",
            overflow: "hidden",
          }}
        >
          <div
            data-wg=""
            className="mk-strip-mock"
            style={{
              aspectRatio: "16 / 8.5",
              background: "var(--db-bg)",
              borderBottom: "1px solid var(--db-border)",
              padding: "28px 32px 84px",
              boxSizing: "border-box",
            }}
          >
            <Mock />
          </div>
          <div
            className="mk-strip-caption"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "28px 32px",
              background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--db-surface) 88%, transparent))",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 28, letterSpacing: "-0.01em" }}>
              {step.shotTitle}
            </span>
            <span style={{ fontSize: 14, color: "var(--db-text-secondary)" }}>{step.shotCaption}</span>
          </div>
        </div>
      </section>
    </>
  )
}
