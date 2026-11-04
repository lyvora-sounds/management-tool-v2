import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUser = vi.fn();
const listTokens = vi.fn();
const revokeTokens = vi.fn();
const createToken = vi.fn();
const findAccessibleBoard = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/db", () => ({ default: {
  user: { findUnique: (...args: unknown[]) => findUser(...args) },
  board: { findFirst: (...args: unknown[]) => findAccessibleBoard(...args) },
  externalAccessToken: {
    findMany: (...args: unknown[]) => listTokens(...args),
    create: (...args: unknown[]) => createToken(...args),
    updateMany: (...args: unknown[]) => revokeTokens(...args),
  },
} }));

const { GET, POST, DELETE } = await import("@/app/api/settings/mcp/tokens/route");

function request(method: string, data?: unknown, origin = "https://kikiboard.test") {
  return new Request("https://kikiboard.test/api/settings/mcp/tokens", {
    method,
    headers: { origin, "content-type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.test");
  auth.mockResolvedValue({ userId: "clerk-1" });
  findUser.mockResolvedValue({ id: "user-1" });
  listTokens.mockResolvedValue([]);
  revokeTokens.mockResolvedValue({ count: 1 });
  findAccessibleBoard.mockResolvedValue({ id: "board-1" });
  createToken.mockResolvedValue({
    id: "token-1",
    name: "Cursor",
    tokenPrefix: "kiki_abc",
    scopes: ["tickets:read", "tickets:write"],
    fullAccess: true,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    organization: null,
    board: null,
  });
});

describe("personal MCP tokens", () => {
  it("lists the current user's active tokens without the secret or hash", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(listTokens.mock.calls[0][0].where).toEqual({ createdById: "user-1", revokedAt: null });
    expect(listTokens.mock.calls[0][0].select).not.toHaveProperty("tokenHash");
    expect(listTokens.mock.calls[0][0].select).toMatchObject({
      id: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      fullAccess: true,
      lastUsedAt: true,
      createdAt: true,
    });
  });

  it("rejects unauthenticated listing", async () => {
    auth.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBe(401);
    expect(listTokens).not.toHaveBeenCalled();
  });

  it("creates a personal token for a member with board access", async () => {
    const response = await POST(request("POST", { name: "Cursor", access: "write" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.token).toMatch(/^kiki_/);
    expect(findAccessibleBoard.mock.calls[0][0].where).toMatchObject({ OR: expect.any(Array) });
    expect(createToken.mock.calls[0][0].data).toMatchObject({
      name: "Cursor",
      fullAccess: true,
      organizationId: null,
      boardId: null,
      createdById: "user-1",
      scopes: ["tickets:read", "tickets:write"],
    });
  });

  it("rejects personal token creation when the user can open no boards", async () => {
    findAccessibleBoard.mockResolvedValue(null);
    const response = await POST(request("POST", { name: "Cursor", access: "write" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "You need access to at least one board to create a personal MCP token",
    });
    expect(createToken).not.toHaveBeenCalled();
  });

  it("revokes only a token the current user created", async () => {
    const response = await DELETE(request("DELETE", { id: "token-1" }));
    expect(response.status).toBe(200);
    expect(revokeTokens.mock.calls[0][0].where).toMatchObject({
      id: "token-1",
      createdById: "user-1",
      revokedAt: null,
    });
    revokeTokens.mockResolvedValue({ count: 0 });
    expect((await DELETE(request("DELETE", { id: "foreign-token" }))).status).toBe(404);
  });

  it("blocks unauthenticated and cross-origin revocation", async () => {
    expect((await DELETE(request("DELETE", { id: "token-1" }, "https://evil.test"))).status).toBe(403);
    auth.mockResolvedValue({ userId: null });
    expect((await DELETE(request("DELETE", { id: "token-1" }))).status).toBe(401);
    expect(revokeTokens).not.toHaveBeenCalled();
  });

  it("blocks cross-origin full-access creation", async () => {
    expect((await POST(request("POST", { name: "Cursor", access: "write" }, "https://evil.test"))).status).toBe(403);
    expect(createToken).not.toHaveBeenCalled();
  });
});
