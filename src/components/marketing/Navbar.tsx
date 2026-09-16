"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { APP_NAME } from "@/lib/constants"

const NAV_LINKS = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how" },
  { label: "Templates", href: "/#templates" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Philosophy", href: "/#philosophy" },
]

function toggleTheme() {
  const root = document.documentElement
  const next = root.getAttribute("data-mk-theme") === "dark" ? "light" : "dark"
  if (next === "dark") root.setAttribute("data-mk-theme", "dark")
  else root.removeAttribute("data-mk-theme")
  try {
    localStorage.setItem("mk-theme", next)
  } catch {
    // private mode — theme just won't persist
  }
}

/**
 * Sticky, translucent header. Gains a hairline + shadow once the page has
 * scrolled; collapses to a burger under 900px with an animated disclosure
 * menu (grid-template-rows transition, no layout library).
 */
export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const isCurrent = (href: string) => !href.includes("#") && pathname === href

  return (
    <header className="mk-header" data-scrolled={scrolled ? "true" : "false"}>
      <nav className="mk-nav" aria-label="Main">
        <Link href="/" className="mk-brand" aria-label={`${APP_NAME} home`}>
          <span className="mk-brand-mark" aria-hidden>{APP_NAME.charAt(0)}</span>
          <span className="mk-brand-name">{APP_NAME}</span>
        </Link>

        <div className="mk-nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="mk-nav-link" aria-current={isCurrent(href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>

        <div className="mk-nav-right">
          <Link href="/auth/signin" className="mk-nav-link mk-nav-signin">Sign in</Link>
          <button type="button" className="mk-icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
          <Link href="/auth/signup" className="mk-cta">Start free</Link>
          <button
            type="button"
            className="mk-icon-btn mk-burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              {open ? (
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <div className="mk-mobile" id={menuId} data-open={open ? "true" : "false"} aria-hidden={!open}>
        <div>
          <div className="mk-mobile-in">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="mk-mobile-link" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <div className="mk-mobile-cta">
              <Link href="/auth/signin" className="mk-cta-ghost" tabIndex={open ? 0 : -1}>Sign in</Link>
              <Link href="/auth/signup" className="mk-cta" tabIndex={open ? 0 : -1}>Start free</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
