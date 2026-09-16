/**
 * Monochrome CSS/SVG mockups of the real Dealbeam product, used across the
 * marketing site instead of screenshots so they stay crisp, follow the
 * light/dark theme, and never go stale visually. Labels mirror the actual
 * app UI (dashboard, editor, buyer page, analytics, deals).
 *
 * Everything is black, white and grey by design — the only "colour" is ink.
 * Looping animations opt in with data-wg so prefers-reduced-motion can stop
 * them (see marketing.css).
 */
import type { FeatureVisual } from "@/data/marketing/features"
import type { BentoVisual } from "@/data/marketing/landing"
import { APP_NAME, APP_DOMAIN } from "@/lib/constants"

const SERIF = "var(--mk-serif)"
const MONO = "var(--mk-mono)"

/* ── window chrome ─────────────────────────────────────────────────── */
export function BrowserFrame({
  url,
  children,
  live,
  label,
  style,
}: {
  url: string
  children: React.ReactNode
  live?: boolean
  /** Accessible description; the mock itself is presentational. */
  label?: string
  style?: React.CSSProperties
}) {
  return (
    <div className="mk-frame" style={style} role={label ? "img" : undefined} aria-label={label}>
      <div className="mk-frame-bar" aria-hidden>
        <span className="mk-frame-dots"><span /><span /><span /></span>
        <span className="mk-frame-url">{url}</span>
        {live ? (
          <span className="mk-live" data-wg=""><span className="mk-live-dot" />LIVE</span>
        ) : (
          <span style={{ width: 44 }} />
        )}
      </div>
      <div aria-hidden>{children}</div>
    </div>
  )
}

function Av({ initials, size = 22, ink }: { initials: string; size?: number; ink?: boolean }) {
  return (
    <span className={`mk-ui-avatar${ink ? " ink" : ""}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  )
}

function Icon({ d, size = 13 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}
const I = {
  eye: "M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Zm6.5 1.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  clock: "M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13ZM8 4.5V8l2.5 1.5",
  link: "M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-1 1M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l1-1",
  grid: "M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z",
  hand: "M3 9l3-3 2 2 5-5M9 3h4v4",
  bar: "M2 13V7M6 13V3M10 13V9M14 13V5",
  file: "M4 1.5h5l3.5 3.5v9.5h-8.5zM9 1.5V5h3.5",
  blocks: "M2 2h5v5H2zM9 9h5v5H9zM9 2h5v5H9z",
  gear: "M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2",
  plus: "M8 3v10M3 8h10",
  spark: "M8 2l1.4 3.6L13 7l-3.6 1.4L8 12l-1.4-3.6L3 7l3.6-1.4z",
  arrow: "M3 8h10M9 4l4 4-4 4",
  back: "M13 8H3M7 4L3 8l4 4",
  check: "M3 8.5l3 3 7-7",
  bell: "M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3",
  video: "M2 4h8v8H2zM10 7l4-2v6l-4-2",
  lock: "M4 7h8v7H4zM5.5 7V5a2.5 2.5 0 0 1 5 0v2",
  mail: "M2 4h12v8H2zM2 4l6 5 6-5",
  cal: "M2 4h12v10H2zM2 7h12M5 2v3M11 2v3",
  user: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 14a5.5 5.5 0 0 1 11 0",
  play: "M5 3l8 5-8 5z",
  search: "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM14 14l-3.5-3.5",
  layers: "M8 2l6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3",
  globe: "M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13ZM1.5 8h13M8 1.5c2 2 2 11 0 13M8 1.5c-2 2-2 11 0 13",
  share: "M12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM4 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.7 7.1l4.6-2.7M5.7 8.9l4.6 2.7",
  upload: "M8 11V3M4.5 6.5L8 3l3.5 3.5M2.5 13.5h11",
}

/* ── Dashboard (/dashboard) ────────────────────────────────────────── */
const NAV = [
  ["Pages", I.grid, true],
  ["Deals", I.hand, false],
  ["Analytics", I.bar, false],
  ["Submissions", I.file, false],
  ["Library", I.blocks, false],
  ["Settings", I.gear, false],
] as const

const DASH_CARDS = [
  { title: "Q3 Partnership Proposal", deal: "Northwind Q3", views: 38, time: "5:12", clicks: 3, status: "Live", ago: "2h ago" },
  { title: "Globex Customer Onboarding", deal: "Globex renewal", views: 21, time: "3:48", clicks: 1, status: "Live", ago: "1d ago" },
  { title: "Executive One-Pager — Initech", deal: "", views: 0, time: "—", clicks: 0, status: "Draft", ago: "just now" },
]

const ACTIVITY = [
  ["MC", "Maya Chen viewed Pricing", "2m ago"],
  ["MC", "Maya Chen clicked Approve & sign", "4m ago"],
  ["DO", "Dan Ortiz opened Q3 Partnership Proposal", "3h ago"],
]

function Rail() {
  return (
    <div className="mk-dash-side" style={{ width: 160, borderRight: "1px solid var(--db-border)", padding: 12, display: "flex", flexDirection: "column", gap: 3, background: "var(--db-surface)", flexShrink: 0 }}>
      <div className="mk-ui-row" style={{ padding: "2px 6px 12px", gap: 8 }}>
        <span className="mk-brand-mark" style={{ width: 22, height: 22, borderRadius: 6, fontSize: 13 }}>{APP_NAME.charAt(0)}</span>
        <span style={{ fontWeight: 600, fontSize: 12.5 }}>{APP_NAME}</span>
      </div>
      {NAV.map(([label, d, active]) => (
        <div key={label} className="mk-ui-row" style={{ gap: 8, fontSize: 12, padding: "6px 8px", borderRadius: 7, color: active ? "var(--db-text)" : "var(--db-text-secondary)", background: active ? "var(--db-surface-dim)" : "transparent", border: active ? "1px solid var(--db-border)" : "1px solid transparent", fontWeight: active ? 600 : 400 }}>
          <Icon d={d} />{label}
        </div>
      ))}
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--db-border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="mk-ui-row mk-ui-muted" style={{ gap: 8, fontSize: 11, padding: "2px 8px" }}><Icon d={I.layers} size={11} />Collapse</div>
        <div className="mk-ui-row" style={{ gap: 8, padding: "2px 6px" }}>
          <Av initials="SO" size={22} ink />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>Semih O.</span>
            <span className="mk-ui-label" style={{ fontSize: 8.5 }}>Team plan</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** Page-card thumbnail: the real one renders the page title over skeleton lines with a top accent bar. */
function Thumb({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: "1px solid var(--db-border)", background: "var(--db-surface-dim)", padding: "0 0 10px" }}>
      <div style={{ height: 3, background: "var(--db-text)" }} />
      <div style={{ padding: "10px 12px 0" }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <span className="mk-ui-line" style={{ display: "block", width: 26, height: 2, marginTop: 4, background: "var(--db-text)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
          {[92, 78, 84, 58].map((w, i) => <span key={i} className="mk-ui-line" style={{ width: `${w}%`, height: 4, background: "var(--db-surface-deep)" }} />)}
        </div>
        <span className="mk-ui-pill dim" style={{ marginTop: 10, width: 60, height: 10, padding: 0 }} />
      </div>
    </div>
  )
}

export function DashboardVisual() {
  return (
    <div className="mk-ui" style={{ display: "flex", background: "var(--db-bg)", minHeight: 520, overflow: "hidden" }}>
      <Rail />
      <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        {/* masthead */}
        <div className="mk-ui-panel" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", gap: 16, overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", zIndex: 1 }}>
            <span className="mk-ui-label">Workspace</span>
            <span style={{ fontFamily: SERIF, fontSize: 26, letterSpacing: "-0.01em", lineHeight: 1 }}>Your pages</span>
            <span className="mk-ui-sec" style={{ fontSize: 11.5, maxWidth: 300 }}>Build a page per deal, share one link, and watch how buyers engage.</span>
            <div className="mk-ui-row" style={{ gap: 6, marginTop: 6 }}>
              <span className="mk-ui-btn ink" style={{ borderRadius: 999 }}><Icon d={I.plus} size={11} />New page</span>
              <span className="mk-ui-btn" style={{ borderRadius: 999 }}><Icon d={I.spark} size={11} />Create with AI</span>
              <span className="mk-ui-btn" style={{ borderRadius: 999, padding: "6px 8px" }}>···</span>
            </div>
          </div>
          <svg aria-hidden viewBox="0 0 220 120" width="220" height="120" style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "auto", opacity: .35 }} fill="none" stroke="var(--db-text)" strokeWidth=".8">
            <path d="M0 110 C40 90 60 40 110 50 S180 20 220 10" /><path d="M0 120 C50 110 70 70 120 78 S190 50 220 40" />
            {[20, 60, 100, 140, 180].map((x, i) => <rect key={x} x={x} y={80 - i * 12} width="10" height={40 + i * 12} />)}
            <circle cx="190" cy="30" r="16" /><circle cx="190" cy="30" r="6" />
          </svg>
        </div>
        {/* stats */}
        <div className="mk-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {[["Total views", "1,284", "Across all pages", I.eye], ["Avg. time on page", "4:38", "How long buyers stay", I.clock], ["Live pages", "6", "Published and shareable", I.globe]].map(([label, value, sub, d]) => (
            <div key={label} className="mk-ui-panel" style={{ padding: "11px 13px" }}>
              <div className="mk-ui-row" style={{ justifyContent: "space-between" }}><span className="mk-ui-label">{label}</span><span style={{ color: "var(--db-text-muted)" }}><Icon d={d} size={12} /></span></div>
              <div style={{ fontFamily: SERIF, fontSize: 26, marginTop: 4, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div className="mk-ui-muted" style={{ fontSize: 10, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
        {/* toolbar */}
        <div className="mk-ui-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div className="mk-ui-row" style={{ gap: 2, border: "1px solid var(--db-border)", borderRadius: 999, padding: 2 }}>
            <span className="mk-ui-pill ink" style={{ border: "none" }}>All</span><span className="mk-ui-pill" style={{ border: "none" }}>Live</span><span className="mk-ui-pill" style={{ border: "none" }}>Drafts</span>
          </div>
          <div className="mk-ui-row" style={{ gap: 6 }}>
            <span className="mk-ui-pill dim" style={{ color: "var(--db-text-muted)", width: 110 }}><Icon d={I.search} size={10} />Search…</span>
            <span className="mk-ui-pill">Last modified ▾</span>
            <span className="mk-ui-row" style={{ gap: 0, border: "1px solid var(--db-border)", borderRadius: 7, overflow: "hidden" }}>
              <span style={{ padding: "4px 6px", background: "var(--db-accent)", color: "var(--db-on-accent)", display: "inline-flex" }}><Icon d={I.grid} size={10} /></span>
              <span style={{ padding: "4px 6px", display: "inline-flex", color: "var(--db-text-muted)" }}><Icon d={I.bar} size={10} /></span>
            </span>
          </div>
        </div>
        {/* cards */}
        <div className="mk-dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {DASH_CARDS.map((c) => (
            <div key={c.title} className="mk-ui-panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Thumb title={c.title} />
              <div style={{ padding: "10px 12px 11px", display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                {c.deal ? <span className="mk-ui-pill dim" style={{ alignSelf: "flex-start", fontSize: 9.5 }}><Icon d={I.hand} size={9} />{c.deal}</span> : <span style={{ height: 18 }} />}
                <span className="mk-ui-row mk-ui-muted" style={{ gap: 8, fontSize: 10 }}>
                  <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.eye} size={10} />{c.views} views</span>
                  <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.clock} size={10} />{c.time}</span>
                  <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.link} size={10} />{c.clicks}</span>
                </span>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--db-border)", paddingTop: 7 }}>
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 6, fontSize: 10 }}><Av initials="SO" size={16} ink />{c.ago}</span>
                  <span className={`mk-ui-pill ${c.status === "Live" ? "ink" : "dim"}`} style={{ fontSize: 9 }}>
                    {c.status === "Live" && <span data-wg="" className="mk-live-dot" style={{ width: 5, height: 5, filter: "invert(1)" }} />}{c.status}
                  </span>
                </div>
                <div className="mk-ui-row" style={{ gap: 6 }}>
                  <span className="mk-ui-btn" style={{ flex: 1, justifyContent: "center", fontSize: 10.5, padding: "5px 8px" }}>Edit</span>
                  <span className="mk-ui-btn" style={{ flex: 1, justifyContent: "center", fontSize: 10.5, padding: "5px 8px" }}>{c.status === "Live" ? "View" : "Preview"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* recent activity drawer */}
      <div className="mk-dash-aside" style={{ width: 172, borderLeft: "1px solid var(--db-border)", background: "var(--db-surface)", padding: 14, flexShrink: 0 }}>
        <div className="mk-ui-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: SERIF, fontSize: 14 }}>Recent activity</span><span className="mk-ui-label" style={{ fontSize: 8.5 }}>View all</span>
        </div>
        {ACTIVITY.map(([ini, text, when]) => (
          <div key={text} className="mk-ui-row" style={{ gap: 8, alignItems: "flex-start", padding: "7px 0", borderTop: "1px solid var(--db-border)" }}>
            <Av initials={ini} size={18} ink={ini === "MC"} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1.3 }}>
              <span style={{ fontSize: 10.5 }}>{text}</span>
              <span className="mk-ui-muted" style={{ fontSize: 9 }}>{when}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Editor (/editor/[id]) ──────────────────────────────────────────── */
const SLASH_ITEMS = [
  ["Table", "Insert a 3×3 table"],
  ["Metrics", "Display key stats & numbers"],
  ["Button", "Call-to-action button with link"],
  ["Form", "Collect leads with a form"],
  ["Synced Block", "Insert a reusable content block"],
]

function ToolbarGlyph({ label, w = 22 }: { label: string; w?: number }) {
  return <span style={{ width: w, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, borderRadius: 5, color: "var(--db-text-secondary)" }}>{label}</span>
}

export function EditorVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-surface)", minHeight: 520, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid var(--db-border)" }}>
        <div className="mk-ui-row" style={{ gap: 8 }}>
          <span className="mk-ui-row mk-ui-sec" style={{ gap: 4, fontSize: 11.5 }}><Icon d={I.back} size={11} />Back</span>
          <span className="mk-ui-pill dim" style={{ fontSize: 9.5 }}>Draft</span>
          <span className="mk-ui-row mk-ui-muted" style={{ gap: 5, fontSize: 10.5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--db-text)" }} />Saved</span>
        </div>
        <div className="mk-ui-row" style={{ gap: 5 }}>
          <span className="mk-ui-btn" style={{ background: "var(--db-surface-dim)" }}>Design</span>
          <span className="mk-ui-btn"><Icon d={I.spark} size={11} />AI Edit</span>
          <span className="mk-ui-btn">Preview</span>
          <span className="mk-ui-btn">Copy Link</span>
          <span className="mk-ui-btn"><Icon d={I.share} size={11} />Share</span>
          <span className="mk-ui-btn ink"><Icon d={I.globe} size={11} />Publish</span>
        </div>
      </div>

      {/* floating toolbar */}
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
        <div className="mk-ui-panel" style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 6px", boxShadow: "var(--db-shadow-2)", borderRadius: 12 }}>
          <ToolbarGlyph label="B" /><ToolbarGlyph label="I" /><ToolbarGlyph label="S" /><ToolbarGlyph label="A" />
          <span style={{ width: 1, height: 16, background: "var(--db-border)", margin: "0 4px" }} />
          <span style={{ background: "var(--db-surface-dim)", borderRadius: 5 }}><ToolbarGlyph label="H1" w={26} /></span><ToolbarGlyph label="H2" w={26} /><ToolbarGlyph label="H3" w={26} />
          <span style={{ width: 1, height: 16, background: "var(--db-border)", margin: "0 4px" }} />
          <ToolbarGlyph label="≡" /><ToolbarGlyph label="1." /><ToolbarGlyph label="❝" /><ToolbarGlyph label="▣" /><ToolbarGlyph label="—" />
          <span style={{ width: 1, height: 16, background: "var(--db-border)", margin: "0 4px" }} />
          <ToolbarGlyph label="↶" /><ToolbarGlyph label="↷" />
          <span className="mk-ui-btn ink" style={{ marginLeft: 6, borderRadius: 8 }}><Icon d={I.plus} size={11} />Add Element</span>
        </div>
      </div>

      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", padding: "22px 24px 20px" }}>
        <span className="mk-ui-pill dim" style={{ fontSize: 10 }}><Icon d={I.file} size={10} />Add cover image</span>
        <div className="mk-ui-label" style={{ marginTop: 14 }}>Prepared for Northwind</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 6 }}>Q3 Partnership Proposal</div>
        <div className="mk-ui-muted" style={{ fontSize: 13, marginTop: 6 }}>Add a subtitle</div>

        <div className="mk-ui-row" style={{ gap: 16, marginTop: 18, padding: "0 12px", background: "var(--db-surface-dim)", borderRadius: 8 }}>
          {["Overview", "Solution", "Pricing", "Proof", "Next Steps"].map((t, i) => (
            <span key={t} style={{ padding: "9px 0", fontSize: 11.5, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 2 ? "2px solid var(--db-text)" : "2px solid transparent" }}>{t}</span>
          ))}
          <span className="mk-ui-muted" style={{ fontSize: 13 }}>+</span>
          <span className="mk-ui-row mk-ui-muted" style={{ marginLeft: "auto", gap: 4, fontSize: 10 }}><Icon d={I.link} size={10} />Add links</span>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 18 }}>Pricing</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
          <span className="mk-ui-line soft" style={{ width: "94%" }} /><span className="mk-ui-line soft" style={{ width: "72%" }} />
        </div>
        {/* slash menu */}
        <div style={{ marginTop: 12, position: "relative", zIndex: 4 }}>
          <div className="mk-ui-row" style={{ fontSize: 12.5, gap: 0 }}>
            <span style={{ fontFamily: MONO, color: "var(--db-text)" }}>/met</span>
            <span data-wg="" style={{ width: 1.5, height: 15, background: "var(--db-text)", marginLeft: 1, animation: "mk-blink 1s steps(2) infinite" }} />
          </div>
          <div className="mk-ui-panel" style={{ position: "absolute", left: 0, top: 24, width: 236, boxShadow: "var(--db-shadow-2)", zIndex: 2, overflow: "hidden" }}>
            {SLASH_ITEMS.map(([t, d], i) => (
              <div key={t} className="mk-ui-row" style={{ gap: 10, padding: "7px 10px", background: i === 1 ? "var(--db-surface-dim)" : "transparent" }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--db-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--db-surface)" }}><Icon d={i === 1 ? I.bar : I.blocks} size={11} /></span>
                <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500 }}>{t}</span>
                  <span className="mk-ui-muted" style={{ fontSize: 9.5 }}>{d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mk-ui-panel" style={{ marginTop: 34, overflow: "hidden" }}>
          {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"], ["Total", "$54,500"]].map(([l, v], i) => (
            <div key={l} className="mk-ui-row" style={{ justifyContent: "space-between", padding: "8px 12px", fontSize: 12, borderTop: i ? "1px solid var(--db-border)" : "none", fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)", background: i === 2 ? "var(--db-surface-dim)" : "transparent" }}>
              <span>{l}</span><span className="mk-tnum">{v}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Design popover (anchored under the Design button) */}
      <div className="mk-editor-side mk-ui-panel" style={{ position: "absolute", right: 14, top: 44, width: 196, padding: 12, boxShadow: "var(--db-shadow-3)", display: "flex", flexDirection: "column", gap: 9, zIndex: 3 }}>
        <div className="mk-ui-row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600 }}>Style</span><span className="mk-ui-label" style={{ fontSize: 8.5 }}>Team default</span></div>
        <span className="mk-ui-btn" style={{ justifyContent: "center", fontSize: 10.5 }}>Apply brand kit</span>
        {[["Theme", "Editorial"], ["Body font", "DM Sans"], ["Heading font", "Instrument Serif"], ["Width", "Default"], ["Corners", "Soft"], ["Tabs", "Top"]].map(([k, v]) => (
          <div key={k} className="mk-ui-row" style={{ justifyContent: "space-between" }}>
            <span className="mk-ui-label" style={{ fontSize: 8.5 }}>{k}</span>
            <span className="mk-ui-pill dim" style={{ fontSize: 10 }}>{v} ▾</span>
          </div>
        ))}
        <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
          <span className="mk-ui-label" style={{ fontSize: 8.5 }}>Color</span>
          <div className="mk-ui-row" style={{ gap: 5 }}>
            {["var(--db-text)", "var(--db-text-secondary)", "var(--db-text-muted)", "var(--db-surface-deep)"].map((c, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, outline: i === 0 ? "2px solid var(--db-text)" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Published buyer page (/p/[slug]) ──────────────────────────────── */
const MAP_ITEMS = [
  ["Security review returned", "Buyer", "Maya Chen", "Sep 20", "done"],
  ["Pricing approved by finance", "Buyer", "Dan Ortiz", "Sep 25", "done"],
  ["Rollout plan agreed", "Seller", "Semih O.", "Sep 30", "done"],
  ["Legal redlines resolved", "Seller", "Semih O.", "Oct 7", "open"],
  ["Signature", "Buyer", "Maya Chen", "Oct 14", "open"],
] as const

export function BuyerVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-surface)", minHeight: 520, position: "relative", overflow: "hidden" }}>
      <div style={{ height: 118, background: "var(--db-accent)", color: "var(--db-on-accent)", padding: "16px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
          <span className="mk-ui-row" style={{ gap: 7 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--db-on-accent)", color: "var(--db-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>A</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", opacity: .85 }}>ACME</span>
          </span>
          <span className="mk-ui-pill" style={{ background: "transparent", color: "var(--db-on-accent)", borderColor: "var(--db-ink-rule)", fontSize: 9.5 }}>Made for Maya · Northwind</span>
        </div>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Q3 Partnership Proposal</span>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "14px 26px 0" }}>
        <div className="mk-ui-row" style={{ gap: 16, padding: "0 12px", background: "var(--db-surface-dim)", borderRadius: 8 }}>
          {["Overview", "Solution", "Pricing", "Proof", "Next Steps"].map((t, i) => (
            <span key={t} style={{ padding: "9px 0", fontSize: 11.5, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 2 ? "2px solid var(--db-text)" : "2px solid transparent" }}>{t}</span>
          ))}
        </div>

        <div className="mk-buyer-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 22, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Pricing</div>
            {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"], ["Total", "$54,500"]].map(([l, v], i) => (
              <div key={l} className="mk-ui-row" style={{ justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: "1px solid var(--db-border)", fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)" }}>
                <span>{l}</span><span className="mk-tnum">{v}</span>
              </div>
            ))}
            <div className="mk-ui-row" style={{ gap: 10, marginTop: 12 }}>
              <span className="mk-ui-btn ink" style={{ borderRadius: 8, padding: "8px 16px" }}>Approve &amp; sign</span>
              <span className="mk-ui-row mk-ui-muted" style={{ gap: 5, fontSize: 10.5 }}><Icon d={I.cal} size={11} />Book a call</span>
            </div>
          </div>
          <div>
            <div className="mk-ui-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Mutual action plan</div>
                <div className="mk-ui-row mk-ui-muted" style={{ gap: 4, fontSize: 10 }}><Icon d={I.cal} size={10} />Target close: October 14, 2026</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>60%</div>
                <div className="mk-ui-muted" style={{ fontSize: 9.5 }}>3 of 5</div>
              </div>
            </div>
            <div className="mk-ui-bar" style={{ margin: "9px 0 4px", height: 3 }}><span data-wg="" style={{ width: "60%", animation: "mk-fill 1.4s var(--mk-ease) both" }} /></div>
            {MAP_ITEMS.map(([t, who, name, date, st]) => (
              <div key={t} className="mk-ui-row" style={{ gap: 8, padding: "6px 0", borderTop: "1px solid var(--db-border)", alignItems: "flex-start" }}>
                <span className={`mk-ui-check${st === "done" ? " done" : ""}`} style={{ borderRadius: "50%", marginTop: 1 }}>{st === "done" ? "✓" : ""}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 11, textDecoration: st === "done" ? "line-through" : "none", opacity: st === "done" ? .6 : 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 6, fontSize: 9 }}>
                    <span className={`mk-ui-pill${who === "Buyer" ? " ink" : " dim"}`} style={{ fontSize: 8.5, padding: "1px 6px" }}>{who}</span>
                    <span className="mk-ui-row" style={{ gap: 2 }}><Icon d={I.user} size={9} />{name}</span>
                    <span className="mk-ui-row" style={{ gap: 2 }}><Icon d={I.cal} size={9} />{date}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mk-ui-label" style={{ textAlign: "center", padding: "14px 0 12px", fontSize: 8.5, borderTop: "1px solid var(--db-border)", marginTop: 14 }}>Powered by {APP_NAME} &nbsp;·&nbsp; Privacy</div>
    </div>
  )
}

/* ── Analytics (/analytics/[pageId]) ───────────────────────────────── */
const VISITORS = [
  ["Maya Chen", "MC", "3", "2m ago", "18m 40s", 92, "Pricing", true, "High Intent"],
  ["Dan Ortiz", "DO", "1", "3h ago", "6m 12s", 48, "Overview", false, "Warm"],
  ["Priya Nair", "PN", "1", "2d ago", "1m 05s", 12, "Overview", false, "Cold"],
] as const
const SECTIONS = [["Overview", "4m 10s", 70, 3], ["Pricing", "6m 02s", 100, 4], ["Proof", "1m 20s", 22, 1], ["Next Steps", "Not viewed", 0, 0]] as const
const TL = [["Maya Chen", "Viewed “Pricing” for 2m 10s", "2m ago", I.eye], ["Maya Chen", "Clicked CTA: Approve & sign", "4m ago", I.arrow], ["Maya Chen", "Return visit (session #3)", "6m ago", I.user]] as const

export function AnalyticsVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-bg)", minHeight: 520, padding: "16px 20px 18px", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="mk-ui-row mk-ui-muted" style={{ gap: 4, fontSize: 10.5 }}><Icon d={I.back} size={10} />Analytics</div>
          <div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1.1, marginTop: 2 }}>Q3 Partnership Proposal</div>
          <div className="mk-ui-row" style={{ gap: 6, marginTop: 6 }}>
            <span className="mk-ui-pill ink" style={{ fontSize: 9 }}><Icon d={I.globe} size={9} />Published</span>
            <span className="mk-ui-pill dim" style={{ fontSize: 9 }}>Team visible</span>
            <span className="mk-ui-muted" style={{ fontSize: 9.5 }}>Created Sep 15 · Updated 2h ago · /p/q3-partnership-proposal</span>
          </div>
        </div>
        <div className="mk-ui-row" style={{ gap: 5 }}>
          <span className="mk-ui-btn">Edit</span><span className="mk-ui-btn">View</span><span className="mk-ui-btn ink"><Icon d={I.share} size={11} />Share</span>
        </div>
      </div>

      <div className="mk-an-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {[["Last Viewed", "2m ago", I.bar], ["Views", "38", I.eye], ["Time Spent", "1h 12m", I.clock], ["High Intent", "3", I.user]].map(([l, v, d]) => (
          <div key={l} className="mk-ui-panel" style={{ padding: "10px 12px" }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--db-surface-dim)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon d={d} size={11} /></span>
            <div style={{ fontFamily: SERIF, fontSize: 22, marginTop: 6, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            <div className="mk-ui-muted" style={{ fontSize: 10, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="mk-an-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.4fr)", gap: 10, alignItems: "start" }}>
        <div className="mk-ui-panel" style={{ padding: "11px 13px" }}>
          <div className="mk-ui-row" style={{ gap: 6 }}><Icon d={I.layers} size={12} /><span style={{ fontSize: 12, fontWeight: 600 }}>Section engagement</span></div>
          <div className="mk-ui-muted" style={{ fontSize: 9.5, marginBottom: 6 }}>Time buyers spent in each part of this page</div>
          {SECTIONS.map(([t, time, pct, n], i) => (
            <div key={t} className="mk-ui-row" style={{ gap: 8, padding: "6px 0", borderTop: "1px solid var(--db-border)", fontSize: 10.5 }}>
              <span style={{ width: 64, flexShrink: 0 }}>{t}</span>
              <span className="mk-ui-bar" style={{ flex: 1, height: 4 }}><span data-wg="" style={{ width: `${pct}%`, animation: "mk-fill 1.2s var(--mk-ease) both", animationDelay: `${i * 120}ms` }} /></span>
              <span className={pct ? "mk-ui-sec mk-tnum" : "mk-ui-muted"} style={{ width: 48, textAlign: "right", fontStyle: pct ? "normal" : "italic", fontSize: 10 }}>{time}</span>
              <span className="mk-ui-muted mk-tnum" style={{ width: 18, textAlign: "right", fontSize: 10 }}>{n ? `${n}×` : ""}</span>
            </div>
          ))}
        </div>
        <div className="mk-ui-panel" style={{ overflow: "hidden" }}>
          <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "9px 12px" }}>
            <span className="mk-ui-row" style={{ gap: 6 }}><Icon d={I.user} size={12} /><span style={{ fontSize: 12, fontWeight: 600 }}>Buyer Analytics</span></span>
            <span className="mk-ui-row" style={{ gap: 2 }}><span className="mk-ui-pill" style={{ fontSize: 9 }}>7 days</span><span className="mk-ui-pill ink" style={{ fontSize: 9 }}>30 days</span><span className="mk-ui-pill" style={{ fontSize: 9 }}>All time</span></span>
          </div>
          <div className="mk-an-table" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) .6fr .8fr .8fr .8fr .9fr .4fr .9fr", gap: 6, padding: "6px 12px", borderTop: "1px solid var(--db-border)", background: "var(--db-surface-dim)" }}>
            {["Visitor", "Sessions", "Last seen", "Time spent", "Score", "Most viewed", "CTA", "Intent"].map((h) => <span key={h} className="mk-ui-label" style={{ fontSize: 8 }}>{h}</span>)}
          </div>
          {VISITORS.map(([name, ini, sessions, seen, time, score, tab, cta, intent]) => (
            <div key={name} className="mk-an-table" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) .6fr .8fr .8fr .8fr .9fr .4fr .9fr", gap: 6, padding: "7px 12px", borderTop: "1px solid var(--db-border)", fontSize: 10.5, alignItems: "center" }}>
              <span className="mk-ui-row" style={{ gap: 6, minWidth: 0 }}><Av initials={ini} size={18} ink={intent === "High Intent"} /><span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span></span>
              <span className="mk-tnum">{sessions}</span>
              <span className="mk-ui-sec">{seen}</span>
              <span className="mk-ui-sec mk-tnum">{time}</span>
              <span className="mk-ui-row" style={{ gap: 5 }}><span className="mk-ui-bar" style={{ width: 28, height: 4 }}><span data-wg="" style={{ width: `${score}%`, animation: "mk-fill 1.2s var(--mk-ease) both" }} /></span><span className="mk-tnum">{score}</span></span>
              <span className="mk-ui-sec">{tab}</span>
              <span>{cta ? "✓" : <span className="mk-ui-muted">–</span>}</span>
              <span className={`mk-ui-pill${intent === "High Intent" ? " ink" : intent === "Warm" ? "" : " dim"}`} style={{ fontSize: 8.5, padding: "2px 6px", justifyContent: "center" }}>{intent}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--db-border)", padding: "8px 12px 10px" }}>
            <div className="mk-ui-row" style={{ justifyContent: "space-between", marginBottom: 4 }}><span className="mk-ui-row" style={{ gap: 6 }}><Icon d={I.bar} size={11} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>Activity Timeline</span></span><span className="mk-ui-label" style={{ fontSize: 8 }}>Today</span></div>
            {TL.map(([w, e, t, d]) => (
              <div key={e} className="mk-ui-row" style={{ gap: 7, fontSize: 10.5, padding: "4px 0" }}>
                <span className="mk-ui-muted"><Icon d={d} size={10} /></span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong style={{ fontWeight: 600 }}>{w}</strong> · {e}</span>
                <span className="mk-ui-muted" style={{ marginLeft: "auto", flexShrink: 0 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── AI Write (/ai) ────────────────────────────────────────────────── */
export function AiVisual() {
  return (
    <div className="mk-ui mk-ai-grid" style={{ background: "var(--db-bg)", minHeight: 520, display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", overflow: "hidden" }}>
      <div style={{ borderRight: "1px solid var(--db-border)", background: "var(--db-surface)", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="mk-ui-row" style={{ gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--db-accent)", color: "var(--db-on-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.spark} size={12} /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}><span style={{ fontSize: 12, fontWeight: 600 }}>Create with AI</span><span className="mk-ui-muted" style={{ fontSize: 9.5 }}>Describe your page — watch it build</span></span>
        </div>
        <div className="mk-ui-row" style={{ gap: 0, background: "var(--db-surface-dim)", borderRadius: 999, padding: 2 }}>
          {["Chat", "Structure", "Design"].map((t, i) => <span key={t} style={{ flex: 1, textAlign: "center", fontSize: 10.5, padding: "5px 0", borderRadius: 999, background: i === 0 ? "var(--db-surface)" : "transparent", fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--db-text)" : "var(--db-text-muted)", boxShadow: i === 0 ? "var(--db-shadow-1)" : "none" }}>{t}</span>)}
        </div>
        <div style={{ alignSelf: "flex-end", maxWidth: "92%", background: "var(--db-accent)", color: "var(--db-on-accent)", borderRadius: "12px 12px 2px 12px", padding: "9px 12px", fontSize: 11.5, lineHeight: 1.45 }}>
          Proposal for Northwind — $54k annual platform licence, onboarding, a 3-step rollout and clear next steps.
        </div>
        <div className="mk-ui-panel" style={{ padding: "10px 12px", fontSize: 11, lineHeight: 1.5 }}>
          <div className="mk-ui-label" style={{ marginBottom: 6 }}>Plan</div>
          <div><strong style={{ fontWeight: 600 }}>Title</strong> · Q3 Partnership Proposal</div>
          <div><strong style={{ fontWeight: 600 }}>Tabs</strong> · Overview, Pricing, Rollout, Next steps</div>
          <div><strong style={{ fontWeight: 600 }}>CTA</strong> · Approve &amp; sign</div>
          <div className="mk-ui-row" style={{ gap: 6, marginTop: 8, color: "var(--db-text-secondary)" }}>
            <span data-wg="" className="mk-live-dot" style={{ width: 5, height: 5 }} />Building tab 2 of 4…
          </div>
        </div>
        <div className="mk-ui-panel" style={{ padding: "10px 12px" }}>
          <div className="mk-ui-row" style={{ gap: 7, fontSize: 11 }}><Icon d={I.upload} size={11} /><span style={{ fontWeight: 500 }}>northwind-brief.pdf</span><span className="mk-ui-muted" style={{ marginLeft: "auto" }}>2.4 MB</span></div>
          <div className="mk-ui-bar" style={{ marginTop: 7, height: 3 }}><span data-wg="" style={{ width: "100%", animation: "mk-fill 4s linear infinite" }} /></div>
          <div className="mk-ui-muted" style={{ fontSize: 9.5, marginTop: 5 }}>Converting document into a page…</div>
        </div>
        <div className="mk-ui-panel" style={{ marginTop: "auto", padding: "10px 12px", borderRadius: 14 }}>
          <div className="mk-ui-muted" style={{ fontSize: 11 }}>Describe the page you want…</div>
          <div className="mk-ui-row" style={{ justifyContent: "space-between", marginTop: 12 }}><span className="mk-ui-muted" style={{ fontSize: 9.5 }}>Press Enter to send</span><span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--db-surface-dim)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.upload} size={10} /></span></div>
        </div>
      </div>
      <div style={{ padding: "22px 28px" }}>
        <div className="mk-ui-row" style={{ gap: 16, padding: "0 12px", background: "var(--db-surface-dim)", borderRadius: 8, marginBottom: 16 }}>
          {["Overview", "Pricing", "Rollout", "Next steps"].map((t, i) => (
            <span key={t} style={{ padding: "9px 0", fontSize: 11.5, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 1 ? "2px solid var(--db-text)" : "2px solid transparent", opacity: i > 1 ? .5 : 1 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>Pricing</div>
        <div data-wg="" style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
          {[100, 88, 64, 92, 40].map((w, i) => (
            <div key={i} className="mk-ui-line soft" style={{ width: `${w}%`, position: "relative", overflow: "hidden" }}>
              <span style={{ position: "absolute", inset: 0, background: "var(--db-text-secondary)", opacity: .55, animation: "mk-type 3.6s ease-in-out infinite", animationDelay: `${i * 0.35}s` }} />
            </div>
          ))}
        </div>
        <div className="mk-ui-panel" style={{ marginTop: 18, overflow: "hidden" }}>
          {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"]].map(([l, v], i) => (
            <div key={l} className="mk-ui-row" style={{ justifyContent: "space-between", padding: "9px 12px", fontSize: 12, borderTop: i ? "1px solid var(--db-border)" : "none", color: "var(--db-text-secondary)" }}>
              <span>{l}</span><span className="mk-tnum">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Deals pipeline (/deals) ───────────────────────────────────────── */
const COLS: { name: string; total: string; deals: [string, string, string, string, string, string][] }[] = [
  { name: "New", total: "$18,000", deals: [["Initech pilot", "$18,000", "Initech", "Cold · 2d ago", "2d in stage", "PN"]] },
  { name: "Qualified", total: "$69,500", deals: [["Globex renewal", "$42,000", "Globex", "Warm · 3h ago", "6d in stage", "DO"], ["Umbrella SOW", "$27,500", "Umbrella", "No buyer activity yet", "9d in stage", "SO"]] },
  { name: "Proposal", total: "$54,500", deals: [["Northwind Q3", "$54,500", "Northwind", "High Intent · 2m ago", "3d in stage", "MC"]] },
  { name: "Negotiation", total: "$96,000", deals: [["Acme expansion", "$96,000", "Acme", "High Intent · 1h ago", "1d in stage", "SO"]] },
  { name: "Won", total: "$74,000", deals: [["Stark onboarding", "$74,000", "Stark", "Won", "closed", "DO"]] },
]

export function PipelineVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-bg)", minHeight: 520, padding: "16px 20px 18px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1 }}>Deals</div>
          <div className="mk-ui-sec" style={{ fontSize: 11, marginTop: 4 }}>Every deal, its rooms, and how warm the buyer is — in one place.</div>
        </div>
        <span className="mk-ui-btn ink" style={{ borderRadius: 999 }}><Icon d={I.plus} size={11} />New deal</span>
      </div>
      <div className="mk-ui-row" style={{ gap: 16, borderBottom: "1px solid var(--db-border)" }}>
        {["Pipeline", "Contacts", "Companies"].map((t, i) => <span key={t} style={{ padding: "6px 0", fontSize: 11.5, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 0 ? "2px solid var(--db-text)" : "2px solid transparent", marginBottom: -1 }}>{t}</span>)}
      </div>
      <div className="mk-ui-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span className="mk-ui-sec" style={{ fontSize: 11 }}>Open pipeline <strong style={{ fontWeight: 600, color: "var(--db-text)" }}>$238,000</strong> across 5 open deals</span>
        <span className="mk-ui-row" style={{ gap: 5 }}>
          <span className="mk-ui-pill" style={{ fontSize: 9.5 }}>Warmth</span><span className="mk-ui-pill" style={{ fontSize: 9.5 }}><Icon d={I.cal} size={9} />Close date</span>
          <span className="mk-ui-pill dim" style={{ color: "var(--db-text-muted)", fontSize: 9.5, width: 96 }}><Icon d={I.search} size={9} />Search deals…</span>
          <span className="mk-ui-pill" style={{ fontSize: 9.5 }}>Edit columns</span>
        </span>
      </div>
      <div className="mk-pipe" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, flex: 1 }}>
        {COLS.map((col) => (
          <div key={col.name} style={{ background: col.name === "Won" ? "var(--db-surface-dim)" : "var(--db-surface-dim)", borderRadius: 10, padding: 6, display: "flex", flexDirection: "column", gap: 6, minHeight: 280 }}>
            <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "4px 4px 2px" }}>
              <span className="mk-ui-row" style={{ gap: 5, fontSize: 10.5, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: col.name === "Won" ? "var(--db-text)" : "var(--db-text-muted)" }} />{col.name} <span className="mk-ui-muted" style={{ fontWeight: 400 }}>{col.deals.length}</span></span>
              <span className="mk-ui-muted mk-tnum" style={{ fontSize: 9.5 }}>{col.total}</span>
            </div>
            {col.deals.map(([n, v, company, pulse, age, owner]) => (
              <div key={n} className="mk-ui-panel" style={{ padding: "9px 10px", display: "flex", flexDirection: "column", gap: 5, boxShadow: "var(--db-shadow-1)" }}>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</span>
                  <span className="mk-tnum" style={{ flexShrink: 0, fontWeight: 600 }}>{v}</span>
                </div>
                <span className="mk-ui-sec" style={{ fontSize: 10 }}>{company}</span>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", gap: 4 }}>
                  {pulse.includes("·") ? (
                    <span className="mk-ui-row" style={{ gap: 4, fontSize: 9, minWidth: 0, flexWrap: "wrap" }}><span className={`mk-ui-pill${pulse.startsWith("High") ? " ink" : pulse.startsWith("Cold") ? " dim" : ""}`} style={{ fontSize: 8, padding: "1px 5px" }}>{pulse.split(" · ")[0]}</span><span className="mk-ui-muted" style={{ whiteSpace: "nowrap" }}>{pulse.split(" · ")[1]}</span></span>
                  ) : (
                    <span className={pulse === "Won" ? "mk-ui-pill ink" : "mk-ui-muted"} style={{ fontSize: pulse === "Won" ? 8 : 9, padding: pulse === "Won" ? "1px 5px" : 0 }}>{pulse}</span>
                  )}
                  <span className="mk-ui-muted" style={{ fontSize: 9, whiteSpace: "nowrap" }}>{age}</span>
                </div>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--db-border)", paddingTop: 6 }}>
                  <span className="mk-ui-row" style={{ gap: 5, fontSize: 9.5 }}><Av initials={owner} size={15} ink={owner === "SO"} />Semih O.</span>
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 3, fontSize: 9 }}><Icon d={I.file} size={9} />1</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Frame URLs + registry ─────────────────────────────────────────── */
export const VISUAL_URLS: Record<FeatureVisual, string> = {
  dashboard: `app.${APP_DOMAIN}/dashboard`,
  editor: `app.${APP_DOMAIN}/editor/q3-partnership-proposal`,
  buyer: `acme.${APP_DOMAIN}/p/q3-partnership-proposal#pricing`,
  analytics: `app.${APP_DOMAIN}/analytics/q3-partnership-proposal`,
  ai: `app.${APP_DOMAIN}/ai`,
  pipeline: `app.${APP_DOMAIN}/deals`,
}

export const FEATURE_VISUALS: Record<FeatureVisual, () => JSX.Element> = {
  dashboard: DashboardVisual,
  editor: EditorVisual,
  buyer: BuyerVisual,
  analytics: AnalyticsVisual,
  ai: AiVisual,
  pipeline: PipelineVisual,
}

/** A framed product visual for any feature key. */
export function ProductFrame({ visual, label, live }: { visual: FeatureVisual; label?: string; live?: boolean }) {
  const V = FEATURE_VISUALS[visual]
  return (
    <BrowserFrame url={VISUAL_URLS[visual]} live={live ?? visual !== "editor"} label={label}>
      <V />
    </BrowserFrame>
  )
}

/* ── Bento tiles (decorative) ──────────────────────────────────────── */
function TplStack() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0, padding: "22px 20px 0" }}>
      {[
        ["Business Proposal", "paper", -8, 22],
        ["Mutual Action Plan", "ink", 0, 0],
        ["ROI Case Study", "dim", 8, 22],
      ].map(([t, tone, rot, y], i) => (
        <div key={t as string} className="mk-tpl" style={{ width: 150, marginLeft: i ? -40 : 0, transform: `rotate(${rot}deg) translateY(${y}px)`, zIndex: i === 1 ? 2 : 1, boxShadow: "var(--db-shadow-2)", animation: "mk-float 5s ease-in-out infinite", animationDelay: `${i * .6}s` }} data-wg="">
          <div className={`mk-tpl-cover ${tone}`} style={{ height: 78, padding: 10 }}>
            <span className="k">Template</span><span className="t" style={{ fontSize: 14 }}>{t as string}</span>
          </div>
          <div className="mk-tpl-body" style={{ padding: 10 }}>
            <span className="mk-ui-line soft" style={{ display: "block", width: "80%" }} /><span className="mk-ui-line soft" style={{ display: "block", width: "55%", marginTop: 5 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SyncedTile() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
      <div className="mk-ui-panel" style={{ padding: "8px 11px", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, boxShadow: "var(--db-shadow-1)" }}>
        <Icon d={I.blocks} size={12} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>Pricing table</span><span className="mk-ui-pill ink" style={{ fontSize: 8.5, padding: "2px 6px" }}>Synced · v3</span>
      </div>
      <svg width="100%" height="26" viewBox="0 0 200 26" fill="none" stroke="var(--db-border-hover)" strokeWidth="1" aria-hidden>
        <path d="M30 0v8c0 5 4 9 9 9h122c5 0 9 4 9 9M30 0v26M30 0v8c0 5-4 9-9 9H16" />
        <circle cx="30" cy="0" r="2" fill="var(--db-text)" />
      </svg>
      <div style={{ display: "flex", gap: 8 }}>
        {["Northwind Q3", "Globex renewal", "Acme expansion"].map((n, i) => (
          <div key={n} className="mk-ui-panel" style={{ flex: 1, padding: "7px 8px", fontSize: 9.5, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</span>
            <span className="mk-ui-bar" style={{ height: 3 }}><span data-wg="" style={{ width: "100%", animation: "mk-fill 1.6s var(--mk-ease) infinite alternate", animationDelay: `${i * .3}s` }} /></span>
            <span className="mk-ui-muted" style={{ fontSize: 8.5 }}>Updated</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AiTile() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
      <div style={{ alignSelf: "flex-end", background: "var(--db-accent)", color: "var(--db-on-accent)", borderRadius: "12px 12px 2px 12px", padding: "8px 11px", fontSize: 11, maxWidth: "88%" }}>Draft the Northwind renewal, $42k, two tabs.</div>
      <div className="mk-ui-panel" style={{ padding: "9px 11px", alignSelf: "flex-start", width: "88%", display: "flex", flexDirection: "column", gap: 6 }} data-wg="">
        {[100, 72, 88].map((w, i) => (
          <div key={i} className="mk-ui-line soft" style={{ width: `${w}%`, position: "relative", overflow: "hidden" }}>
            <span style={{ position: "absolute", inset: 0, background: "var(--db-text-secondary)", opacity: .5, animation: "mk-type 3s ease-in-out infinite", animationDelay: `${i * .4}s` }} />
          </div>
        ))}
      </div>
      <div className="mk-ui-row mk-ui-muted" style={{ gap: 6, fontSize: 10 }}><Icon d={I.upload} size={10} />or drop a PDF, DOCX, PPTX</div>
    </div>
  )
}

function GatesTile() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div className="mk-ui-panel" style={{ width: 210, padding: 16, textAlign: "center", boxShadow: "var(--db-shadow-2)" }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--db-surface-dim)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.lock} size={14} /></span>
        <div style={{ fontFamily: SERIF, fontSize: 15, marginTop: 8 }}>Enter password</div>
        <div className="mk-ui-pill dim" style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, letterSpacing: ".2em" }}>••••••••<span data-wg="" style={{ width: 1, height: 12, background: "var(--db-text)", animation: "mk-blink 1s steps(2) infinite" }} /></div>
        <div className="mk-ui-btn ink" style={{ marginTop: 8, width: "100%", justifyContent: "center", borderRadius: 999 }}>Continue</div>
      </div>
    </div>
  )
}

function NotifyTile() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div className="mk-ui-panel" style={{ width: "100%", maxWidth: 250, padding: "12px 14px", boxShadow: "var(--db-shadow-2)", animation: "mk-float 4s ease-in-out infinite" }} data-wg="">
        <div className="mk-ui-row" style={{ gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--db-accent)", color: "var(--db-on-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon d={I.bell} size={12} /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>New visitor on your page</span>
            <span className="mk-ui-muted" style={{ fontSize: 9.5 }}>{APP_NAME} · just now</span>
          </span>
        </div>
        <div className="mk-ui-sec" style={{ fontSize: 11, marginTop: 9, lineHeight: 1.45 }}><strong style={{ fontWeight: 600, color: "var(--db-text)" }}>Maya Chen</strong> opened <em>Q3 Partnership Proposal</em> and is reading Pricing.</div>
      </div>
    </div>
  )
}

function ReplayTile() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="mk-ui-panel" style={{ width: "100%", maxWidth: 240, overflow: "hidden", position: "relative", boxShadow: "var(--db-shadow-2)" }}>
        <div style={{ height: 104, overflow: "hidden", position: "relative" }}>
          <div data-wg="" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, animation: "mk-scroll-y 7s ease-in-out infinite" }}>
            <span className="mk-ui-line" style={{ width: "55%", height: 9 }} />
            {[90, 70, 84, 60, 92, 76, 66, 88].map((w, i) => <span key={i} className="mk-ui-line soft" style={{ width: `${w}%`, height: 5 }} />)}
          </div>
          <svg data-wg="" width="14" height="16" viewBox="0 0 14 16" style={{ position: "absolute", left: 40, top: 22, animation: "mk-cursor 7s ease-in-out infinite", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))" }} aria-hidden>
            <path d="M1 1l12 6-5 1.5L5.5 14z" fill="var(--db-text)" stroke="var(--db-surface)" strokeWidth="1" />
          </svg>
        </div>
        <div className="mk-ui-row" style={{ gap: 8, padding: "7px 10px", borderTop: "1px solid var(--db-border)", background: "var(--db-surface)" }}>
          <Icon d={I.play} size={10} />
          <span className="mk-ui-bar" style={{ flex: 1, height: 3 }}><span data-wg="" style={{ width: "100%", animation: "mk-fill 7s linear infinite" }} /></span>
          <span className="mk-ui-muted mk-tnum" style={{ fontSize: 9 }}>2:14</span>
        </div>
      </div>
    </div>
  )
}

function AttentionTile() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
      {[["Q3 Partnership Proposal", "visible", "4:38", true], ["Inbox (14)", "background", "0:00", false]].map(([t, s, v, on]) => (
        <div key={t as string} className="mk-ui-panel" style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, opacity: on ? 1 : .55 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "var(--db-text)" : "var(--db-border-hover)" }} />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t as string}</span>
            <span className="mk-ui-muted" style={{ fontSize: 9.5 }}>{s as string} tab</span>
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{v as string}</span>
          {on && <span data-wg="" style={{ width: 1.5, height: 14, background: "var(--db-text)", animation: "mk-blink 1s steps(2) infinite" }} />}
        </div>
      ))}
    </div>
  )
}

function BrandTile() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10, alignContent: "center" }}>
      <div className="mk-ui-panel" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="mk-ui-label">Brand kit</span>
        <div className="mk-ui-row" style={{ gap: 6 }}>
          {["var(--db-text)", "var(--db-text-secondary)", "var(--db-text-muted)", "var(--db-surface-deep)"].map((c, i) => <span key={i} style={{ width: 20, height: 20, borderRadius: 6, background: c, border: "1px solid var(--db-border)" }} />)}
        </div>
        <div className="mk-ui-row" style={{ gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1 }}>Aa</span>
          <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 500 }}>Aa</span>
          <span className="mk-ui-muted" style={{ fontSize: 9.5, marginLeft: "auto" }}>Editorial</span>
        </div>
      </div>
      <div className="mk-ui-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ height: 40, background: "var(--db-accent)", color: "var(--db-on-accent)", padding: "8px 10px", fontFamily: MONO, fontSize: 9, letterSpacing: ".12em" }}>ACME</div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontFamily: SERIF, fontSize: 13 }}>Inherited</span>
          <span className="mk-ui-line soft" style={{ width: "80%" }} /><span className="mk-ui-line soft" style={{ width: "50%" }} />
          <span className="mk-ui-btn ink" style={{ alignSelf: "flex-start", fontSize: 9.5, padding: "4px 8px", borderRadius: 999, marginTop: 3 }}>Apply brand kit</span>
        </div>
      </div>
    </div>
  )
}

export const BENTO_VISUALS: Record<BentoVisual, () => JSX.Element> = {
  templates: TplStack,
  synced: SyncedTile,
  ai: AiTile,
  gates: GatesTile,
  notify: NotifyTile,
  replay: ReplayTile,
  attention: AttentionTile,
  brand: BrandTile,
}
