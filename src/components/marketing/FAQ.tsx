"use client"

import { useId, useState } from "react"
import type { FaqEntry } from "@/lib/seo"

/**
 * Accordion whose answers are always in the DOM (only their height animates),
 * so crawlers and assistants read every answer while visitors get a smooth
 * grid-template-rows transition.
 */
export default function FAQ({ entries, defaultOpen = 0 }: { entries: FaqEntry[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen)
  const baseId = useId()
  return (
    <div className="mk-faq">
      {entries.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.question} className="mk-faq-item">
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="mk-faq-q"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {item.question}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </h3>
            <div id={`${baseId}-a-${i}`} className="mk-faq-a" data-open={isOpen ? "true" : "false"} role="region">
              <div><p>{item.answer}</p></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
