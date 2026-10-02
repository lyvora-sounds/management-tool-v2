import { describe, expect, it } from "vitest";
import {
  allowsEnvironment,
  createExternalAccessToken,
  environmentWhere,
  hashExternalAccessToken,
  parseEnvironmentGrant,
  readBearerToken,
} from "@/lib/externalAccess";

const restricted = {
  boardId: "board-1",
  allEnvironments: false,
  environments: ["production"],
};

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

  it("requires an explicit grant and rejects the wildcard sentinel", () => {
    expect(parseEnvironmentGrant({ allEnvironments: true })).toEqual({
      allEnvironments: true,
      environments: [],
    });
    expect(parseEnvironmentGrant({ environments: ["dev", "dev"] })).toEqual({
      allEnvironments: false,
      environments: ["dev"],
    });
    expect(parseEnvironmentGrant({})).toEqual({
      error: "Environments are required; set allEnvironments or an explicit environment list",
    });
    expect(parseEnvironmentGrant({ allEnvironments: true, environments: ["dev"] })).toEqual({
      error: "Use either allEnvironments or an explicit environment list",
    });
    const wildcard = parseEnvironmentGrant({ environments: ["*"] });
    expect("error" in wildcard).toBe(true);
  });

  it("denies unclassified tickets unless the grant is unrestricted", () => {
    expect(allowsEnvironment(restricted, "production")).toBe(true);
    expect(allowsEnvironment(restricted, "dev")).toBe(false);
    expect(allowsEnvironment(restricted, null)).toBe(false);
    expect(allowsEnvironment({ allEnvironments: true, environments: [] }, null)).toBe(true);
  });

  it("builds one query filter from the same grant", () => {
    expect(environmentWhere(restricted)).toEqual({
      customValues: {
        some: {
          customField: { boardId: "board-1", defaultKey: "environment" },
          value: { in: ["production"] },
        },
      },
    });
    expect(environmentWhere({
      boardId: "board-1",
      allEnvironments: true,
      environments: [],
    })).toEqual({});
    expect(environmentWhere({
      boardId: "board-1",
      allEnvironments: false,
      environments: [],
    })).toEqual({
      customValues: {
        some: {
          customField: { boardId: "board-1", defaultKey: "environment" },
          value: { in: [] },
        },
      },
    });
  });
});
