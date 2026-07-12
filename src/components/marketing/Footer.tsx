import Link from "next/link"
import { APP_NAME } from "@/lib/constants"

const FOOTER_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "Philosophy", href: "/#philosophy" },
  { label: "Features", href: "/features" },
  { label: "Use cases", href: "/use-cases" },
  { label: "Examples", href: "/examples" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sign in", href: "/auth/signin" },
  { label: "Start", href: "/auth/signup" },
]

export default function Footer() {
  return (
    <>
      <style>{`
        .mk-foot-link {
          font-size: 13px;
          color: var(--db-text-secondary);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 999px;
          transition: color .15s ease;
        }
        .mk-foot-link:hover { color: var(--db-text); }
        @media (max-width: 900px) {
          .mk-foot-cols { flex-direction: column !important; gap: 32px !important; }
        }
      `}</style>
      <footer style={{ borderTop: "1px solid var(--db-border)", overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "40px 24px 0",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(88px, 15.5vw, 218px)",
              lineHeight: 0.94,
              letterSpacing: "-0.03em",
              color: "var(--db-text)",
              whiteSpace: "nowrap",
              marginBottom: "-0.05em",
            }}
          >
            {APP_NAME}
          </div>
        </div>
        <div
          className="mk-foot-cols"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "32px 24px 48px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            borderTop: "1px solid var(--db-border)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: "var(--db-cta-grad)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--db-on-accent)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {APP_NAME.charAt(0)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {APP_NAME}
              </span>
            </span>
            <span style={{ fontSize: 13, color: "var(--db-text-muted)" }}>
              &copy; {new Date().getFullYear()} {APP_NAME}. Waste no more time arguing
              what a good deal should be.
            </span>
          </div>
          <nav aria-label="Footer" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="mk-foot-link">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  )
}
