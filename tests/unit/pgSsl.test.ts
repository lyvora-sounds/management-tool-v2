import net from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { allowSlowIpv4Connect, withVerifyFullSsl } from "@/lib/pgSsl";

const originalAttemptTimeout = net.getDefaultAutoSelectFamilyAttemptTimeout?.();

afterEach(() => {
  if (originalAttemptTimeout != null) {
    net.setDefaultAutoSelectFamilyAttemptTimeout(originalAttemptTimeout);
  }
});

describe("withVerifyFullSsl", () => {
  it("keeps the strict certificate check explicit", () => {
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=require")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full",
    );
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=prefer&channel_binding=require")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full&channel_binding=require",
    );
  });

  it("gives a slow IPv4 route time to connect", () => {
    net.setDefaultAutoSelectFamilyAttemptTimeout(500);
    allowSlowIpv4Connect();
    expect(net.getDefaultAutoSelectFamilyAttemptTimeout()).toBe(10_000);
    net.setDefaultAutoSelectFamilyAttemptTimeout(10_000);
    allowSlowIpv4Connect();
    expect(net.getDefaultAutoSelectFamilyAttemptTimeout()).toBe(10_000);
  });

  it("leaves verify-full and non-ssl urls alone", () => {
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=verify-full")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full",
    );
    expect(withVerifyFullSsl("postgres://u:p@localhost/db")).toBe("postgres://u:p@localhost/db");
    expect(withVerifyFullSsl(undefined)).toBeUndefined();
  });
});
