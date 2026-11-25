import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "@/lib/securityHeaders";

function toHeaderMap(headers: Array<{ key: string; value: string }>) {
  return new Map(headers.map((h) => [h.key, h.value]));
}

describe("buildSecurityHeaders", () => {
  it("returns all baseline security headers with strict defaults", () => {
    const map = toHeaderMap(buildSecurityHeaders({}));

    expect(map.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(map.get("X-Content-Type-Options")).toBe("nosniff");
    expect(map.get("X-Frame-Options")).toBe("DENY");
    expect(map.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(map.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
    );

    const csp = map.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("https://*.clerk.accounts.dev");
    expect(csp).toContain("https://challenges.cloudflare.com");
  });

  it("injects the NEXT_PUBLIC_API_URL origin into connect-src and ignores invalid URLs", () => {
    const withApi = toHeaderMap(
      buildSecurityHeaders({ NEXT_PUBLIC_API_URL: "https://api.kikiboard.xyz/v1/" }),
    );
    const cspWithApi = withApi.get("Content-Security-Policy") ?? "";
    expect(cspWithApi).toContain(
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.kikiboard.xyz https://challenges.cloudflare.com https://api.kikiboard.xyz;",
    );

    const withBadUrl = toHeaderMap(
      buildSecurityHeaders({ NEXT_PUBLIC_API_URL: "not-a-valid-url" }),
    );
    expect(withBadUrl.get("Content-Security-Policy")).not.toContain("not-a-valid-url");

    const withJsUrl = toHeaderMap(
      buildSecurityHeaders({ NEXT_PUBLIC_API_URL: "javascript:alert(1)" }),
    );
    expect(withJsUrl.get("Content-Security-Policy")).not.toContain("javascript:");
  });
});
