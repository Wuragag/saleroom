/**
 * Per-page Google Fonts loading for the buyer-facing surfaces.
 *
 * The app chrome keeps its own next/font families (DM Sans, Instrument Serif,
 * Inter — see src/app/layout.tsx); every other buyer-page family loads via a
 * per-page <link> stylesheet (PubFontLinks) so a published page downloads
 * only the one or two families the seller actually picked. The CSP already
 * allows fonts.googleapis.com / fonts.gstatic.com (next.config.mjs).
 */

export interface PubFontDef {
  /** Google Fonts family name; null for system fonts that need no download. */
  family: string | null;
  /** css2 axis spec, e.g. "wght@400;500;600;700". */
  axes?: string;
}

/** Keyed by the FONT_OPTIONS value in page-styles.ts. */
export const PUB_FONT_DEFS: Record<string, PubFontDef> = {
  inter: { family: "Inter", axes: "wght@300;400;500;600;700" },
  georgia: { family: null },
  playfair: { family: "Playfair Display", axes: "wght@400;500;600;700" },
  mono: { family: null },
  lora: { family: "Lora", axes: "wght@400;500;600;700" },
  dmsans: { family: "DM Sans", axes: "wght@300;400;500;600;700" },
  instrument: { family: "Instrument Serif", axes: "ital,wght@0,400;1,400" },
  syne: { family: "Syne", axes: "wght@400;500;600;700;800" },
  spacegrotesk: { family: "Space Grotesk", axes: "wght@400;500;600;700" },
  fraunces: { family: "Fraunces", axes: "wght@400;500;600;700" },
  sourceserif: { family: "Source Serif 4", axes: "wght@400;500;600;700" },
  ibmplex: { family: "IBM Plex Sans", axes: "wght@400;500;600;700" },
};

export const ALL_PUB_FONT_KEYS = Object.keys(PUB_FONT_DEFS);

/**
 * Builds a Google Fonts css2 stylesheet URL for the given font keys.
 * Deduplicates, ignores unknown/empty keys and system fonts, and returns
 * null when nothing needs downloading.
 */
export function googleFontsHref(
  keys: (string | null | undefined)[]
): string | null {
  const families: string[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    if (!key) continue;
    const def = PUB_FONT_DEFS[key];
    if (!def?.family || seen.has(key)) continue;
    seen.add(key);
    const family = def.family.replace(/ /g, "+");
    families.push(def.axes ? `family=${family}:${def.axes}` : `family=${family}`);
  }
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
