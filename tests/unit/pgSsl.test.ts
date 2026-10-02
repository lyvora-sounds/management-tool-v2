import { describe, expect, it } from "vitest";
import { withVerifyFullSsl } from "@/lib/pgSsl";

describe("withVerifyFullSsl", () => {
  it("keeps the strict certificate check explicit", () => {
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=require")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full",
    );
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=prefer&channel_binding=require")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full&channel_binding=require",
    );
  });

  it("leaves verify-full and non-ssl urls alone", () => {
    expect(withVerifyFullSsl("postgres://u:p@host/db?sslmode=verify-full")).toBe(
      "postgres://u:p@host/db?sslmode=verify-full",
    );
    expect(withVerifyFullSsl("postgres://u:p@localhost/db")).toBe("postgres://u:p@localhost/db");
    expect(withVerifyFullSsl(undefined)).toBeUndefined();
  });
});
