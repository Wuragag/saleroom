import Link from "next/link"
import { PRICING_TIERS } from "@/data/marketing/pricing"
import ScrollReveal from "./ScrollReveal"

/**
 * "Terms" — pricing as a ruled table, not floating cards. Tiers come from
 * src/data/marketing/pricing.ts; the highlighted tier gets a surface fill.
 * `chapter` renders the landing-page chapter header; the /pricing page
 * supplies its own hero instead.
 */
export default function PricingSection({ chapter = true }: { chapter?: boolean }) {
  return (
    <section id="pricing" className={chapter ? "mk-section" : "mk-section-tight"} aria-labelledby="pricing-title">
      <div className="mk-container">
        {chapter && (
          <>
            <div className="mk-chapter">
              <span className="mk-eyebrow">06 &mdash; Terms</span>
              <span className="mk-eyebrow">Nothing per seat</span>
            </div>
            <div className="mk-chapter-head split">
              <h2 id="pricing-title" className="mk-h2">Three plans. <em>No tiers of tiers.</em></h2>
              <p className="mk-lead" style={{ maxWidth: 440 }}>Start on Free. Move up when the second deal needs a page. Cancel from Settings whenever you like.</p>
            </div>
          </>
        )}
        {!chapter && <h2 id="pricing-title" className="mk-h2" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Plans</h2>}
        <ScrollReveal distance={20}>
          <div className="mk-plans">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.name} className={`mk-plan${tier.highlighted ? " hi" : ""}`}>
                <span className="mk-eyebrow" style={{ color: "var(--db-text)" }}>
                  {tier.name}
                  {tier.highlighted && <span style={{ color: "var(--db-text-muted)" }}> &mdash; most chosen</span>}
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "22px 0 6px" }}>
                  <span className="mk-plan-price">{tier.price}</span>
                  <span className="mk-eyebrow">{tier.period}</span>
                </div>
                <p className="mk-body" style={{ fontSize: 14, margin: "0 0 22px" }}>{tier.description}</p>
                <div className="mk-plan-feat">
                  {tier.features.map((point) => <div key={point}>{point}</div>)}
                </div>
                {tier.highlighted ? (
                  <Link href="/auth/signup" className="mk-cta" style={{ alignSelf: "flex-start", marginTop: "auto" }}>{tier.cta}</Link>
                ) : (
                  <Link href="/auth/signup" className="mk-arrow" style={{ marginTop: "auto", paddingBottom: 12 }}>{tier.cta} <span aria-hidden>→</span></Link>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
        <span className="mk-eyebrow" style={{ display: "block", marginTop: 16 }}>Prices are final. There is nothing to negotiate.</span>
      </div>
    </section>
  )
}
