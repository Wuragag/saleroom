/**
 * Simple in-memory sliding-window rate limiter.
 *
 * ⚠️  SERVERLESS LIMITATION: This limiter uses an in-memory Map that is NOT
 * shared across serverless function instances. On platforms like Vercel, each
 * cold-start creates a fresh Map, so a determined attacker can bypass limits
 * by hitting different instances. This still provides *best-effort* protection
 * against naive abuse (bots, accidental loops, etc.).
 *
 * For production-grade rate limiting, replace this with a shared store such as:
 *  - Upstash Redis (`@upstash/ratelimit`)
 *  - Vercel KV / Redis
 *  - Cloudflare Workers KV or Durable Objects
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
 *   const { success } = await limiter.check(ip, 10); // 10 requests per interval
 */

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60 000 = 1 min). */
  interval?: number;
  /** Max number of unique tokens (IPs) tracked per interval (LRU eviction). */
  uniqueTokenPerInterval?: number;
}

interface TokenBucket {
  count: number;
  expiresAt: number;
}

export function rateLimit(opts: RateLimitOptions = {}) {
  const interval = opts.interval ?? 60_000;
  const maxTokens = opts.uniqueTokenPerInterval ?? 500;

  const tokenCache = new Map<string, TokenBucket>();

  // Periodic cleanup to prevent memory leaks
  const cleanup = () => {
    const now = Date.now();
    tokenCache.forEach((bucket, key) => {
      if (bucket.expiresAt <= now) {
        tokenCache.delete(key);
      }
    });
  };

  // Run cleanup every interval
  if (typeof globalThis !== "undefined") {
    const timer = setInterval(cleanup, interval);
    // Allow process to exit without waiting for this timer
    if (timer && typeof timer === "object" && "unref" in timer) {
      (timer as NodeJS.Timeout).unref();
    }
  }

  return {
    check(token: string, limit: number): { success: boolean; remaining: number } {
      const now = Date.now();

      // Evict expired entry
      const existing = tokenCache.get(token);
      if (existing && existing.expiresAt <= now) {
        tokenCache.delete(token);
      }

      const bucket = tokenCache.get(token);

      if (!bucket) {
        // Enforce LRU eviction if cache is full
        if (tokenCache.size >= maxTokens) {
          const firstKey = tokenCache.keys().next().value;
          if (firstKey) tokenCache.delete(firstKey);
        }

        tokenCache.set(token, { count: 1, expiresAt: now + interval });
        return { success: true, remaining: limit - 1 };
      }

      if (bucket.count >= limit) {
        return { success: false, remaining: 0 };
      }

      bucket.count += 1;
      return { success: true, remaining: limit - bucket.count };
    },
  };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel (x-forwarded-for), Cloudflare (cf-connecting-ip),
 * and falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; first is the client
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
