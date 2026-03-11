"use client"

import { useState } from "react"
import Link from "next/link"
import { PRICING_TIERS, FAQ } from "@/data/marketing/pricing"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}) {
  return (
    <div
      className="sr-pricing-card"
      style={{
        padding: 36,
        background: highlighted ? "var(--sr-text)" : "var(--sr-surface)",
        border: `1px solid ${highlighted ? "var(--sr-text)" : "var(--sr-border)"}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: highlighted ? "rgba(255,255,255,0.5)" : "var(--sr-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 16,
        }}
      >
        {name}
      </p>
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: 48,
            fontWeight: 400,
            color: highlighted ? "#FFFFFF" : "var(--sr-text)",
            lineHeight: 1,
          }}
        >
          {price}
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 14,
            color: highlighted ? "rgba(255,255,255,0.5)" : "var(--sr-text-muted)",
            marginLeft: 8,
          }}
        >
          {period}
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 15,
          color: highlighted ? "rgba(255,255,255,0.6)" : "var(--sr-text-secondary)",
          lineHeight: 1.6,
          margin: "0 0 28px",
        }}
      >
        {description}
      </p>

      <Link
        href="/auth/signup"
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 15,
          fontWeight: 500,
          background: highlighted ? "#FFFFFF" : "var(--sr-text)",
          color: highlighted ? "var(--sr-text)" : "#FFFFFF",
          borderRadius: 100,
          padding: "14px 0",
          textDecoration: "none",
          textAlign: "center",
          transition: "opacity 150ms ease",
          display: "block",
          marginBottom: 28,
        }}
        className="sr-pricing-pill"
      >
        {cta}
      </Link>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1 }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              padding: "10px 0",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 14,
              color: highlighted ? "rgba(255,255,255,0.75)" : "var(--sr-text-secondary)",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M4 8L7 11L12 5"
                stroke={highlighted ? "rgba(255,255,255,0.6)" : "var(--sr-text-muted)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--sr-text)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Frequently asked questions
          </h2>
        </div>

        <div>
          {FAQ.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: "1px solid var(--sr-border)",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "20px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--sr-text)",
                    textAlign: "left",
                  }}
                >
                  {item.question}
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    transform: openIndex === i ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 200ms ease",
                  }}
                >
                  <path
                    d="M10 4V16M4 10H16"
                    stroke="var(--sr-text-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div
                style={{
                  maxHeight: openIndex === i ? 200 : 0,
                  overflow: "hidden",
                  transition: "max-height 250ms ease",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 15,
                    color: "var(--sr-text-secondary)",
                    lineHeight: 1.7,
                    margin: "0 0 20px",
                    paddingRight: 40,
                  }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <>
      <style>{`
        .sr-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        .sr-pricing-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        .sr-pricing-pill:hover {
          opacity: 0.85;
        }
        @media (max-width: 900px) {
          .sr-pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin: 0 auto !important; }
        }
      `}</style>

      <PageHero
        label="Pricing"
        heading="Simple, transparent"
        headingAccent="pricing"
        subtitle="Start free. Upgrade when you're ready. No surprises."
      />

      <section style={{ padding: "0 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-pricing-grid">
            {PRICING_TIERS.map((tier, i) => (
              <ScrollReveal key={tier.name} delay={i * 100}>
                <PricingCard {...tier} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />

      <CTABanner
        heading="Start closing deals"
        headingAccent="today"
        subtitle="No credit card required. Upgrade anytime."
      />
    </>
  )
}
