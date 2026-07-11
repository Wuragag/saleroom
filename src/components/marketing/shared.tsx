"use client"

import Link from "next/link"

/* ── Page Hero ── */
export function PageHero({
  label,
  heading,
  headingAccent,
  subtitle,
}: {
  label: string
  heading: string
  headingAccent?: string
  subtitle: string
}) {
  return (
    <>
      <style>{`
        @keyframes sr-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sr-page-hero-label { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 0ms forwards; }
        .sr-page-hero-h1    { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 80ms forwards; }
        .sr-page-hero-sub   { opacity: 0; animation: sr-fade-up 600ms cubic-bezier(0.16,1,0.3,1) 160ms forwards; }
        @media (prefers-reduced-motion: reduce) {
          .sr-page-hero-label, .sr-page-hero-h1, .sr-page-hero-sub { animation: none; opacity: 1; }
        }
        @media (max-width: 640px) {
          .sr-page-hero-h1 { font-size: 42px !important; }
          .sr-page-hero { padding: 140px 0 60px !important; }
        }
      `}</style>
      <section className="sr-page-hero" style={{ padding: "160px 0 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <p
            className="sr-page-hero-label"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--db-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            {label}
          </p>
          <h1
            className="sr-page-hero-h1"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 56,
              fontWeight: 400,
              color: "var(--db-text)",
              lineHeight: 1.1,
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            {heading}
            {headingAccent && (
              <>
                <br />
                <em>{headingAccent}</em>
              </>
            )}
          </h1>
          <p
            className="sr-page-hero-sub"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 17,
              color: "var(--db-text-secondary)",
              lineHeight: 1.7,
              margin: "0 auto",
              maxWidth: 520,
            }}
          >
            {subtitle}
          </p>
        </div>
      </section>
    </>
  )
}

/* ── CTA Banner (dark) ── */
export function CTABanner({
  heading,
  headingAccent,
  subtitle,
  ctaLabel = "Start free — no credit card",
  ctaHref = "/auth/signup",
}: {
  heading: string
  headingAccent?: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <>
      <style>{`
        .sr-cta-link:hover { opacity: 0.9; }
        @media (max-width: 640px) {
          .sr-cta-h2 { font-size: 36px !important; }
          .sr-cta-section { padding: 80px 0 !important; }
        }
      `}</style>
      <section
        className="sr-cta-section"
        style={{
          padding: "120px 0",
          background: "var(--db-text)",
          color: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <h2
            className="sr-cta-h2"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 48,
              fontWeight: 400,
              lineHeight: 1.1,
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            {heading}
            {headingAccent && (
              <>
                <br />
                <em>{headingAccent}</em>
              </>
            )}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 17,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {subtitle}
          </p>
          <Link
            href={ctaHref}
            className="sr-cta-link"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 15,
              fontWeight: 500,
              background: "#FFFFFF",
              color: "var(--db-text)",
              borderRadius: 100,
              padding: "14px 32px",
              textDecoration: "none",
              transition: "opacity 150ms ease",
              display: "inline-block",
            }}
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </>
  )
}

/* ── Feature Card ── */
export function FeatureCard({
  title,
  description,
  label,
  href,
}: {
  title: string
  description: string
  label: string
  href?: string
}) {
  const content = (
    <div
      className="sr-feature-card"
      style={{
        padding: 36,
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        borderRadius: 16,
        transition: "border-color 200ms ease, box-shadow 200ms ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--db-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <h3
        style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: 24,
          fontWeight: 400,
          color: "var(--db-text)",
          lineHeight: 1.2,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 15,
          color: "var(--db-text-secondary)",
          lineHeight: 1.7,
          margin: 0,
          flex: 1,
        }}
      >
        {description}
      </p>
      {href && (
        <div
          style={{
            marginTop: 20,
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--db-text)",
          }}
        >
          Learn more &rarr;
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    )
  }
  return content
}
