import Link from "next/link"

/* eslint-disable @next/next/no-img-element -- decorative full-bleed art, not a content image */

export default function FinalCTA() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .mk-cta-final { padding: 72px 24px !important; }
          .mk-cta-final h2 { font-size: 40px !important; }
        }
      `}</style>
      <section
        className="mk-cta-final"
        style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "128px 24px" }}
      >
        <img
          src="/redesign/hero-astronaut.jpg"
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
            WebkitMaskImage: "linear-gradient(0deg, black 0%, transparent 95%)",
            maskImage: "linear-gradient(0deg, black 0%, transparent 95%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 640,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: 52,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            Send one link. Say less. <em>Close more.</em>
          </h2>
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
      </section>
    </>
  )
}
