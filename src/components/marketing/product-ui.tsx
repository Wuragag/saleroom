/**
 * High-fidelity CSS/SVG mockups of the Dealbeam product, used across the
 * landing page instead of flat screenshots so they stay crisp and follow the
 * light/dark theme. Colour comes from the --mk-* accent tokens; structure and
 * neutrals from the --db-* palette.
 */

const SERIF = "var(--font-serif), Georgia, serif"
const MONO = "var(--font-mk-mono), ui-monospace, monospace"

/* ── window chrome ── */
export function BrowserFrame({
  url,
  children,
  live,
  style,
}: {
  url: string
  children: React.ReactNode
  live?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        borderRadius: 12,
        boxShadow: "var(--db-shadow-3)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderBottom: "1px solid var(--db-border)",
          background: "var(--db-surface)",
        }}
      >
        <span style={{ display: "flex", gap: 6 }}>
          {["#F87171", "#FBBF24", "#34D399"].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.9 }} />
          ))}
        </span>
        <span
          style={{
            flex: 1,
            maxWidth: 320,
            margin: "0 auto",
            fontFamily: MONO,
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
          {url}
        </span>
        {live && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: "var(--mk-emerald)" }}>
            <span data-wg="" style={{ position: "relative", width: 6, height: 6 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid var(--mk-emerald)", animation: "wg-pulse 2.4s ease-out infinite" }} />
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--mk-emerald)" }} />
            </span>
            LIVE
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Avatar({ initials, color, size = 22 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `color-mix(in srgb, ${color} 22%, var(--db-surface))`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  )
}

/* ── hero: dashboard of deal pages ── */
const DASH_CARDS = [
  { title: "Q3 — Acme", tag: "Signed", from: "var(--mk-indigo)", to: "var(--mk-violet)", read: "94" },
  { title: "Globex renewal", tag: "Reading", from: "var(--mk-sky)", to: "var(--mk-cyan)", read: "71" },
  { title: "Initech pilot", tag: "Opened", from: "var(--mk-amber)", to: "var(--mk-rose)", read: "48" },
  { title: "Northwind SOW", tag: "Draft", from: "var(--mk-emerald)", to: "var(--mk-cyan)", read: "—" },
]

export function DashboardVisual() {
  return (
    <div style={{ display: "flex", background: "var(--db-bg)", minHeight: 380 }}>
      {/* sidebar */}
      <div className="mk-dash-side" style={{ width: 176, borderRight: "1px solid var(--db-border)", padding: 16, display: "flex", flexDirection: "column", gap: 6, background: "var(--db-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--db-cta-grad)", color: "var(--db-on-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>D</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Workspace</span>
        </div>
        {[["Pages", true], ["Analytics", false], ["Templates", false], ["Buyers", false], ["Settings", false]].map(([label, active]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, padding: "7px 9px", borderRadius: 7, color: active ? "var(--db-text)" : "var(--db-text-secondary)", background: active ? "var(--db-surface-dim)" : "transparent", fontWeight: active ? 600 : 400 }}>
            <span style={{ width: 13, height: 13, borderRadius: 4, background: active ? "var(--mk-indigo)" : "var(--db-border-hover)", flexShrink: 0 }} />
            {label}
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, paddingTop: 12 }}>
          <Avatar initials="SO" color="var(--mk-violet)" size={24} />
          <span style={{ fontSize: 12, color: "var(--db-text-secondary)" }}>Semih O.</span>
        </div>
      </div>
      {/* main */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.01em" }}>Your deal pages</span>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: "var(--db-on-accent)", background: "var(--db-cta-grad)", borderRadius: 999, padding: "7px 14px", boxShadow: "var(--db-cta-shadow)" }}>+ New page</span>
        </div>
        {/* stat row */}
        <div className="mk-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[["Live pages", "12", "var(--mk-indigo)"], ["Opens this week", "48", "var(--mk-sky)"], ["Avg. read", "6:24", "var(--mk-emerald)"]].map(([label, value, c]) => (
            <div key={label} style={{ border: "1px solid var(--db-border)", borderRadius: 10, padding: "12px 14px", background: "var(--db-surface)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>{label}</span>
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 26, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </div>
          ))}
        </div>
        {/* cards grid */}
        <div className="mk-dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {DASH_CARDS.map((c) => (
            <div key={c.title} style={{ border: "1px solid var(--db-border)", borderRadius: 10, overflow: "hidden", background: "var(--db-surface)" }}>
              <div style={{ height: 46, background: `linear-gradient(120deg, ${c.from}, ${c.to})`, position: "relative" }}>
                <span style={{ position: "absolute", right: 8, top: 8, fontFamily: MONO, fontSize: 9, letterSpacing: "0.06em", color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.22)", borderRadius: 999, padding: "2px 7px" }}>{c.tag}</span>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--db-text-muted)" }}>{c.read !== "—" ? `${c.read}%` : c.read}</span>
                  {c.read !== "—" && <span style={{ width: 34, height: 4, borderRadius: 2, background: "var(--db-surface-dim)", overflow: "hidden", display: "inline-block" }}><span style={{ display: "block", height: "100%", width: `${c.read}%`, background: c.from }} /></span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── analytics panel with real SVG charts ── */
export function AnalyticsVisual() {
  const bars = [42, 60, 48, 78, 64, 92, 74]
  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, background: "var(--db-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: SERIF, fontSize: 19 }}>Q3 — Acme · engagement</span>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: "var(--mk-emerald)" }}>▲ HIGH INTENT</span>
      </div>
      {/* area chart */}
      <div style={{ position: "relative", height: 118, border: "1px solid var(--db-border)", borderRadius: 10, overflow: "hidden", background: "var(--db-surface)" }}>
        <svg viewBox="0 0 320 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <defs>
            <linearGradient id="mkArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mk-indigo)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--mk-indigo)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,86 C30,70 46,44 76,50 C110,57 120,20 152,26 C188,33 196,58 226,52 C260,45 276,18 320,24 L320,120 L0,120 Z" fill="url(#mkArea)" />
          <path d="M0,86 C30,70 46,44 76,50 C110,57 120,20 152,26 C188,33 196,58 226,52 C260,45 276,18 320,24" fill="none" stroke="var(--mk-indigo)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <circle cx="152" cy="26" r="3.5" fill="var(--mk-indigo)" />
        </svg>
        <span style={{ position: "absolute", left: 12, top: 10, fontFamily: MONO, fontSize: 9.5, color: "var(--db-text-muted)" }}>TIME ON PAGE</span>
      </div>
      {/* section bars */}
      <div>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--db-text-muted)" }}>Reads by section</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 56, marginTop: 8 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0", background: i === 5 ? "var(--mk-indigo)" : "color-mix(in srgb, var(--mk-indigo) 32%, var(--db-surface-dim))" }} />
          ))}
        </div>
      </div>
      {/* per-buyer list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[["Maya Chen", "MC", "var(--mk-violet)", 94], ["Dan Ortiz", "DO", "var(--mk-sky)", 71], ["Priya Nair", "PN", "var(--mk-amber)", 46]].map(([name, ini, c, score]) => (
          <div key={name as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--db-border)" }}>
            <Avatar initials={ini as string} color={c as string} size={22} />
            <span style={{ fontSize: 12.5, color: "var(--db-text-secondary)" }}>{name}</span>
            <span style={{ marginLeft: "auto", width: 90, height: 5, borderRadius: 3, background: "var(--db-surface-dim)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${score}%`, background: c as string }} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, width: 24, textAlign: "right", color: "var(--db-text)" }}>{score as number}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── editor / AI Write ── */
export function EditorVisual() {
  return (
    <div style={{ padding: 24, background: "var(--db-surface)", display: "flex", flexDirection: "column", gap: 14, minHeight: 340 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--db-text-muted)" }}>Untitled proposal</span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: "var(--mk-emerald)" }}>Saved</span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 27, letterSpacing: "-0.015em" }}>Q3 Partnership Proposal</div>
      {/* AI prompt chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: "color-mix(in srgb, var(--mk-indigo) 12%, var(--db-surface))", border: "1px solid color-mix(in srgb, var(--mk-indigo) 34%, transparent)" }}>
        <span style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg, var(--mk-indigo), var(--mk-violet))", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✦</span>
        <span style={{ fontSize: 13, color: "var(--db-text-secondary)" }}>Draft pricing &amp; a 3-step rollout for a $54k annual deal</span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: "var(--mk-indigo)", flexShrink: 0 }}>⏎ Write</span>
      </div>
      {/* generated lines */}
      <div data-wg="" style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 2 }}>
        {[100, 92, 74].map((w, i) => (
          <div key={i} style={{ height: 8, borderRadius: 4, width: `${w}%`, background: "var(--db-surface-dim)", overflow: "hidden", position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, background: "color-mix(in srgb, var(--mk-indigo) 30%, var(--db-text))", opacity: 0.55, animation: "wg-type 3.4s ease-in-out infinite", animationDelay: `${i * 0.4}s` }} />
          </div>
        ))}
      </div>
      {/* pricing block being built */}
      <div style={{ border: "1px solid var(--db-border)", borderRadius: 10, overflow: "hidden", marginTop: 4 }}>
        {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"]].map(([l, v], i) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 12.5, color: "var(--db-text-secondary)", borderTop: i ? "1px solid var(--db-border)" : "none" }}>
            <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── buyer-facing published page ── */
export function BuyerVisual() {
  return (
    <div style={{ background: "var(--db-surface)", minHeight: 340 }}>
      <div style={{ height: 96, background: "linear-gradient(120deg, var(--mk-indigo), var(--mk-violet))", position: "relative", display: "flex", alignItems: "flex-end", padding: 18 }}>
        <span style={{ position: "absolute", left: 18, top: 16, display: "inline-flex", alignItems: "center", gap: 8, color: "#fff" }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>A</span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", opacity: 0.9 }}>ACME × NORTHWIND</span>
        </span>
        <span style={{ fontFamily: SERIF, fontSize: 24, color: "#fff", letterSpacing: "-0.01em" }}>Q3 Partnership Proposal</span>
      </div>
      {/* tabs */}
      <div style={{ display: "flex", gap: 18, padding: "0 18px", borderBottom: "1px solid var(--db-border)" }}>
        {["Overview", "Pricing", "Timeline", "Sign"].map((t, i) => (
          <span key={t} style={{ padding: "12px 0", fontSize: 12.5, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 1 ? "2px solid var(--mk-indigo)" : "2px solid transparent", marginBottom: -1 }}>{t}</span>
        ))}
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"], ["Total", "$54,500"]].map(([l, v], i) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, paddingBottom: 10, borderBottom: "1px solid var(--db-border)", fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)" }}>
            <span>{l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: "#fff", background: "linear-gradient(135deg, var(--mk-indigo), var(--mk-violet))", borderRadius: 999, padding: "9px 18px" }}>Approve &amp; sign</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Avatar initials="MC" color="var(--mk-violet)" size={20} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--db-text-muted)" }}>Maya viewing…</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export const FEATURE_VISUALS = {
  analytics: AnalyticsVisual,
  editor: EditorVisual,
  buyer: BuyerVisual,
}
