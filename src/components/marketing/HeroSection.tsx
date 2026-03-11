"use client"

import Link from "next/link"

const LOGOS = ["Salesforce", "HubSpot", "Gong", "Outreach", "UserGems", "Salesloft"]

export default function HeroSection() {
  return (
    <>
      <style>{`
        @keyframes sr-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sr-hero-badge  { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 0ms   forwards; }
        .sr-hero-h1     { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 80ms  forwards; }
        .sr-hero-sub    { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 160ms forwards; }
        .sr-hero-cta    { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 240ms forwards; }
        .sr-hero-logos  { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 320ms forwards; }
        .sr-hero-pill:hover { opacity: 0.85; }
        .sr-hero-text-link:hover { color: var(--sr-text) !important; }
        .sr-hero-logo:hover { opacity: 1 !important; }

        @media (prefers-reduced-motion: reduce) {
          .sr-hero-badge, .sr-hero-h1, .sr-hero-sub, .sr-hero-cta, .sr-hero-logos {
            animation: none; opacity: 1; transform: none;
          }
        }

        @media (max-width: 768px) {
          .sr-hero-h1-text { font-size: 48px !important; }
          .sr-hero-section { padding: 140px 0 80px !important; }
        }
        @media (max-width: 480px) {
          .sr-hero-h1-text { font-size: 36px !important; }
          .sr-hero-cta-row { flex-direction: column !important; }
        }
      `}</style>

      <section
        className="sr-hero-section"
        style={{
          padding: "180px 0 120px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* Badge */}
          <div className="sr-hero-badge" style={{ marginBottom: 32 }}>
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--sr-text-secondary)",
                background: "var(--sr-surface)",
                border: "1px solid var(--sr-border)",
                borderRadius: 100,
                padding: "8px 18px",
                display: "inline-block",
              }}
            >
              Trusted by 2,400+ Account Executives
            </span>
          </div>

          {/* Headline */}
          <h1
            className="sr-hero-h1 sr-hero-h1-text"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 72,
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--sr-text)",
              margin: 0,
            }}
          >
            Know the moment
            <br />
            your buyer reads
            <br />
            <em style={{ fontStyle: "italic" }}>your proposal</em>
          </h1>

          {/* Subtitle */}
          <p
            className="sr-hero-sub"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 18,
              fontWeight: 400,
              color: "var(--sr-text-secondary)",
              lineHeight: 1.7,
              marginTop: 28,
              marginBottom: 0,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Stop sending proposals into silence. One beautiful link,
            real-time engagement insights, and the confidence to follow up
            at exactly the right moment.
          </p>

          {/* CTA */}
          <div
            className="sr-hero-cta sr-hero-cta-row"
            style={{
              marginTop: 44,
              display: "flex",
              gap: 16,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link
              href="/auth/signup"
              className="sr-hero-pill"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 15,
                fontWeight: 500,
                background: "var(--sr-text)",
                color: "#FFFFFF",
                borderRadius: 100,
                padding: "14px 32px",
                textDecoration: "none",
                transition: "opacity 150ms ease",
              }}
            >
              Start free
            </Link>
            <Link
              href="#features"
              className="sr-hero-text-link"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--sr-text-secondary)",
                textDecoration: "none",
                padding: "14px 8px",
                transition: "color 150ms ease",
              }}
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Logo bar */}
        <div
          className="sr-hero-logos"
          style={{
            marginTop: 100,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--sr-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 24,
            }}
          >
            Trusted by AEs at
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 40,
              flexWrap: "wrap",
              padding: "0 24px",
            }}
          >
            {LOGOS.map((name) => (
              <span
                key={name}
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--sr-text-muted)",
                  opacity: 0.5,
                  transition: "opacity 200ms ease",
                  cursor: "default",
                }}
                className="sr-hero-logo"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
