import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind.config.ts defines a custom fontSize scale (text-caption, text-body,
 * text-heading, …) alongside the usual custom color tokens (text-primary,
 * text-foreground, …). Plain `twMerge` doesn't know about that custom scale,
 * so it can't tell "text-body" apart from a text-color utility — it lumps
 * both into the same conflict group and silently drops whichever came first
 * (e.g. `text-primary-foreground text-body` loses the color, leaving text
 * invisible against a dark CTA background). Registering the scale here keeps
 * size and color from colliding.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["3xs", "2xs", "caption", "small", "body", "heading", "title", "display", "stat", "hero"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministically map a seed string to an index in [0, mod).
 * Used by the Tag/Avatar primitives to pick a stable categorical color
 * (`--cat-1..N`) per label/name. Keep this the single source of the hash so
 * the same seed always yields the same swatch everywhere.
 */
export function hashToIndex(seed: string, mod: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % mod
  return h
}

/** First 1–2 initials of a name, uppercased. Falls back to "?". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
