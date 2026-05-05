/**
 * Robust JSON extraction from LLM output.
 * Strips ```code fences (complete or truncated), then parses; falls back to the
 * outermost `{ ... }` if there's preamble text. Returns null if no valid object.
 */
export function extractFirstJsonObject<T = unknown>(text: string): T | null {
  let str = text.trim();

  if (str.startsWith("```")) {
    const firstNewline = str.indexOf("\n");
    if (firstNewline !== -1) str = str.slice(firstNewline + 1);
  }
  if (str.endsWith("```")) {
    str = str.slice(0, -3);
  }
  str = str.trim();

  try {
    return JSON.parse(str) as T;
  } catch {
    const firstBrace = str.indexOf("{");
    const lastBrace = str.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(str.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Anthropic-style transient errors worth retrying: rate-limit, overloaded, service-unavailable. */
export function isAnthropicRetryableError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 429 || status === 529 || status === 503;
}
