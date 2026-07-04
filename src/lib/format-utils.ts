/**
 * Shared formatting utilities used across analytics components.
 */

/** Format seconds into a human-readable duration string (e.g. "45s", "2m 15s"). */
export function formatDuration(s: number): string {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Format an ISO timestamp into a relative time string (e.g. "just now", "2m ago", "3d ago", "Jan 15"). */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
