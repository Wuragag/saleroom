import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
