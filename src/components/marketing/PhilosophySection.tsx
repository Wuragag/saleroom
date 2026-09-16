import Image from "next/image"
import { LANDING_QUOTE, LANDING_TENETS } from "@/data/marketing/landing"
import ScrollReveal from "./ScrollReveal"

/**
 * The stoic interlude — one inverted band: the engraved Marcus Aurelius plate
 * beside the maxim the product is built on, with the three tenets as footnotes.
 */
export default function PhilosophySection() {
  return (
    <section id="philosophy" className="mk-phil mk-ink" aria-labelledby="philosophy-title">
      <div className="mk-container" style={{ padding: "96px 24px" }}>
        <div className="mk-phil-in">
          <ScrollReveal className="mk-phil-plate" direction="left" distance={20}>
            <Image src="/redesign/aurelius.jpg" alt="Engraved portrait of Marcus Aurelius" fill sizes="(max-width:880px) 90vw, 320px" quality={60} className="mk-art-ink" />
          </ScrollReveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <span className="mk-eyebrow" style={{ color: "var(--db-ink-faint)" }}>05 &mdash; Philosophy</span>
            <h2 id="philosophy-title" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Why Dealbeam is built this way</h2>
            <ScrollReveal delay={80}>
              <blockquote style={{ margin: 0 }}>
                <p className="mk-phil-quote">&ldquo;{LANDING_QUOTE.text}&rdquo;</p>
                <footer className="mk-eyebrow" style={{ color: "var(--db-ink-faint)", marginTop: 18, letterSpacing: ".08em" }}>{LANDING_QUOTE.source}</footer>
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <div className="mk-phil-tenets">
                {LANDING_TENETS.map((t) => (
                  <div key={t.title}><h3>{t.title}</h3><p>{t.body}</p></div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
