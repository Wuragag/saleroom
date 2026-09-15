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
  { title: "Q3 Partnership Proposal", company: "Northwind", views: 38, time: "5:12", clicks: 3, status: "Live", tone: "ink", ago: "2h ago" },
  { title: "Renewal & Expansion", company: "Globex", views: 21, time: "3:48", clicks: 1, status: "Live", tone: "dim", ago: "1d ago" },
  { title: "Customer Onboarding", company: "Initech", views: 64, time: "6:31", clicks: 7, status: "Live", tone: "paper", ago: "3d ago" },
  { title: "Executive One-Pager", company: "Acme", views: 0, time: "—", clicks: 0, status: "Draft", tone: "dim", ago: "just now" },
]

export function DashboardVisual() {
  return (
    <div className="mk-ui" style={{ display: "flex", background: "var(--db-bg)", minHeight: 440, overflow: "hidden" }}>
      {/* icon rail */}
      <div className="mk-dash-side" style={{ width: 168, borderRight: "1px solid var(--db-border)", padding: 14, display: "flex", flexDirection: "column", gap: 4, background: "var(--db-surface)" }}>
        <div className="mk-ui-row" style={{ paddingBottom: 12, gap: 8 }}>
          <span className="mk-brand-mark" style={{ width: 22, height: 22, borderRadius: 6, fontSize: 13 }}>{APP_NAME.charAt(0)}</span>
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{APP_NAME}</span>
        </div>
        {NAV.map(([label, d, active]) => (
          <div key={label} className="mk-ui-row" style={{ gap: 8, fontSize: 12, padding: "6px 8px", borderRadius: 7, color: active ? "var(--db-text)" : "var(--db-text-secondary)", background: active ? "var(--db-surface-dim)" : "transparent", border: active ? "1px solid var(--db-border)" : "1px solid transparent", fontWeight: active ? 600 : 400 }}>
            <Icon d={d} />{label}
          </div>
        ))}
        <div className="mk-ui-row" style={{ marginTop: "auto", gap: 8, paddingTop: 12, borderTop: "1px solid var(--db-border)" }}>
          <Av initials="SO" size={24} ink />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>Semih O.</span>
            <span className="mk-ui-label" style={{ fontSize: 8.5 }}>Pro plan</span>
          </span>
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="mk-ui-label">Workspace</div>
            <div style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: "-0.01em", marginTop: 2 }}>Your pages</div>
          </div>
          <div className="mk-ui-row" style={{ gap: 6 }}>
            <span className="mk-ui-btn"><Icon d={I.spark} size={11} />Create with AI</span>
            <span className="mk-ui-btn ink"><Icon d={I.plus} size={11} />New page</span>
          </div>
        </div>

        <div className="mk-dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {[["Total views", "1,284", "Across all pages", I.eye], ["Avg. time on page", "4:38", "How long buyers stay", I.clock], ["Live pages", "6", "Published and shareable", I.globe]].map(([label, value, sub, d]) => (
            <div key={label} className="mk-ui-panel" style={{ padding: "11px 13px" }}>
              <div className="mk-ui-row" style={{ gap: 6, color: "var(--db-text-muted)" }}><Icon d={d} size={11} /><span className="mk-ui-label">{label}</span></div>
              <div style={{ fontFamily: SERIF, fontSize: 24, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div className="mk-ui-muted" style={{ fontSize: 10.5 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="mk-ui-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div className="mk-ui-row" style={{ gap: 4 }}>
            <span className="mk-ui-pill ink">All</span><span className="mk-ui-pill">Live</span><span className="mk-ui-pill">Drafts</span>
          </div>
          <div className="mk-ui-row" style={{ gap: 6 }}>
            <span className="mk-ui-pill dim" style={{ color: "var(--db-text-muted)" }}><Icon d={I.search} size={10} />Search…</span>
            <span className="mk-ui-pill">Last modified</span>
          </div>
        </div>

        <div className="mk-dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {DASH_CARDS.map((c) => (
            <div key={c.title} className="mk-ui-panel" style={{ overflow: "hidden" }}>
              <div className={`mk-tpl-cover ${c.tone}`} style={{ height: 52, padding: "10px 12px", justifyContent: "flex-end" }}>
                <span className="t" style={{ fontSize: 13 }}>{c.title}</span>
              </div>
              <div style={{ padding: "9px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.company}</span>
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 8, fontSize: 10.5 }}>
                    <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.eye} size={10} />{c.views}</span>
                    <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.clock} size={10} />{c.time}</span>
                    <span className="mk-ui-row" style={{ gap: 3 }}><Icon d={I.link} size={10} />{c.clicks}</span>
                  </span>
                </div>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--db-border)", paddingTop: 7 }}>
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 6, fontSize: 10.5 }}><Av initials="SO" size={16} />{c.ago}</span>
                  <span className={`mk-ui-pill ${c.status === "Live" ? "ink" : ""}`} style={{ fontSize: 9.5 }}>
                    {c.status === "Live" && <span data-wg="" className="mk-live-dot" style={{ width: 5, height: 5, filter: "invert(1)" }} />}
                    {c.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export function EditorVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-bg)", minHeight: 440, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid var(--db-border)", background: "var(--db-surface)" }}>
        <div className="mk-ui-row" style={{ gap: 8 }}>
          <span className="mk-ui-row mk-ui-sec" style={{ gap: 4, fontSize: 11.5 }}><Icon d={I.back} size={11} />Back</span>
          <span className="mk-ui-pill" style={{ fontSize: 9.5 }}>Draft</span>
          <span className="mk-ui-row mk-ui-muted" style={{ gap: 5, fontSize: 10.5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--db-text)" }} />Saved</span>
        </div>
        <div className="mk-ui-row" style={{ gap: 5 }}>
          <span className="mk-ui-btn">Design</span>
          <span className="mk-ui-btn"><Icon d={I.spark} size={11} />AI Edit</span>
          <span className="mk-ui-btn">Preview</span>
          <span className="mk-ui-btn"><Icon d={I.share} size={11} />Share</span>
          <span className="mk-ui-btn ink"><Icon d={I.globe} size={11} />Publish</span>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, padding: "18px 26px 22px", minWidth: 0, position: "relative" }}>
          <div className="mk-ui-row" style={{ gap: 6, marginBottom: 18 }}>
            {["Overview", "Pricing", "Timeline", "Next steps"].map((t, i) => (
              <span key={t} className={`mk-ui-pill${i === 1 ? " ink" : ""}`}>{t}</span>
            ))}
            <span className="mk-ui-pill" style={{ borderStyle: "dashed", color: "var(--db-text-muted)" }}><Icon d={I.plus} size={9} />Add tab</span>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 30, letterSpacing: "-0.015em", lineHeight: 1.05 }}>Q3 Partnership Proposal</div>
          <div className="mk-ui-sec" style={{ fontSize: 12, marginTop: 6 }}>Prepared for Northwind · Valid until 14 Oct</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            <span className="mk-ui-line soft" style={{ width: "92%" }} />
            <span className="mk-ui-line soft" style={{ width: "78%" }} />
          </div>

          <div className="mk-ui-panel" style={{ marginTop: 16, overflow: "hidden" }}>
            {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"], ["Total", "$54,500"]].map(([l, v], i) => (
              <div key={l} className="mk-ui-row" style={{ justifyContent: "space-between", padding: "8px 12px", fontSize: 12, borderTop: i ? "1px solid var(--db-border)" : "none", fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)", background: i === 2 ? "var(--db-surface-dim)" : "transparent" }}>
                <span>{l}</span><span className="mk-tnum">{v}</span>
              </div>
            ))}
          </div>

          {/* slash menu */}
          <div style={{ marginTop: 14, position: "relative" }}>
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
        </div>

        {/* style panel */}
        <div className="mk-editor-side" style={{ width: 176, borderLeft: "1px solid var(--db-border)", background: "var(--db-surface)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mk-ui-row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600 }}>Style</span><span className="mk-ui-label">Team default</span></div>
          {[["Theme", "Editorial"], ["Body font", "DM Sans"], ["Heading font", "Instrument Serif"], ["Width", "Default"], ["Corners", "Soft"], ["Tabs", "Top"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mk-ui-label">{k}</span>
              <span className="mk-ui-pill dim" style={{ justifyContent: "space-between", fontSize: 10.5 }}>{v}<span className="mk-ui-muted">▾</span></span>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="mk-ui-label">Color</span>
            <div className="mk-ui-row" style={{ gap: 5 }}>
              {["var(--db-text)", "var(--db-text-secondary)", "var(--db-text-muted)", "var(--db-surface-deep)"].map((c, i) => (
                <span key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: c, outline: i === 0 ? "2px solid var(--db-text)" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Published buyer page (/p/[slug]) ──────────────────────────────── */
const MAP_ITEMS = [
  ["Security review returned", "Buyer", "done"],
  ["Pricing approved by finance", "Buyer", "done"],
  ["Rollout plan agreed", "Seller", "done"],
  ["Legal redlines resolved", "Seller", "open"],
  ["Signature", "Buyer", "open"],
] as const

export function BuyerVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-surface)", minHeight: 440, position: "relative", overflow: "hidden" }}>
      <div style={{ height: 112, background: "var(--db-accent)", color: "var(--db-on-accent)", padding: "16px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
          <span className="mk-ui-row" style={{ gap: 7 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--db-on-accent)", color: "var(--db-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>A</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", opacity: .85 }}>ACME</span>
          </span>
          <span className="mk-ui-pill" style={{ background: "transparent", color: "var(--db-on-accent)", borderColor: "var(--db-ink-rule)", fontSize: 9.5 }}>Made for Maya · Northwind</span>
        </div>
        <span style={{ fontFamily: SERIF, fontSize: 26, letterSpacing: "-0.01em", lineHeight: 1 }}>Q3 Partnership Proposal</span>
      </div>

      <div className="mk-ui-row" style={{ gap: 18, padding: "0 22px", borderBottom: "1px solid var(--db-border)" }}>
        {["Overview", "Pricing", "Timeline", "Next steps"].map((t, i) => (
          <span key={t} style={{ padding: "11px 0", fontSize: 12, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "var(--db-text)" : "var(--db-text-secondary)", borderBottom: i === 1 ? "2px solid var(--db-text)" : "2px solid transparent", marginBottom: -1 }}>{t}</span>
        ))}
      </div>

      <div style={{ padding: "16px 22px 20px", display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 22 }} className="mk-buyer-grid">
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 18, marginBottom: 8 }}>Pricing</div>
          {[["Platform licence, annual", "$48,000"], ["Onboarding & migration", "$6,500"], ["Total", "$54,500"]].map(([l, v], i) => (
            <div key={l} className="mk-ui-row" style={{ justifyContent: "space-between", fontSize: 12.5, padding: "8px 0", borderBottom: "1px solid var(--db-border)", fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "var(--db-text)" : "var(--db-text-secondary)" }}>
              <span>{l}</span><span className="mk-tnum">{v}</span>
            </div>
          ))}
          <div className="mk-ui-row" style={{ gap: 10, marginTop: 14 }}>
            <span className="mk-ui-btn ink" style={{ borderRadius: 999, padding: "8px 16px" }}>Approve &amp; sign</span>
            <span className="mk-ui-row mk-ui-muted" style={{ gap: 6, fontSize: 10.5 }}><Icon d={I.cal} size={11} />Book a call</span>
          </div>
        </div>
        <div className="mk-ui-panel" style={{ padding: "12px 14px" }}>
          <div className="mk-ui-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Mutual action plan</div>
              <div className="mk-ui-row mk-ui-muted" style={{ gap: 4, fontSize: 10 }}><Icon d={I.cal} size={10} />Target close: 14 Oct</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1 }}>60%</div>
              <div className="mk-ui-muted" style={{ fontSize: 9.5 }}>3 of 5</div>
            </div>
          </div>
          <div className="mk-ui-bar" style={{ margin: "10px 0 8px", height: 3 }}><span data-wg="" style={{ width: "60%", animation: "mk-fill 1.4s var(--mk-ease) both" }} /></div>
          {MAP_ITEMS.map(([t, who, st]) => (
            <div key={t} className="mk-ui-row" style={{ gap: 8, padding: "6px 0", borderTop: "1px solid var(--db-border)", fontSize: 11 }}>
              <span className={`mk-ui-check${st === "done" ? " done" : ""}`}>{st === "done" ? "✓" : ""}</span>
              <span style={{ flex: 1, textDecoration: st === "done" ? "line-through" : "none", opacity: st === "done" ? .6 : 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
              <span className={`mk-ui-pill${who === "Buyer" ? " ink" : ""}`} style={{ fontSize: 9, padding: "2px 6px" }}>{who}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mk-ui-label" style={{ textAlign: "center", padding: "6px 0 14px", fontSize: 9 }}>Powered by {APP_NAME}</div>
    </div>
  )
}

/* ── Analytics (/analytics/[pageId]) ───────────────────────────────── */
const VISITORS = [
  ["Maya Chen", "MC", 3, "2m ago", "18m 40s", 92, "High Intent"],
  ["Dan Ortiz", "DO", 1, "3h ago", "6m 12s", 48, "Warm"],
  ["Priya Nair", "PN", 1, "2d ago", "1m 05s", 12, "Cold"],
] as const
const SECTIONS = [["Overview", "4m 10s", 70], ["Pricing", "6m 02s", 100], ["Timeline", "1m 20s", 22], ["Next steps", "Not viewed", 0]] as const

export function AnalyticsVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-bg)", minHeight: 440, padding: 20, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="mk-ui-row mk-ui-muted" style={{ gap: 4, fontSize: 10.5 }}><Icon d={I.back} size={10} />Analytics</div>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.01em" }}>Q3 Partnership Proposal</div>
        </div>
        <div className="mk-ui-row" style={{ gap: 4 }}>
          <span className="mk-ui-pill ink">7 days</span><span className="mk-ui-pill">30 days</span><span className="mk-ui-pill">All time</span>
        </div>
      </div>

      <div className="mk-an-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {[["Last viewed", "2m ago", I.clock], ["Views", "38", I.eye], ["Time spent", "1h 12m", I.clock], ["High intent", "3", I.user]].map(([l, v, d]) => (
          <div key={l} className="mk-ui-panel" style={{ padding: "10px 12px" }}>
            <div className="mk-ui-row" style={{ gap: 5, color: "var(--db-text-muted)" }}><Icon d={d} size={10} /><span className="mk-ui-label">{l}</span></div>
            <div style={{ fontFamily: SERIF, fontSize: 22, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="mk-an-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.35fr)", gap: 10 }}>
        <div className="mk-ui-panel" style={{ padding: "12px 14px" }}>
          <div className="mk-ui-row" style={{ gap: 6, marginBottom: 8 }}><Icon d={I.layers} size={12} /><span style={{ fontSize: 12, fontWeight: 600 }}>Section engagement</span></div>
          {SECTIONS.map(([t, time, pct], i) => (
            <div key={t} style={{ padding: "7px 0", borderTop: "1px solid var(--db-border)" }}>
              <div className="mk-ui-row" style={{ justifyContent: "space-between", fontSize: 11 }}>
                <span>{t}</span>
                <span className={pct ? "mk-ui-sec mk-tnum" : "mk-ui-muted"} style={{ fontStyle: pct ? "normal" : "italic", fontSize: 10.5 }}>{time}</span>
              </div>
              <div className="mk-ui-bar" style={{ marginTop: 5, height: 4 }}><span data-wg="" style={{ width: `${pct}%`, animation: "mk-fill 1.2s var(--mk-ease) both", animationDelay: `${i * 120}ms` }} /></div>
            </div>
          ))}
        </div>
        <div className="mk-ui-panel" style={{ overflow: "hidden" }}>
          <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "11px 14px 8px" }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Buyer analytics</span>
            <span className="mk-ui-label">Score · Intent</span>
          </div>
          {VISITORS.map(([name, ini, sessions, seen, time, score, intent]) => (
            <div key={name} className="mk-ui-row" style={{ gap: 9, padding: "8px 14px", borderTop: "1px solid var(--db-border)", fontSize: 11 }}>
              <Av initials={ini} size={22} ink={intent === "High Intent"} />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span className="mk-ui-muted" style={{ fontSize: 9.5 }}>{sessions} session{sessions > 1 ? "s" : ""} · {seen} · {time}</span>
              </span>
              <span className="mk-ui-bar" style={{ width: 54 }}><span data-wg="" style={{ width: `${score}%`, animation: "mk-fill 1.2s var(--mk-ease) both" }} /></span>
              <span className="mk-tnum" style={{ width: 20, textAlign: "right", fontSize: 11 }}>{score}</span>
              <span className={`mk-ui-pill${intent === "High Intent" ? " ink" : intent === "Warm" ? "" : " dim"}`} style={{ fontSize: 9, width: 74, justifyContent: "center" }}>{intent}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--db-border)", padding: "9px 14px 11px", display: "flex", flexDirection: "column", gap: 5 }}>
            <span className="mk-ui-label">Today</span>
            {[["Maya Chen", "Viewed “Pricing” for 2m 10s", "2m ago"], ["Maya Chen", "Clicked CTA: Approve & sign", "4m ago"], ["Maya Chen", "Return visit (session #3)", "6m ago"]].map(([w, e, t]) => (
              <div key={e} className="mk-ui-row" style={{ gap: 7, fontSize: 10.5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--db-text)", flexShrink: 0 }} />
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
    <div className="mk-ui mk-ai-grid" style={{ background: "var(--db-bg)", minHeight: 440, display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", overflow: "hidden" }}>
      <div style={{ borderRight: "1px solid var(--db-border)", background: "var(--db-surface)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mk-ui-row" style={{ gap: 6 }}><Icon d={I.spark} size={12} /><span style={{ fontSize: 12, fontWeight: 600 }}>AI Write</span><span className="mk-ui-label" style={{ marginLeft: "auto" }}>Draft</span></div>
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
        <div className="mk-ui-panel" style={{ padding: "10px 12px", marginTop: "auto" }}>
          <div className="mk-ui-row" style={{ gap: 7, fontSize: 11 }}><Icon d={I.upload} size={11} /><span style={{ fontWeight: 500 }}>northwind-brief.pdf</span><span className="mk-ui-muted" style={{ marginLeft: "auto" }}>2.4 MB</span></div>
          <div className="mk-ui-bar" style={{ marginTop: 7, height: 3 }}><span data-wg="" style={{ width: "100%", animation: "mk-fill 4s linear infinite" }} /></div>
          <div className="mk-ui-muted" style={{ fontSize: 9.5, marginTop: 5 }}>Converting document into a page…</div>
        </div>
      </div>
      <div style={{ padding: "22px 28px" }}>
        <div className="mk-ui-row" style={{ gap: 6, marginBottom: 16 }}>
          {["Overview", "Pricing", "Rollout", "Next steps"].map((t, i) => (
            <span key={t} className={`mk-ui-pill${i === 1 ? " ink" : ""}`} style={{ opacity: i > 1 ? .5 : 1 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: "-0.015em" }}>Pricing</div>
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
const COLS: { name: string; deals: [string, string, string, string, string][] }[] = [
  { name: "New", deals: [["Initech pilot", "$18,000", "Cold", "2d in stage", "PN"]] },
  { name: "Qualified", deals: [["Globex renewal", "$42,000", "Warm", "6d in stage", "DO"], ["Umbrella SOW", "$27,500", "Cold", "9d in stage", "SO"]] },
  { name: "Proposal", deals: [["Northwind Q3", "$54,500", "High Intent", "3d in stage", "MC"]] },
  { name: "Negotiation", deals: [["Acme expansion", "$96,000", "High Intent", "1d in stage", "SO"]] },
  { name: "Won", deals: [["Stark onboarding", "$74,000", "Won", "closed", "DO"]] },
]

export function PipelineVisual() {
  return (
    <div className="mk-ui" style={{ background: "var(--db-bg)", minHeight: 440, padding: 20, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
      <div className="mk-ui-row" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.01em" }}>Deals</div>
          <div className="mk-ui-sec" style={{ fontSize: 11 }}>Open pipeline <strong style={{ fontWeight: 600, color: "var(--db-text)" }}>$238,000</strong> across 5 open deals</div>
        </div>
        <div className="mk-ui-row" style={{ gap: 6 }}>
          <span className="mk-ui-pill ink">Pipeline</span><span className="mk-ui-pill">Contacts</span><span className="mk-ui-pill">Companies</span>
          <span className="mk-ui-btn ink" style={{ marginLeft: 6 }}><Icon d={I.plus} size={11} />New deal</span>
        </div>
      </div>
      <div className="mk-pipe" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, flex: 1 }}>
        {COLS.map((col) => (
          <div key={col.name} style={{ background: col.name === "Won" ? "var(--db-surface-dim)" : "transparent", borderRadius: 10, padding: 6, border: "1px solid var(--db-border)", display: "flex", flexDirection: "column", gap: 6, minHeight: 250 }}>
            <div className="mk-ui-row" style={{ justifyContent: "space-between", padding: "4px 6px" }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{col.name}</span>
              <span className="mk-ui-label">{col.deals.length}</span>
            </div>
            {col.deals.map(([n, v, intent, age, owner]) => (
              <div key={n} className="mk-ui-panel" style={{ padding: "9px 10px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "var(--db-shadow-1)" }}>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</span>
                  <span className="mk-tnum mk-ui-sec" style={{ flexShrink: 0 }}>{v}</span>
                </div>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", gap: 4 }}>
                  <span className={`mk-ui-pill${intent === "High Intent" || intent === "Won" ? " ink" : intent === "Cold" ? " dim" : ""}`} style={{ fontSize: 8.5, padding: "2px 6px" }}>{intent}</span>
                  <span className="mk-ui-muted" style={{ fontSize: 9, whiteSpace: "nowrap" }}>{age}</span>
                </div>
                <div className="mk-ui-row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--db-border)", paddingTop: 6 }}>
                  <Av initials={owner} size={16} />
                  <span className="mk-ui-row mk-ui-muted" style={{ gap: 3, fontSize: 9 }}><Icon d={I.file} size={9} />2</span>
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
