import Link from "next/link"
import Image from "next/image"

export default function FinalCTA() {
  return (
    <>
      <style>{`
        .mk-cta-final-art img { object-fit: cover; }
        @media (max-width: 900px) {
          .mk-cta-final { padding: 72px 24px !important; }
        }
      `}</style>
      <section
        className="mk-cta-final"
        style={{ position: "relative", overflow: "hidden", textAlign: "center", padding: "128px 24px" }}
      >
        <div
          className="mk-art mk-cta-final-art"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.11,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(0deg, black 30%, transparent 96%)",
            maskImage: "linear-gradient(0deg, black 30%, transparent 96%)",
          }}
        >
          <Image src="/redesign/maze-sphere.jpg" alt="" fill sizes="100vw" quality={50} />
        </div>
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
          <span className="mk-eyebrow">05 &mdash; Begin</span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(40px, 5.6vw, 64px)",
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
