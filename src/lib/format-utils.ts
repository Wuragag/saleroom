/**
 * Shared formatting utilities used across analytics components.
 */

/** Format seconds into a human-readable duration string (e.g. "45s", "2m 15s"). */
export function formatDuration(s: number): string {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}
