import { describe, expect, it } from "vitest";
import {
  allowsEnvironment,
  createExternalAccessToken,
  hashExternalAccessToken,
  readBearerToken,
} from "@/lib/externalAccess";

describe("external access tokens", () => {
  it("creates opaque tokens and only exposes a hash for storage", () => {
    const first = createExternalAccessToken();
    const second = createExternalAccessToken();
    expect(first.token).toMatch(/^kiki_[A-Za-z0-9_-]{43}$/);
    expect(first.hash).toBe(hashExternalAccessToken(first.token));
    expect(first.hash).not.toContain(first.token);
    expect(second.token).not.toBe(first.token);
  });

  it("accepts only a well formed bearer header", () => {
    expect(readBearerToken(new Request("https://example.test", {
      headers: { authorization: "Bearer kiki_secret" },
    }))).toBe("kiki_secret");
    expect(readBearerToken(new Request("https://example.test", {
      headers: { authorization: "Basic abc" },
    }))).toBeNull();
  });

  it("denies unclassified tickets for a restricted environment token", () => {
    expect(allowsEnvironment(["production"], "production")).toBe(true);
    expect(allowsEnvironment(["production"], "dev")).toBe(false);
    expect(allowsEnvironment(["production"], null)).toBe(false);
    expect(allowsEnvironment(["*"], null)).toBe(true);
  });
});
