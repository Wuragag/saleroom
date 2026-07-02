/**
 * Content-color palettes — the color *choices* a user picks for their own page
 * content (text color in the editor toolbar, accent color in the style panel).
 *
 * These are USER DATA, not app-chrome design tokens: they are the options a
 * seller selects from to brand their published page, so they legitimately hold
 * raw hex values. This file is allowlisted by `scripts/check-design-tokens.mjs`
 * (see docs/DESIGN-SYSTEM.md → Scope → "Content-color pickers"). Keep app-chrome
 * colors OUT of here — those belong in tokens.
 */

/** Text-color swatches shown in the editor toolbar's color picker. */
export const SWATCHES: { label: string; value: string }[] = [
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Gray", value: "#6B7280" },
  { label: "Silver", value: "#D1D5DB" },
  { label: "Red", value: "#EF4444" },
  { label: "Orange", value: "#F97316" },
  { label: "Yellow", value: "#EAB308" },
  { label: "Green", value: "#22C55E" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Pink", value: "#EC4899" },
];

/** Curated accent-color presets for the page style panel — 12 colors, 6 per row. */
export const PRESET_COLORS: string[] = [
  "#0f172a", // near-black
  "#1e40af", // deep blue
  "#2563eb", // blue
  "#7c3aed", // violet
  "#a21caf", // fuchsia
  "#e11d48", // rose
  "#f97316", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
  "#64748b", // slate
];
