function extractOrigin(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.origin !== "null" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/**
 * Builds the baseline HTTP security headers applied across all routes via next.config.ts
 * (docs/production-security-checklist.md SEC-20).
 */
export function buildSecurityHeaders(
  env: Record<string, string | undefined> = process.env,
): Array<{ key: string; value: string }> {
  const apiOrigin = extractOrigin(env.NEXT_PUBLIC_API_URL);
  const connectSources = [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://clerk.kikiboard.xyz",
    "https://challenges.cloudflare.com",
    ...(apiOrigin ? [apiOrigin] : []),
  ];

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.kikiboard.xyz https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
    },
    {
      key: "Content-Security-Policy",
      value: csp,
    },
  ];
}
