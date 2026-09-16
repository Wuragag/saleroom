import Link from "next/link"
import { LANDING_FAQ } from "@/data/marketing/landing"
import FAQ from "./FAQ"

export default function FAQSection() {
  return (
    <section id="faq" className="mk-section-tight mk-rule" aria-labelledby="faq-title">
      <div className="mk-container">
        <div className="mk-detail-grid faq">
          <div>
            <span className="mk-eyebrow">07 &mdash; Questions</span>
            <h2 id="faq-title" className="mk-h2" style={{ marginTop: 16 }}>Asked, <em>answered.</em></h2>
            <p className="mk-body" style={{ marginTop: 16, maxWidth: 360 }}>Straight answers about what Dealbeam is, what it tracks and what it costs. More on the <Link href="/pricing" className="mk-underline">pricing page</Link>.</p>
          </div>
          <FAQ entries={LANDING_FAQ} />
        </div>
      </div>
    </section>
  )
}
