"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  duration?: number
  threshold?: number
  style?: CSSProperties
  className?: string
  /** Render as a different element (e.g. "section", "li"). */
  as?: "div" | "section" | "li" | "article"
}

/**
 * Reveal-on-scroll wrapper. Content is always in the DOM (crawlers see it);
 * only opacity/transform animate, once, when the element enters the viewport.
 * Honors prefers-reduced-motion by rendering visible immediately.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 24,
  duration = 700,
  threshold = 0.12,
  style,
  className,
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  let transform = "none"
  if (direction !== "none") {
    const axis = direction === "up" || direction === "down" ? "Y" : "X"
    const sign = direction === "down" || direction === "right" ? -1 : 1
    transform = `translate${axis}(${sign * distance}px)`
  }

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transform,
        transition: `opacity ${duration}ms ${delay}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {children}
    </Tag>
  )
}
