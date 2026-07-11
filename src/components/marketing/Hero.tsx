import Link from "next/link"

/* eslint-disable @next/next/no-img-element -- decorative full-bleed art, not a content image */

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
        @media (max-width: 900px) {
          .mk-hero h1 { font-size: 52px !important; }
          .mk-hero { padding: 96px 24px 72px !important; }
        }
      `}</style>
      <section
        id="top"
        className="mk-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "140px 24px 100px",
          textAlign: "center",
        }}
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
            opacity: 0.09,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 92%)",
            maskImage: "linear-gradient(180deg, black 0%, transparent 92%)",
          }}
        />
        <div
          className="mk-hero-inner"
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 840,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
          }}
        >
          <span className="mk-eyebrow">For deals that deserve clarity</span>
          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: 76,
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            One page.
            <br />
            Every deal, <em>in order</em>.
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.6,
              color: "var(--db-text-secondary)",
              maxWidth: 520,
              margin: 0,
              textWrap: "pretty",
            }}
          >
            Proposal, pricing and next steps — a single link your buyer actually
            reads. Remove the unnecessary. Keep the deal.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
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
        </div>
      </section>
    </>
  )
}
