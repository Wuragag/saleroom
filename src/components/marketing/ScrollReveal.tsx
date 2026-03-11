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
  as?: "div" | "section" | "li"
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  duration = 600,
  threshold = 0.15,
  style,
  className,
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const getTransform = () => {
    if (direction === "none") return "none"
    const axis = direction === "up" || direction === "down" ? "Y" : "X"
    const sign = direction === "down" || direction === "right" ? -1 : 1
    return `translate${axis}(${sign * distance}px)`
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : getTransform(),
        transition: `opacity ${duration}ms ${delay}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {children}
    </Tag>
  )
}

/* Stagger wrapper — adds incremental delay to direct children */
export function ScrollRevealGroup({
  children,
  stagger = 80,
  baseDelay = 0,
  direction = "up" as ScrollRevealProps["direction"],
  className,
  style,
}: {
  children: ReactNode[]
  stagger?: number
  baseDelay?: number
  direction?: ScrollRevealProps["direction"]
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={className} style={style}>
      {(Array.isArray(children) ? children : [children]).map((child, i) => (
        <ScrollReveal key={i} delay={baseDelay + i * stagger} direction={direction}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  )
}
