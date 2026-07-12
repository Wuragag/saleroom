import Link from "next/link"

/* eslint-disable @next/next/no-img-element -- decorative full-bleed art, not a content image */

/**
 * Editorial hero: left-aligned display type under a mono metadata row,
 * doorway engraving held back to a faint wash.
 */
export default function Hero() {
  return (
    <>
      <style>{`
        @keyframes mk-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mk-hero-inner { animation: mk-fade-up .5s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .mk-hero-inner { animation: none; }
        }
        .mk-hero-h1 {
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(58px, 9vw, 124px);
          line-height: 0.98;
          letter-spacing: -0.02em;
          margin: 0;
          text-wrap: balance;
        }
        @media (max-width: 900px) {
          .mk-hero { padding: 56px 24px 56px !important; }
          .mk-hero-foot { flex-direction: column !important; align-items: flex-start !important; gap: 28px !important; }
          .mk-hero-foot p { max-width: 100% !important; text-align: left !important; }
          .mk-hero-meta span:last-child { display: none; }
        }
      `}</style>
      <section
        id="top"
        className="mk-hero"
        style={{ position: "relative", overflow: "hidden", padding: "72px 24px 80px" }}
      >
        <img
          src="/redesign/hero-doorway.jpg"
          alt=""
          className="mk-art"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.07,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(105deg, transparent 38%, black 82%)",
            maskImage: "linear-gradient(105deg, transparent 38%, black 82%)",
          }}
        />
        <div
          className="mk-hero-inner"
          style={{ position: "relative", zIndex: 2, maxWidth: 1120, margin: "0 auto" }}
        >
          <div
            className="mk-hero-meta mk-eyebrow"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              borderBottom: "1px solid var(--db-border)",
              paddingBottom: 14,
            }}
          >
            <span>&sect; 00 &mdash; For deals that deserve clarity</span>
            <span>No decks &middot; No attachments &middot; One link</span>
          </div>

          <h1 className="mk-hero-h1" style={{ padding: "56px 0 48px", maxWidth: 980 }}>
            One page.
            <br />
            Every deal, <em>in order</em>.
          </h1>

          <div
            className="mk-hero-foot"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 32,
              borderTop: "1px solid var(--db-border)",
              paddingTop: 28,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              <Link href="/auth/signup" className="mk-cta mk-cta-lg">
                Create your page
              </Link>
              <span style={{ fontSize: 13, color: "var(--db-text-muted)" }}>
                <strong style={{ fontWeight: 500, color: "var(--db-text-secondary)" }}>
                  Free while you close your first deal.
                </strong>{" "}
                No credit card required.
              </span>
            </div>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: "var(--db-text-secondary)",
                maxWidth: 400,
                margin: 0,
                textAlign: "right",
                textWrap: "pretty",
              }}
            >
              Stop sending proposals into silence. Proposal, pricing and next
              steps become one link your buyer actually reads &mdash; and you
              know the moment they do.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
