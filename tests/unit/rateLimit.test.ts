import { describe, expect, it } from "vitest";
import {
  createRateLimiter,
  extractClientIp,
  rateLimitHeaders,
} from "@/lib/rateLimit";

describe("rateLimit helpers", () => {
  it("enforces fixed-window limits, calculates Retry-After, and resets after window expiration", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 10_000 });
    const t0 = 1_000_000;

    expect(limiter.check("ip-1", t0)).toEqual({
      allowed: true,
      limit: 3,
      remaining: 2,
      retryAfterSeconds: 0,
      resetAt: t0 + 10_000,
    });
    expect(limiter.check("ip-1", t0 + 1_000).remaining).toBe(1);
    expect(limiter.check("ip-1", t0 + 2_000)).toEqual({
      allowed: true,
      limit: 3,
      remaining: 0,
      retryAfterSeconds: 0,
      resetAt: t0 + 10_000,
    });

    const blocked = limiter.check("ip-1", t0 + 3_500);
    expect(blocked).toEqual({
      allowed: false,
      limit: 3,
      remaining: 0,
      retryAfterSeconds: 7,
      resetAt: t0 + 10_000,
    });

    // Window expired => counter resets cleanly
    const nextWindow = limiter.check("ip-1", t0 + 10_000);
    expect(nextWindow).toEqual({
      allowed: true,
      limit: 3,
      remaining: 2,
      retryAfterSeconds: 0,
      resetAt: t0 + 20_000,
    });
  });

  it("prunes expired keys and evicts oldest active entries when maxKeys is reached", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 5_000, maxKeys: 2 });
    const t0 = 500_000;

    limiter.check("k1", t0);
    limiter.check("k1", t0); // k1 exhausted
    limiter.check("k2", t0 + 1_000);

    // k3 triggers pruning/eviction of oldest active entry (k1) while k2 remains
    limiter.check("k3", t0 + 2_000);
    expect(limiter.check("k2", t0 + 2_000).remaining).toBe(0);
    // k1 was evicted so it starts fresh
    expect(limiter.check("k1", t0 + 2_000).allowed).toBe(true);
  });

  it("extracts client IP by trusted proxy header precedence", () => {
    expect(
      extractClientIp(
        new Headers({
          "cf-connecting-ip": "203.0.113.10",
          "x-forwarded-for": "198.51.100.1, 10.0.0.1",
          "x-real-ip": "192.0.2.5",
        }),
      ),
    ).toBe("203.0.113.10");

    expect(
      extractClientIp(
        new Headers({
          "x-forwarded-for": "198.51.100.1, 10.0.0.1",
          "x-real-ip": "192.0.2.5",
        }),
      ),
    ).toBe("198.51.100.1");

    expect(
      extractClientIp(new Headers({ "x-real-ip": "192.0.2.5" })),
    ).toBe("192.0.2.5");

    expect(extractClientIp(new Headers())).toBe("unknown");
  });

  it("formats standard rate limit headers with Retry-After only when blocked", () => {
    const allowedHeaders = rateLimitHeaders({
      allowed: true,
      limit: 60,
      remaining: 59,
      retryAfterSeconds: 0,
      resetAt: 1_700_000_000_000,
    });
    expect(allowedHeaders).toEqual({
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "59",
      "X-RateLimit-Reset": "1700000000",
    });

    const blockedHeaders = rateLimitHeaders({
      allowed: false,
      limit: 60,
      remaining: 0,
      retryAfterSeconds: 12,
      resetAt: 1_700_000_000_500,
    });
    expect(blockedHeaders).toEqual({
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1700000001",
      "Retry-After": "12",
    });
  });
});
