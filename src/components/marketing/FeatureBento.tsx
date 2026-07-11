import {
  LANDING_FEATURES,
  MARQUEE_DOMAINS,
  type LandingFeature,
} from "@/data/marketing/landing"

/**
 * "What it does" — asymmetric bento of feature cards, each with a looping
 * CSS wireframe graphic (no JS; animations respect prefers-reduced-motion
 * via the [data-wg] rule in the marketing layout).
 */

function PageGraphic() {
  return (
    <div
      style={{
        border: "1px solid var(--db-border)",
        borderRadius: 12,
        background: "var(--db-bg)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 11,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--db-surface-dim)" }} />
        <div style={{ height: 10, width: "46%", borderRadius: 5, background: "var(--db-surface-dim)" }} />
      </div>
      {[92, 74, 84].map((w, i) => (
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
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9,
              background: "var(--db-surface-dim)",
              animation: "wg-float 3.2s ease-in-out infinite",
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function BarsGraphic() {
  const bars = [0.42, 0.68, 0.5, 0.86, 0.6, 1, 0.78]
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 68 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: Math.round(68 * b),
            transformOrigin: "bottom",
            background: "var(--db-text)",
            opacity: 0.82,
            borderRadius: "3px 3px 0 0",
            animation: "wg-grow 2.6s ease-in-out infinite",
            animationDelay: `${i * 0.14}s`,
          }}
        />
      ))}
    </div>
  )
}

function TypeGraphic() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
      {[76, 100, 58].map((w, i) => (
        <div
          key={i}
          style={{
            height: 8,
            borderRadius: 4,
            width: `${w}%`,
            background: "var(--db-surface-dim)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--db-text)",
              opacity: 0.85,
              animation: "wg-type 3s steps(24) infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        </div>
      ))}
      <div
        style={{
          width: 7,
          height: 12,
          background: "var(--db-text)",
          animation: "wg-caret 1s steps(1) infinite",
        }}
      />
    </div>
  )
}

function PulseGraphic() {
  return (
    <div style={{ position: "relative", height: 68, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "1.5px solid var(--db-text)",
            animation: "wg-pulse 2.4s ease-out infinite",
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
      <div style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--db-text)" }} />
    </div>
  )
}

function MarqueeGraphic() {
  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <div style={{ display: "flex", gap: 10, width: "max-content", animation: "wg-marquee 20s linear infinite" }}>
        {[...MARQUEE_DOMAINS, ...MARQUEE_DOMAINS].map((d, i) => (
          <span
            key={i}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              border: "1px solid var(--db-border)",
              borderRadius: 999,
              fontSize: 13,
              color: "var(--db-text-secondary)",
              background: "var(--db-bg)",
              whiteSpace: "nowrap",
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

const GRAPHICS: Record<LandingFeature["graphic"], () => React.ReactNode> = {
  page: PageGraphic,
  bars: BarsGraphic,
  type: TypeGraphic,
  pulse: PulseGraphic,
  marquee: MarqueeGraphic,
}

const SPANS: Record<LandingFeature["span"], React.CSSProperties> = {
  tall: { gridColumn: "span 2", gridRow: "span 2" },
  wide: { gridColumn: "span 2" },
  single: { gridColumn: "span 1" },
  banner: { gridColumn: "span 4" },
}

export default function FeatureBento() {
  return (
    <>
      <style>{`
        .mk-bento-card:hover { box-shadow: var(--db-shadow-2); transform: translateY(-2px); }
        @media (max-width: 900px) {
          .mk-bento { grid-template-columns: 1fr !important; }
          .mk-bento > * { grid-column: auto !important; grid-row: auto !important; }
        }
      `}</style>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 112px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40, maxWidth: 560 }}>
          <span className="mk-eyebrow">What it does</span>
          <h2 className="mk-h2">
            Only what <em>moves the deal</em> forward.
          </h2>
        </div>
        <div
          className="mk-bento"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: "minmax(196px, auto)",
            gap: 16,
          }}
        >
          {LANDING_FEATURES.map((f) => {
            const Graphic = GRAPHICS[f.graphic]
            return (
              <div
                key={f.title}
                className="mk-bento-card"
                style={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                  borderRadius: 16,
                  padding: 26,
                  boxShadow: "var(--db-shadow-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  overflow: "hidden",
                  transition: "box-shadow .2s ease, transform .2s ease",
                  ...SPANS[f.span],
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "var(--db-surface-dim)",
                      border: "1px solid var(--db-border)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--db-text)",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d={f.iconPath} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--db-text-muted)",
                    }}
                  >
                    {f.stat}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{f.title}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--db-text-secondary)" }}>{f.body}</span>
                </div>
                <div data-wg="" style={{ marginTop: "auto", width: "100%" }}>
                  <Graphic />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
