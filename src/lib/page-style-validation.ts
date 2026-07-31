import {
  ACCENT_COLORS,
  COVER_HEIGHTS,
  COVER_LAYOUTS,
  WIDTH_OPTIONS,
} from "./page-styles";
import {
  isValidBackgroundKey,
  isValidDepthKey,
  isValidFontKey,
  isValidHex,
  isValidRadiusKey,
} from "./brand-kit";

/**
 * Server-side validation for the design/style fields accepted by the pages
 * PUT endpoint. The style panel only ever sends valid values, so a failure
 * here means a hand-crafted request — reject it instead of persisting junk
 * that every renderer then has to defensively fall back from.
 */

const MAX_LINKS = 20;
const MAX_LINK_LABEL = 80;
const MAX_URL = 2048;

function isValidHttpUrl(v: unknown): boolean {
  if (typeof v !== "string" || v.length > MAX_URL) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** "" (unset) or an http(s) URL — used for logoUrl / coverImage. */
function isValidOptionalUrl(v: unknown): boolean {
  return v === "" || v === null || isValidHttpUrl(v);
}

/** Raw hex (new format) or a legacy named accent key (see getAccentColor). */
function isValidAccent(v: unknown): boolean {
  return isValidHex(v) || (typeof v === "string" && v in ACCENT_COLORS);
}

function isValidLinksJson(v: unknown): boolean {
  if (typeof v !== "string") return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(v);
  } catch {
    return false;
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_LINKS) return false;
  return parsed.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === "string" &&
      ((item as Record<string, unknown>).label as string).length <= MAX_LINK_LABEL &&
      isValidHttpUrl((item as Record<string, unknown>).url)
  );
}

const inOptions = (options: { value: string }[]) => (v: unknown) =>
  options.some((o) => o.value === v);

/**
 * Per-field validators for every style field the pages PUT accepts. Only
 * fields present in the patch are checked; unknown fields are ignored (the
 * route whitelists what it persists).
 */
const STYLE_FIELD_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  font: (v) => v !== "" && isValidFontKey(v),
  headingFont: isValidFontKey, // "" = same as body
  accentColor: isValidAccent,
  layoutWidth: inOptions(WIDTH_OPTIONS),
  background: isValidBackgroundKey,
  tabPlacement: (v) => v === "top" || v === "left",
  coverLayout: inOptions(COVER_LAYOUTS),
  coverHeight: inOptions(COVER_HEIGHTS),
  themeRadius: isValidRadiusKey,
  themeDepth: isValidDepthKey,
  logoUrl: isValidOptionalUrl,
  coverImage: isValidOptionalUrl,
  links: isValidLinksJson,
};

export interface StylePatchResult {
  ok: boolean;
  /** First invalid field name, when ok is false. */
  field?: string;
}

/** Validates the style fields present in a pages PUT body. */
export function validatePageStylePatch(
  body: Record<string, unknown>
): StylePatchResult {
  for (const [field, isValid] of Object.entries(STYLE_FIELD_VALIDATORS)) {
    if (body[field] !== undefined && !isValid(body[field])) {
      return { ok: false, field };
    }
  }
  return { ok: true };
}
