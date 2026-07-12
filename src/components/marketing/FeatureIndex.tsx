import Link from "next/link"
import { FEATURES } from "@/data/marketing/features"

/**
 * "Capabilities" — a chapter index, not a card grid. Each row is one of the
 * real product features (src/data/marketing/features.ts, the same source as
 * the nav dropdown and /features/[slug] pages) and links to its page.
 */
export default function FeatureIndex() {
  return (
    <>
      <style>{`
        .mk-idx-row {
          display: grid;
          grid-template-columns: 64px 1fr 1.05fr 48px;
          align-items: baseline;
          gap: 24px;
          padding: 30px 0;
          border-bottom: 1px solid var(--db-border);
          text-decoration: none;
          color: var(--db-text);
        }
        .mk-idx-title {
          font-family: var(--font-serif), Georgia, serif;
          font-size: clamp(26px, 3vw, 36px);
          line-height: 1.1;
          letter-spacing: -0.015em;
        }
        .mk-idx-arrow {
          justify-self: end;
          font-size: 20px;
          color: var(--db-text-muted);
          transition: transform .2s ease, color .2s ease;
        }
        .mk-idx-row:hover .mk-idx-arrow { transform: translateX(6px); color: var(--db-text); }
        .mk-idx-row:hover .mk-idx-title { font-style: italic; }
        @media (max-width: 900px) {
          .mk-idx-row { grid-template-columns: 40px 1fr 32px; }
          .mk-idx-row .mk-eyebrow { grid-column: 1; grid-row: 1; }
          .mk-idx-title { grid-column: 2; grid-row: 1; }
          .mk-idx-arrow { grid-column: 3; grid-row: 1; }
          .mk-idx-desc { grid-column: 2 / 4; grid-row: 2; margin-top: 6px; }
        }
      `}</style>
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 104px" }}>
        <div className="mk-chapter">
          <span className="mk-eyebrow">02 &mdash; Capabilities</span>
          <span className="mk-eyebrow">{String(FEATURES.length).padStart(2, "0")} entries</span>
        </div>

        <h2 className="mk-h2" style={{ padding: "28px 0 36px", maxWidth: 640 }}>
          Only what <em>moves the deal</em> forward.
        </h2>

        <div style={{ borderTop: "1px solid var(--db-border)" }}>
          {FEATURES.map((f, i) => (
            <Link key={f.slug} href={`/features/${f.slug}`} className="mk-idx-row">
              <span className="mk-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <span className="mk-idx-title">{f.title}</span>
              <span
                className="mk-idx-desc"
                style={{ fontSize: 14, lineHeight: 1.6, color: "var(--db-text-secondary)", maxWidth: 460, textWrap: "pretty" }}
              >
                {f.description}
              </span>
              <span className="mk-idx-arrow" aria-hidden="true">&rarr;</span>
            </Link>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            paddingTop: 18,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontStyle: "italic",
              fontSize: 17,
              color: "var(--db-text-secondary)",
            }}
          >
            Everything else stays out of the way.
          </span>
          <Link
            href="/features"
            className="mk-eyebrow"
            style={{ textDecoration: "none", color: "var(--db-text-secondary)" }}
          >
            The full index &rarr;
          </Link>
        </div>
      </section>
    </>
  )
}
