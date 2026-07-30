/**
 * Minimal request-body string hygiene for route handlers. Returns null when
 * the value isn't a string (caller turns that into a 400 instead of letting
 * `.trim()` throw a 500 through withErrorHandler); trims and caps length so
 * oversized payloads can't blow past index limits or bloat list payloads.
 */
export function cleanString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}
