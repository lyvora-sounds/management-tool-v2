export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

/**
 * Bounded fixed-window in-memory rate limiter for Edge middleware and Node route handlers.
 * Note: state is per-instance; multi-replica production deployments should layer WAF/Redis limits on top.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const limit = Math.max(1, options.limit);
  const windowMs = Math.max(1, options.windowMs);
  const maxKeys = Math.max(1, options.maxKeys ?? 5000);
  const store = new Map<string, WindowEntry>();

  function pruneIfNeeded(now: number): void {
    if (store.size < maxKeys) return;
    for (const [entryKey, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(entryKey);
      }
    }
    while (store.size >= maxKeys) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const existing = store.get(key);
      if (!existing || existing.resetAt <= now) {
        if (existing) {
          store.delete(key);
        } else {
          pruneIfNeeded(now);
        }
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return {
          allowed: true,
          limit,
          remaining: Math.max(0, limit - 1),
          retryAfterSeconds: 0,
          resetAt,
        };
      }

      if (existing.count < limit) {
        existing.count += 1;
        return {
          allowed: true,
          limit,
          remaining: Math.max(0, limit - existing.count),
          retryAfterSeconds: 0,
          resetAt: existing.resetAt,
        };
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds,
        resetAt: existing.resetAt,
      };
    },
  };
}

export function extractClientIp(headers: Headers): string {
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}
