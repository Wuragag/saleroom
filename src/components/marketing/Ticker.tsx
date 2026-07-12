/** Slow-scrolling maxim strip between hairlines — the site's running motif. */

const MAXIMS = [
  "Remove the unnecessary",
  "Send one link",
  "Control what you can",
  "Judge by evidence",
  "Say less, close more",
  "Waste no time arguing",
]

export default function Ticker() {
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
          animation: "wg-marquee 48s linear infinite",
        }}
      >
        {[...MAXIMS, ...MAXIMS].map((m, i) => (
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
            <span
              className="mk-eyebrow"
              style={{ padding: "0 28px", position: "relative", top: -2 }}
            >
              {String((i % MAXIMS.length) + 1).padStart(2, "0")}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
