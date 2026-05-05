export interface RetryOptions {
  attempts: number;
  isRetryable: (err: unknown) => boolean;
  /** Base delay in ms; total wait after attempt N is `2^(N+1) * baseDelayMs`. Default 1000. */
  baseDelayMs?: number;
  /** Called on each retry (after the catch, before the wait). */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Run `fn` up to `attempts` times with exponential backoff (2s, 4s, 8s by default).
 * Throws non-retryable errors immediately, and the last retryable error if all attempts fail.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { attempts, isRetryable, baseDelayMs = 1000, onRetry }: RetryOptions
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === attempts - 1) throw err;
      const delayMs = Math.pow(2, attempt + 1) * baseDelayMs;
      onRetry?.(err, attempt + 1, delayMs);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
