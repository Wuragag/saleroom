"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { ShowcaseTab } from "@/data/marketing/landing"
import { indexLabel } from "@/data/marketing/landing"
import { ProductFrame } from "./product-ui"

const AUTO_MS = 7000

/**
 * The product tour: a vertical tab rail (WAI-ARIA tabs) beside a stage where
 * every panel stays mounted and cross-fades into place. Tabs auto-advance
 * until the visitor interacts, pausing on hover/focus; auto-play is off under
 * prefers-reduced-motion. Panels are always in the DOM, so crawlers see all
 * four visuals' descriptions.
 */
export default function ProductShowcase({ tabs }: { tabs: ShowcaseTab[] }) {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(false)
  const [paused, setPaused] = useState(false)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setAuto(true)
  }, [])

  useEffect(() => {
    if (!auto || paused) return
    const t = window.setTimeout(() => setActive((i) => (i + 1) % tabs.length), AUTO_MS)
    return () => window.clearTimeout(t)
  }, [auto, paused, active, tabs.length])

  const choose = useCallback((i: number) => {
    setAuto(false)
    setActive(i)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = tabs.length - 1
    let next: number | null = null
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1
    if (e.key === "Home") next = 0
    if (e.key === "End") next = last
    if (next === null) return
    e.preventDefault()
    choose(next)
    tabRefs.current[next]?.focus()
  }

  const current = tabs[active]

  return (
    <div
      className="mk-show"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      style={{ ["--mk-show-ms" as string]: `${AUTO_MS}ms` }}
    >
      <div>
        <div className="mk-show-tabs" role="tablist" aria-label="Product tour" aria-orientation="vertical">
          {tabs.map((t, i) => {
            const selected = i === active
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[i] = el }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                data-auto={auto && !paused ? "true" : "false"}
                className="mk-show-tab"
                onClick={() => choose(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span className="mk-show-progress" aria-hidden />
                <span className="t"><span className="n">{indexLabel(i)}</span>{t.label}</span>
                <span className="d">
                  <div>
                    <p>{t.body}</p>
                    <ul>{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                  </div>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mk-show-mobile-copy" key={current.id}>
          <p className="mk-body" style={{ marginTop: 16 }}>{current.body}</p>
        </div>
        <div className="mk-show-cta">
          <Link href={current.href} className="mk-arrow">
            {current.kicker} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <div className="mk-show-stage">
        {tabs.map((t, i) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`${baseId}-panel-${t.id}`}
            aria-labelledby={`${baseId}-tab-${t.id}`}
            aria-hidden={i !== active}
            data-active={i === active ? "true" : "false"}
            className="mk-show-panel"
          >
            <ProductFrame visual={t.visual} label={t.alt} />
          </div>
        ))}
      </div>
    </div>
  )
}
