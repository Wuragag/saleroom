import Link from "next/link"
import { FEATURES } from "@/data/marketing/features"

/**
 * "What it does" — an editorial grid of the real product features
 * (src/data/marketing/features.ts, the same source as the nav dropdown and
 * /features/[slug] pages). One bordered surface, hairline-divided cells,
 * each linking to its feature page.
 */
export default function FeatureGrid() {
  return (
    <>
      <style>{`
        .mk-feat-cell {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 32px;
          background: var(--db-surface);
          text-decoration: none;
          color: var(--db-text);
          transition: background .15s ease;
        }
        .mk-feat-cell:hover { background: var(--db-surface-dim); }
        .mk-feat-cell:hover .mk-feat-more { color: var(--db-text); }
        .mk-feat-more { transition: color .15s ease; }
        @media (max-width: 900px) {
          .mk-feat-grid { grid-template-columns: 1fr !important; }
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
          className="mk-feat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "var(--db-border)",
            border: "1px solid var(--db-border)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "var(--db-shadow-1)",
          }}
        >
          {FEATURES.map((f, i) => (
            <Link key={f.slug} href={`/features/${f.slug}`} className="mk-feat-cell">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span className="mk-eyebrow" style={{ fontSize: 11 }}>{f.label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 18,
                    color: "var(--db-text-muted)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 26,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--db-text-secondary)", textWrap: "pretty" }}>
                {f.description}
              </span>
              <span
                className="mk-feat-more"
                style={{ marginTop: "auto", paddingTop: 10, fontSize: 13, fontWeight: 500, color: "var(--db-text-muted)" }}
              >
                Learn more &rarr;
              </span>
            </Link>
          ))}
          <div className="mk-feat-cell" style={{ background: "var(--db-surface)", cursor: "default" }}>
            <span className="mk-eyebrow" style={{ fontSize: 11 }}>And nothing more</span>
            <span
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 26,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                fontStyle: "italic",
              }}
            >
              Everything else stays out of the way.
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.6, color: "var(--db-text-secondary)", textWrap: "pretty" }}>
              No feeds, no clutter, no learning curve. A quiet tool that keeps
              your buyer — and you — focused on the decision.
            </span>
            <Link
              href="/features"
              className="mk-feat-more"
              style={{ marginTop: "auto", paddingTop: 10, fontSize: 13, fontWeight: 500, color: "var(--db-text-muted)", textDecoration: "none" }}
            >
              See all features &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
