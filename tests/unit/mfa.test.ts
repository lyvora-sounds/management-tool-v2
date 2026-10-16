import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { normalizePhone, totpCode, verifyTotp, createTotpSecret } from "@/lib/mfa";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.ENCRYPTION_SECRET = "secreto-de-test-para-cifrado-aes-256";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("phone numbers", () => {
  it("accepts a country-code number and strips spacing", () => {
    expect(normalizePhone("+971 50 123 4567")).toBe("+971501234567");
  });

  it("rejects a number without a country code", () => {
    expect(normalizePhone("0501234567")).toBeNull();
  });
});

describe("authenticator codes", () => {
  it("accepts the current code and rejects a wrong one", () => {
    const secret = createTotpSecret();
    const code = totpCode(secret);
    const wrong = code === "000000" ? "111111" : "000000";
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, wrong)).toBe(false);
  });
});
