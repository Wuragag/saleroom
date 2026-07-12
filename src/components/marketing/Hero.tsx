import Link from "next/link"
import Image from "next/image"
import HeroVisual from "./HeroVisual"

/**
 * Editorial hero: left-aligned display type under a mono metadata row, the
 * product visual layered below, doorway engraving held back to a faint wash.
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
          font-size: clamp(44px, 8.6vw, 118px);
          line-height: 0.98;
          letter-spacing: -0.02em;
          margin: 0;
          text-wrap: balance;
        }
        .mk-art-wrap img { object-fit: cover; }
        @media (max-width: 900px) {
          .mk-hero { padding: 48px 0 40px !important; }
          .mk-hero-foot { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
          .mk-hero-foot p { max-width: 100% !important; text-align: left !important; }
          .mk-hero-note-right { display: none; }
        }
      `}</style>
      <section id="top" className="mk-hero" style={{ position: "relative", overflow: "hidden", padding: "64px 0 72px" }}>
        <div
          className="mk-art mk-art-wrap"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(105deg, transparent 42%, black 85%)",
            maskImage: "linear-gradient(105deg, transparent 42%, black 85%)",
          }}
        >
          <Image src="/redesign/hero-doorway.jpg" alt="" fill sizes="100vw" quality={45} priority={false} />
        </div>

        <div className="mk-hero-inner" style={{ position: "relative", zIndex: 2, maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
          <div
            className="mk-eyebrow"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              borderBottom: "1px solid var(--db-border)",
              paddingBottom: 14,
            }}
          >
            <span>&sect; 00 &mdash; For deals that deserve clarity</span>
            <span className="mk-hero-note-right">No decks &middot; No attachments &middot; One link</span>
          </div>

          <h1 className="mk-hero-h1" style={{ padding: "48px 0 44px", maxWidth: 980 }}>
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
              paddingTop: 26,
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
                fontSize: 15.5,
                lineHeight: 1.65,
                color: "var(--db-text-secondary)",
                maxWidth: 380,
                margin: 0,
                textAlign: "right",
                textWrap: "pretty",
              }}
            >
              Stop sending proposals into silence. One link your buyer actually
              reads &mdash; and you know the moment they do.
            </p>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <HeroVisual />
        </div>
      </section>
    </>
  )
}
