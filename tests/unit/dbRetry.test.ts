import { describe, expect, it } from "vitest";
import { isTransientDbError } from "@/lib/dbRetry";

describe("isTransientDbError", () => {
  it("recognizes a dropped Neon connection", () => {
    expect(isTransientDbError(new Error("Connection terminated unexpectedly"))).toBe(true);
    expect(isTransientDbError(Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }))).toBe(true);
    expect(
      isTransientDbError(
        new Error("Client network socket disconnected before secure TLS connection was established"),
      ),
    ).toBe(true);
  });

  it("leaves real query failures alone", () => {
    expect(isTransientDbError(new Error("Unique constraint failed"))).toBe(false);
    expect(isTransientDbError("nope")).toBe(false);
  });
});
