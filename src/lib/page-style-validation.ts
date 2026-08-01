import {
  ACCENT_COLORS,
  COVER_HEIGHTS,
  COVER_LAYOUTS,
  HERO_LAYOUTS,
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

const MAX_LINKS = 50;
const MAX_LINK_LABEL = 200;
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
  return v === "" || isValidHttpUrl(v);
}

/** Raw hex (new format) or a legacy named accent key (see getAccentColor). */
function isValidAccent(v: unknown): boolean {
  return (
    isValidHex(v) ||
    (typeof v === "string" &&
      Object.prototype.hasOwnProperty.call(ACCENT_COLORS, v))
  );
}

/**
 * Link URLs mirror the render-time contract (tabbed-page-view sanitizeUrl):
 * protocol-less values get https:// prefixed at render, mailto:/tel: are
 * allowed — so here we only reject what render-time would neuter anyway,
 * plus absurd lengths. Rejecting more would 400 legacy rows and mid-typing
 * autosaves that previously succeeded.
 */
function isSafeLinkUrl(v: unknown): boolean {
  if (typeof v !== "string" || v.length > MAX_URL) return false;
  return !/^\s*(javascript|data|vbscript)\s*:/i.test(v);
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
      isSafeLinkUrl((item as Record<string, unknown>).url)
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
  heroLayout: inOptions(HERO_LAYOUTS),
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
