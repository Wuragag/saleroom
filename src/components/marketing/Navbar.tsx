"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Case Studies", href: "#case-studies" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <style>{`
        .sr-nav-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 15px;
          color: #A8A8B3;
          text-decoration: none;
          transition: color 150ms ease;
          cursor: pointer;
        }
        .sr-nav-link:hover { color: #F8F7F4; }

        .sr-sign-in {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px;
          color: #A8A8B3;
          text-decoration: none;
          transition: color 150ms ease;
          cursor: pointer;
        }
        .sr-sign-in:hover { color: #F8F7F4; }

        .sr-start-btn {
          font-family: var(--font-syne), sans-serif;
          font-size: 14px;
          font-weight: 700;
          background: #3B82F6;
          color: #0A0A0F;
          border-radius: 8px;
          padding: 10px 20px;
          text-decoration: none;
          display: inline-block;
          cursor: pointer;
          transition: filter 150ms ease, transform 150ms ease;
          line-height: 1;
          white-space: nowrap;
        }
        .sr-start-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .sr-nav-center { display: none !important; }
        }
        @media (max-width: 480px) {
          .sr-sign-in { display: none; }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "background 250ms ease, border-color 250ms ease, backdrop-filter 250ms ease",
          background: scrolled ? "rgba(10,10,15,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid #1E1E2E" : "1px solid transparent",
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
          {/* ── Logo ── */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: "#F8F7F4",
              letterSpacing: "-0.02em",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden="true">⚡</span>
            SalesRoom
          </Link>

          {/* ── Centre nav ── */}
          <div
            className="sr-nav-center"
            style={{ display: "flex", alignItems: "center", gap: 40 }}
            role="list"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="sr-nav-link" role="listitem">
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/auth/signin" className="sr-sign-in">
              Sign in
            </Link>
            <Link href="/auth/signup" className="sr-start-btn">
              Start free
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
