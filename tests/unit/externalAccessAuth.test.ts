import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueToken = vi.fn();
const updateToken = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    externalAccessToken: {
      findUnique: (...args: unknown[]) => findUniqueToken(...args),
      update: (...args: unknown[]) => updateToken(...args),
    },
  },
}));

const { authenticateExternalAccess, createExternalAccessToken, recordExternalAccessUse } = await import(
  "@/lib/externalAccess"
);

function request(token: string) {
  return new Request("https://kikiboard.test/api/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

function credential(overrides: Record<string, unknown> = {}) {
  return {
    id: "credential-1",
    boardId: "board-1",
    scopes: ["tickets:read"],
    allEnvironments: false,
    environments: ["production"],
    expiresAt: null,
    revokedAt: null,
    board: { title: "Checkout" },
    ...overrides,
  };
}

beforeEach(() => {
  findUniqueToken.mockReset();
  updateToken.mockReset();
  updateToken.mockResolvedValue({});
});

describe("authenticateExternalAccess", () => {
  it("returns the immutable board and environment scope for a valid credential", async () => {
    const generated = createExternalAccessToken();
    findUniqueToken.mockResolvedValue(credential());

    await expect(authenticateExternalAccess(request(generated.token))).resolves.toMatchObject({
      tokenId: "credential-1",
      boardId: "board-1",
      allEnvironments: false,
      environments: ["production"],
    });
    expect(updateToken).not.toHaveBeenCalled();
  });

  it("accepts an explicit all-environments grant without a name list", async () => {
    const generated = createExternalAccessToken();
    findUniqueToken.mockResolvedValue(credential({ allEnvironments: true, environments: [] }));

    await expect(authenticateExternalAccess(request(generated.token))).resolves.toMatchObject({
      allEnvironments: true,
      environments: [],
    });
  });

  it.each([
    ["revoked", { revokedAt: new Date() }],
    ["expired", { expiresAt: new Date(Date.now() - 1_000) }],
    ["wrong scope", { scopes: ["tickets:write"] }],
    ["empty environments", { environments: [] }],
  ])("rejects a %s credential without updating last use", async (_label, overrides) => {
    const generated = createExternalAccessToken();
    findUniqueToken.mockResolvedValue(credential(overrides));

    await expect(authenticateExternalAccess(request(generated.token))).resolves.toBeNull();
    expect(updateToken).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials before querying the database", async () => {
    await expect(authenticateExternalAccess(request("not-a-kiki-token"))).resolves.toBeNull();
    expect(findUniqueToken).not.toHaveBeenCalled();
  });

  it("records use without failing the caller when the write fails", async () => {
    updateToken.mockRejectedValue(new Error("database unavailable"));
    await expect(recordExternalAccessUse("credential-1")).resolves.toBeUndefined();
  });
});
