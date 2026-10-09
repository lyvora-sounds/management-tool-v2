import { describe, expect, it } from "vitest";
import {
  createExternalAccessToken,
  hashExternalAccessToken,
  readBearerToken,
  readTokenRequest,
} from "@/lib/externalAccess";

describe("external access tokens", () => {
  it("keeps read-only as the default and accepts write access only explicitly", () => {
    expect(readTokenRequest({ name: "Claude" })).toEqual({ name: "Claude", expiresAt: null });
    expect(readTokenRequest({ name: "Claude", access: "write" })).toEqual({ name: "Claude", expiresAt: null, access: "write" });
    expect(readTokenRequest({ name: "Claude", access: "admin" })).toHaveProperty("error");
  });
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

  it("reads a name and ignores environment fields", () => {
    expect(readTokenRequest({ name: " Claude ", allEnvironments: false, environments: ["dev"] })).toEqual({
      name: "Claude",
      expiresAt: null,
    });
    expect(readTokenRequest({ name: "" })).toEqual({
      error: "Name must contain 1 to 80 characters",
    });
    const expiresAt = new Date("2027-01-01T00:00:00.000Z");
    expect(readTokenRequest({ name: "ok", expiresAt: expiresAt.toISOString() })).toEqual({
      name: "ok",
      expiresAt,
    });
    expect(readTokenRequest({ name: "ok", expiresAt: "not-a-date" })).toEqual({
      error: "Expiration must be a future date",
    });
  });
});
