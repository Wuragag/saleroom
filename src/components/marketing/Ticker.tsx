import { LANDING_MAXIMS, indexLabel } from "@/data/marketing/landing"

/** Slow-scrolling maxim strip between hairlines — the site's running motif. */
export default function Ticker() {
  // Four copies with a -50% loop: two full sets are always on screen, so the
  // track never runs dry on wide viewports.
  const track = [...LANDING_MAXIMS, ...LANDING_MAXIMS, ...LANDING_MAXIMS, ...LANDING_MAXIMS]

  return (
    <section
      data-wg=""
      aria-hidden="true"
      style={{
        borderTop: "1px solid var(--db-border)",
        borderBottom: "1px solid var(--db-border)",
        padding: "16px 0",
        overflow: "hidden",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 0,
          width: "max-content",
          animation: "wg-marquee 96s linear infinite",
        }}
      >
        {track.map((m, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "baseline", whiteSpace: "nowrap" }}>
            <span
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontStyle: "italic",
                fontSize: 19,
                letterSpacing: "-0.01em",
                color: "var(--db-text-secondary)",
              }}
            >
              {m}
            </span>
            <span className="mk-eyebrow" style={{ padding: "0 28px", position: "relative", top: -2 }}>
              {indexLabel(i % LANDING_MAXIMS.length)}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
