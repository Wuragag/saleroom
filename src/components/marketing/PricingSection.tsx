import Link from "next/link"
import { PRICING_TIERS } from "@/data/marketing/pricing"
import ScrollReveal from "@/components/marketing/ScrollReveal"

/**
 * "Terms" — pricing as a ruled table, not floating cards. Real tiers from
 * src/data/marketing/pricing.ts; the highlighted tier gets a surface fill.
 */
export default function PricingSection() {
  return (
    <>
      <style>{`
        .mk-plan-col {
          display: flex;
          flex-direction: column;
          padding: 32px 28px 28px;
          border-left: 1px solid var(--db-border);
        }
        .mk-plan-col:first-child { border-left: none; }
        .mk-plan-link {
          font-family: var(--font-mk-mono), ui-monospace, monospace;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--db-text);
          text-decoration: none;
        }
        .mk-plan-link:hover { text-decoration: underline; text-underline-offset: 4px; }
        @media (max-width: 900px) {
          .mk-plans { grid-template-columns: 1fr !important; }
          .mk-plan-col { border-left: none !important; border-top: 1px solid var(--db-border); padding: 28px 20px !important; }
          .mk-plan-col:first-child { border-top: none; }
        }
      `}</style>
      <section id="pricing" style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px 104px" }}>
        <div className="mk-chapter">
          <span className="mk-eyebrow">04 &mdash; Terms</span>
          <span className="mk-eyebrow">Nothing to negotiate</span>
        </div>

        <h2 className="mk-h2" style={{ padding: "28px 0 36px", maxWidth: 640 }}>
          Three plans. No <em>tiers of tiers</em>.
        </h2>

        <ScrollReveal distance={24}>
        <div
          className="mk-plans"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--db-text)",
            borderBottom: "1px solid var(--db-border)",
          }}
        >
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="mk-plan-col"
              style={tier.highlighted ? { background: "var(--db-surface)" } : undefined}
            >
              <span className="mk-eyebrow" style={{ color: "var(--db-text)" }}>
                {tier.name}
                {tier.highlighted && (
                  <span style={{ color: "var(--db-text-muted)" }}> &mdash; most chosen</span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "22px 0 6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 60,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {tier.price}
                </span>
                <span className="mk-eyebrow">{tier.period}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--db-text-secondary)", margin: "0 0 22px" }}>
                {tier.description}
              </p>
              <div style={{ borderTop: "1px solid var(--db-border)", marginBottom: 24 }}>
                {tier.features.map((point) => (
                  <div
                    key={point}
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "var(--db-text-secondary)",
                      padding: "9px 0",
                      borderBottom: "1px solid var(--db-border)",
                    }}
                  >
                    {point}
                  </div>
                ))}
              </div>
              {tier.highlighted ? (
                <Link href="/auth/signup" className="mk-cta" style={{ alignSelf: "flex-start", marginTop: "auto" }}>
                  {tier.cta}
                </Link>
              ) : (
                <Link href="/auth/signup" className="mk-plan-link" style={{ marginTop: "auto", paddingBottom: 10 }}>
                  {tier.cta} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
        </ScrollReveal>
        <span className="mk-eyebrow" style={{ display: "block", marginTop: 16 }}>
          Prices are final. There is nothing to negotiate.
        </span>
      </section>
    </>
  )
}
