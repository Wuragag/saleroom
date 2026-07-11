"use client"

import Link from "next/link"
import { APP_NAME } from "@/lib/constants"

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "Philosophy", href: "/#philosophy" },
  { label: "Pricing", href: "/pricing" },
  { label: "Features", href: "/features" },
]

function toggleTheme() {
  const root = document.documentElement
  const next = root.getAttribute("data-mk-theme") === "dark" ? "light" : "dark"
  if (next === "dark") {
    root.setAttribute("data-mk-theme", "dark")
  } else {
    root.removeAttribute("data-mk-theme")
  }
  try {
    localStorage.setItem("mk-theme", next)
  } catch {
    // private mode — theme just won't persist
  }
}

export default function Navbar() {
  return (
    <>
      <style>{`
        .mk-nav-link {
          font-size: 14px;
          color: var(--db-text-secondary);
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 999px;
          transition: color .15s ease, background .15s ease;
        }
        .mk-nav-link:hover { color: var(--db-text); background: var(--db-surface-dim); }
        .mk-theme-btn {
          font-family: inherit;
          width: 36px; height: 36px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--db-text-secondary);
          background: transparent;
          border: 1px solid var(--db-border-hover);
          border-radius: 999px;
          cursor: pointer;
          transition: color .15s ease, background .15s ease;
        }
        .mk-theme-btn:hover { color: var(--db-text); background: var(--db-surface); }
        @media (max-width: 900px) {
          .mk-nav-links { display: none !important; }
        }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "color-mix(in srgb, var(--db-bg) 82%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--db-border)",
        }}
      >
        <nav
          aria-label="Main"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "14px 24px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "var(--db-text)",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--db-cta-grad)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--db-on-accent)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "var(--db-cta-shadow)",
              }}
            >
              {APP_NAME.charAt(0)}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {APP_NAME}
            </span>
          </Link>

          <div className="mk-nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="mk-nav-link">
                {label}
              </Link>
            ))}
            <Link href="/auth/signin" className="mk-nav-link">
              Sign in
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="mk-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Link href="/auth/signup" className="mk-cta">
              Start
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}
