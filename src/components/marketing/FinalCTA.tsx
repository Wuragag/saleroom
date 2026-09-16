import Link from "next/link"
import Image from "next/image"
import ScrollReveal from "./ScrollReveal"

export default function FinalCTA() {
  return (
    <section className="mk-final mk-rule" aria-labelledby="final-title">
      <div className="mk-art mk-final-art" aria-hidden>
        <Image src="/redesign/maze-sphere.jpg" alt="" fill sizes="100vw" quality={50} />
      </div>
      <ScrollReveal style={{ position: "relative", zIndex: 2, maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <span className="mk-eyebrow">08 &mdash; Begin</span>
        <h2 id="final-title" className="mk-h1">Send one link. Say less. <em>Close more.</em></h2>
        <div className="mk-hero-ctas">
          <Link href="/auth/signup" className="mk-cta mk-cta-lg">Create your page</Link>
          <Link href="/pricing" className="mk-cta-ghost mk-cta-lg">See pricing</Link>
        </div>
        <p className="mk-small"><strong style={{ fontWeight: 500, color: "var(--db-text-secondary)" }}>Free until you need a second page.</strong> No credit card required.</p>
      </ScrollReveal>
    </section>
  )
}
