"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FEATURES } from "@/data/marketing/features"

const NAV_LINKS = [
  { label: "Features", href: "/features", hasDropdown: true },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Examples", href: "/examples" },
  { label: "Pricing", href: "/pricing" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const openDropdown = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current)
    setDropdownOpen(true)
  }
  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  return (
    <>
      <style>{`
        .sr-nav-pill:hover { opacity: 0.85; }
        .sr-nav-link {
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--sr-text-secondary);
          text-decoration: none;
          transition: color 150ms ease;
          position: relative;
        }
        .sr-nav-link:hover, .sr-nav-link[data-active="true"] {
          color: var(--sr-text);
        }
        .sr-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--sr-surface);
          border: 1px solid var(--sr-border);
          border-radius: 12px;
          padding: 8px;
          min-width: 220px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
          opacity: 0;
          pointer-events: none;
          transition: opacity 150ms ease, transform 150ms ease;
          transform: translateX(-50%) translateY(4px);
        }
        .sr-dropdown[data-open="true"] {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .sr-dropdown-item {
          display: block;
          padding: 10px 14px;
          font-family: var(--font-inter), sans-serif;
          font-size: 14px;
          color: var(--sr-text-secondary);
          text-decoration: none;
          border-radius: 8px;
          transition: background 150ms ease, color 150ms ease;
        }
        .sr-dropdown-item:hover {
          background: var(--sr-surface-dim);
          color: var(--sr-text);
        }
        .sr-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 199;
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms ease;
        }
        .sr-mobile-overlay[data-open="true"] {
          opacity: 1;
          pointer-events: auto;
        }
        .sr-mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: var(--sr-surface);
          z-index: 200;
          padding: 24px;
          transform: translateX(100%);
          transition: transform 250ms ease;
          overflow-y: auto;
        }
        .sr-mobile-drawer[data-open="true"] {
          transform: translateX(0);
        }
        .sr-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: var(--sr-text);
        }
        .sr-desktop-nav { display: flex; }
        .sr-desktop-actions { display: flex; }
        @media (max-width: 768px) {
          .sr-hamburger { display: flex; }
          .sr-desktop-nav { display: none !important; }
          .sr-desktop-actions { display: none !important; }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 300ms ease",
          background: scrolled ? "rgba(250,250,248,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--sr-border)"
            : "1px solid transparent",
        }}
        aria-label="Main navigation"
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--sr-text)",
              letterSpacing: "-0.02em",
              textDecoration: "none",
            }}
          >
            SalesRoom
          </Link>

          {/* Center nav */}
          <div
            className="sr-desktop-nav"
            style={{ alignItems: "center", gap: 32 }}
          >
            {NAV_LINKS.map((link) => (
              <div
                key={link.label}
                style={{ position: "relative" }}
                onMouseEnter={link.hasDropdown ? openDropdown : undefined}
                onMouseLeave={link.hasDropdown ? closeDropdown : undefined}
              >
                <Link
                  href={link.href}
                  className="sr-nav-link"
                  data-active={pathname.startsWith(link.href) ? "true" : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  {link.label}
                  {link.hasDropdown && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        transition: "transform 150ms ease",
                        transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)",
                      }}
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Link>

                {link.hasDropdown && (
                  <div className="sr-dropdown" data-open={dropdownOpen ? "true" : undefined}>
                    <Link href="/features" className="sr-dropdown-item" style={{ fontWeight: 600, color: "var(--sr-text)" }}>
                      All Features
                    </Link>
                    {FEATURES.map((f) => (
                      <Link
                        key={f.slug}
                        href={`/features/${f.slug}`}
                        className="sr-dropdown-item"
                      >
                        {f.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div
            className="sr-desktop-actions"
            style={{ alignItems: "center", gap: 24 }}
          >
            <Link
              href="/auth/signin"
              className="sr-nav-link"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="sr-nav-pill"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 14,
                fontWeight: 500,
                background: "var(--sr-text)",
                color: "#FFFFFF",
                borderRadius: 100,
                padding: "10px 24px",
                textDecoration: "none",
                transition: "opacity 150ms ease",
              }}
            >
              Get started
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="sr-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className="sr-mobile-overlay"
        data-open={mobileOpen ? "true" : undefined}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className="sr-mobile-drawer"
        data-open={mobileOpen ? "true" : undefined}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--sr-text)",
              padding: 4,
            }}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_LINKS.map((link) => (
            <div key={link.label}>
              <Link
                href={link.href}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 16,
                  fontWeight: 500,
                  color: pathname.startsWith(link.href) ? "var(--sr-text)" : "var(--sr-text-secondary)",
                  textDecoration: "none",
                  borderRadius: 8,
                }}
              >
                {link.label}
              </Link>
              {link.hasDropdown && (
                <div style={{ paddingLeft: 16 }}>
                  {FEATURES.map((f) => (
                    <Link
                      key={f.slug}
                      href={`/features/${f.slug}`}
                      style={{
                        display: "block",
                        padding: "8px 16px",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 14,
                        color: "var(--sr-text-muted)",
                        textDecoration: "none",
                        borderRadius: 8,
                      }}
                    >
                      {f.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--sr-border)",
            marginTop: 24,
            paddingTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Link
            href="/auth/signin"
            style={{
              display: "block",
              padding: "12px 16px",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "var(--sr-text-secondary)",
              textDecoration: "none",
              textAlign: "center",
              borderRadius: 8,
            }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            style={{
              display: "block",
              padding: "14px 24px",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              fontWeight: 500,
              background: "var(--sr-text)",
              color: "#FFFFFF",
              borderRadius: 100,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Get started
          </Link>
        </div>
      </div>
    </>
  )
}
