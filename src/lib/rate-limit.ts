/**
 * Rate limiter with Upstash Redis (production) and in-memory fallback (local dev).
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, uses a
 * distributed sliding-window limiter shared across all serverless instances.
 *
 * Without those env vars, falls back to a simple in-memory sliding-window
 * limiter (best-effort, resets on cold-start).
 *
 * Usage:
 *   const limiter = rateLimit({ limit: 10, window: "60s" });
 *   const { success } = await limiter.limit(ip);
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Types ──

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

interface RateLimiter {
  limit(token: string): Promise<RateLimitResult>;
}

type WindowDuration = `${number}${"s" | "m" | "h" | "d"}`;

interface RateLimitConfig {
  /** Max requests per window (e.g. 10). */
  limit: number;
  /** Time window as a duration string (e.g. "60s", "1m", "1h"). */
  window: WindowDuration;
  /** Optional prefix for Redis keys (default: "rl"). */
  prefix?: string;
}

// ── Upstash Redis singleton ──

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ── In-memory fallback ──

interface TokenBucket {
  count: number;
  expiresAt: number;
}

function parseWindowMs(window: WindowDuration): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60_000;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return value * 1_000;
    case "m": return value * 60_000;
    case "h": return value * 3_600_000;
    case "d": return value * 86_400_000;
    default: return 60_000;
  }
}

function createInMemoryLimiter(config: RateLimitConfig): RateLimiter {
  const intervalMs = parseWindowMs(config.window);
  const tokenCache = new Map<string, TokenBucket>();

  // Periodic cleanup
  const timer = setInterval(() => {
    const now = Date.now();
    tokenCache.forEach((bucket, key) => {
      if (bucket.expiresAt <= now) tokenCache.delete(key);
    });
  }, intervalMs);
  if (timer && typeof timer === "object" && "unref" in timer) {
    (timer as NodeJS.Timeout).unref();
  }

  return {
    async limit(token: string): Promise<RateLimitResult> {
      const now = Date.now();

      // Evict expired
      const existing = tokenCache.get(token);
      if (existing && existing.expiresAt <= now) {
        tokenCache.delete(token);
      }

      const bucket = tokenCache.get(token);
      if (!bucket) {
        // LRU eviction if too many tokens
        if (tokenCache.size >= 500) {
          const firstKey = tokenCache.keys().next().value;
          if (firstKey) tokenCache.delete(firstKey);
        }
        tokenCache.set(token, { count: 1, expiresAt: now + intervalMs });
        return { success: true, remaining: config.limit - 1 };
      }

      if (bucket.count >= config.limit) {
        return { success: false, remaining: 0 };
      }

      bucket.count += 1;
      return { success: true, remaining: config.limit - bucket.count };
    },
  };
}

// ── Factory ──

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const r = getRedis();
  if (r) {
    const upstash = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: config.prefix ?? "rl",
    });
    return {
      async limit(token: string): Promise<RateLimitResult> {
        const result = await upstash.limit(token);
        return { success: result.success, remaining: result.remaining };
      },
    };
  }

  // Fallback for local development
  return createInMemoryLimiter(config);
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
