import Link from "next/link"
import { APP_NAME } from "@/lib/constants"
import ScrollReveal from "./ScrollReveal"

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Product tour", href: "/#product" },
      { label: "How it works", href: "/#how" },
      { label: "Templates", href: "/#templates" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Examples", href: "/examples" },
      { label: "Philosophy", href: "/#philosophy" },
      { label: "Questions", href: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/signin" },
      { label: "Start free", href: "/auth/signup" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mk-footer">
      <div className="mk-container" aria-hidden="true" style={{ paddingTop: 40 }}>
        <ScrollReveal distance={40} duration={900}>
          <div className="mk-footer-word">{APP_NAME}</div>
        </ScrollReveal>
      </div>
      <div className="mk-container">
        <div className="mk-footer-cols">
          <div className="mk-footer-col brand">
            <span className="mk-brand" style={{ marginBottom: 14 }}>
              <span className="mk-brand-mark" aria-hidden>{APP_NAME.charAt(0)}</span>
              <span className="mk-brand-name">{APP_NAME}</span>
            </span>
            <p className="mk-small" style={{ maxWidth: 300 }}>
              Deal pages for sellers who say less. One link, your brand, no buyer login — and every read, as it happens.
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} className="mk-footer-col" aria-label={col.title}>
              <h4 className="mk-h4" style={{ fontSize: 13 }}>{col.title}</h4>
              {col.links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
            </nav>
          ))}
        </div>
        <div className="mk-footer-base">
          <span className="mk-small">&copy; {new Date().getFullYear()} {APP_NAME}. Waste no more time arguing what a good deal should be.</span>
          <span className="mk-eyebrow">Made with less</span>
        </div>
      </div>
    </footer>
  )
}
