import Link from "next/link"

const NAV_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Examples", href: "/examples" },
      { label: "Use Cases", href: "/use-cases" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign in", href: "/auth/signin" },
      { label: "Get started", href: "/auth/signup" },
    ],
  },
]

export default function Footer() {
  return (
    <>
    <style>{`
      .sr-footer-link:hover { color: var(--db-text) !important; }
    `}</style>
    <footer
      style={{
        borderTop: "1px solid var(--db-border)",
        padding: "64px 0 48px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Top row: logo + nav groups */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 48,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--db-text)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              Dealbeam
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 14,
                color: "var(--db-text-muted)",
                maxWidth: 260,
                lineHeight: 1.6,
              }}
            >
              Know the moment your buyer reads your proposal.
            </div>
          </div>

          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--db-text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 16,
                  }}
                >
                  {group.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {group.links.map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="sr-footer-link"
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 14,
                        color: "var(--db-text-secondary)",
                        textDecoration: "none",
                        transition: "color 150ms ease",
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            borderTop: "1px solid var(--db-border)",
            paddingTop: 24,
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 13,
            color: "var(--db-text-muted)",
          }}
        >
          &copy; {new Date().getFullYear()} Dealbeam. All rights reserved.
        </div>
      </div>
    </footer>
    </>
  )
}
