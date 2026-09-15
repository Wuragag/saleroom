import { SHOWCASE } from "@/data/marketing/landing"
import ProductShowcase from "./ProductShowcase"

export default function ProductSection() {
  return (
    <section id="product" className="mk-section" aria-labelledby="product-title">
      <div className="mk-container">
        <div className="mk-chapter">
          <span className="mk-eyebrow">01 &mdash; Product</span>
          <span className="mk-eyebrow">Write · Send · Read · Close</span>
        </div>
        <div className="mk-chapter-head split">
          <h2 id="product-title" className="mk-h2">Everything the deal needs. <em>Nothing it doesn&rsquo;t.</em></h2>
          <p className="mk-lead" style={{ maxWidth: 460 }}>
            Four surfaces, one link. The page your buyer reads, the editor that made it, the signal that comes back, and the plan that closes it.
          </p>
        </div>
        <ProductShowcase tabs={SHOWCASE} />
      </div>
    </section>
  )
}
