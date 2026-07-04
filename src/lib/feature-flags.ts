/**
 * Build-time feature flags.
 *
 * Plain exported constants so they work in both Server and Client Components
 * without an env round-trip. Flip a flag and redeploy to toggle a feature.
 */

/**
 * Session replay (rrweb) — recording + playback of buyer sessions.
 *
 * Temporarily disabled: hides the enable toggle (share modal) and the replay
 * viewer (buyer analytics), and stops the recorder from mounting on published
 * pages so no new sessions are captured. The underlying feature code and stored
 * recordings are left intact — set this back to `true` to re-enable everything.
 */
export const SESSION_REPLAY_ENABLED = false;
