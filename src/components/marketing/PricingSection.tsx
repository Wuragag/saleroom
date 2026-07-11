import Link from "next/link"
import { PRICING_TIERS } from "@/data/marketing/pricing"

/** Landing-page pricing — the real tiers from src/data/marketing/pricing.ts. */
export default function PricingSection() {
  return (
    <>
      <style>{`
        .mk-plan-cta-ghost {
          align-self: flex-start; margin-top: auto;
          font-size: 14px; font-weight: 500;
          color: var(--db-text);
          background: var(--db-surface);
          border: 1px solid var(--db-border-hover);
          border-radius: 999px;
          padding: 11px 24px;
          text-decoration: none;
          transition: background .15s ease;
        }
        .mk-plan-cta-ghost:hover { background: var(--db-surface-dim); }
        @media (max-width: 900px) {
          .mk-plans { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <section id="pricing" style={{ maxWidth: 1120, margin: "0 auto", padding: "112px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40, maxWidth: 560 }}>
          <span className="mk-eyebrow">Pricing</span>
          <h2 className="mk-h2">
            Three plans. No <em>tiers of tiers</em>.
          </h2>
        </div>
        <div className="mk-plans" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: "var(--db-surface)",
                border: `1px solid ${tier.highlighted ? "var(--db-border-hover)" : "var(--db-border)"}`,
                borderRadius: 16,
                padding: 28,
                boxShadow: tier.highlighted ? "var(--db-shadow-2)" : "var(--db-shadow-1)",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{tier.name}</span>
                <span style={{ fontSize: 14, color: "var(--db-text-secondary)" }}>{tier.description}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 44,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {tier.price}
                </span>
                <span style={{ fontSize: 13, color: "var(--db-text-muted)" }}>{tier.period}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  borderTop: "1px solid var(--db-border)",
                  paddingTop: 18,
                }}
              >
                {tier.features.map((point) => (
                  <span
                    key={point}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "var(--db-text-secondary)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{ flexShrink: 0, position: "relative", top: 1 }}
                    >
                      <path d="M2 6.5L4.8 9L10 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{point}</span>
                  </span>
                ))}
              </div>
              {tier.highlighted ? (
                <Link href="/auth/signup" className="mk-cta" style={{ alignSelf: "flex-start", marginTop: "auto", padding: "11px 24px" }}>
                  {tier.cta}
                </Link>
              ) : (
                <Link href="/auth/signup" className="mk-plan-cta-ghost">
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
        <span style={{ display: "block", marginTop: 20, fontSize: 13, color: "var(--db-text-muted)" }}>
          Prices are final. There is nothing to negotiate.
        </span>
      </section>
    </>
  )
}
