import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveBoardRole, type BoardAccessSnapshot } from "@/lib/boardAccess";

const findFirstUser = vi.fn();
const findUniqueBoard = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    user: { findFirst: (...args: unknown[]) => findFirstUser(...args) },
    board: { findUnique: (...args: unknown[]) => findUniqueBoard(...args) },
  },
}));

const {
  canReadBoard,
  canEditBoard,
  getBoardRole,
  readableBoardWhere,
} = await import("@/lib/boardAccess");

function snapshot(overrides: Partial<BoardAccessSnapshot> = {}): BoardAccessSnapshot {
  return {
    ownerId: "owner",
    accessMode: "organization",
    defaultRole: "member",
    directRole: null,
    organizationRole: null,
    teamRoles: [],
    ...overrides,
  };
}

describe("resolveBoardRole", () => {
  it("opens an organization board to ordinary members at the default role", () => {
    const role = resolveBoardRole("user-1", snapshot({ organizationRole: "member" }));
    expect(role).toBe("member");
  });

  it("can make that organization-wide access read-only", () => {
    const role = resolveBoardRole("user-1", snapshot({
      organizationRole: "member",
      defaultRole: "viewer",
    }));
    expect(role).toBe("viewer");
  });

  it("does not turn an invalid default role into edit access", () => {
    expect(resolveBoardRole("user-1", snapshot({
      organizationRole: "member",
      defaultRole: "admin",
    }))).toBeNull();
  });

  it("keeps ordinary organization members out of restricted boards", () => {
    expect(resolveBoardRole("user-1", snapshot({
      accessMode: "restricted",
      organizationRole: "member",
    }))).toBeNull();
  });

  it("lets a team grant read access on a restricted board", () => {
    const role = resolveBoardRole("user-1", snapshot({
      accessMode: "restricted",
      organizationRole: "member",
      teamRoles: ["viewer"],
    }));
    expect(role).toBe("viewer");
  });

  it("ignores stale team membership after organization access is removed", () => {
    expect(resolveBoardRole("user-1", snapshot({
      accessMode: "restricted",
      organizationRole: null,
      teamRoles: ["admin"],
    }))).toBeNull();
  });

  it("lets a direct role raise access above the organization default", () => {
    expect(resolveBoardRole("user-1", snapshot({
      organizationRole: "member",
      defaultRole: "viewer",
      directRole: "member",
    }))).toBe("member");
  });

  it("gives organization admins admin access on restricted boards", () => {
    expect(resolveBoardRole("user-1", snapshot({
      accessMode: "restricted",
      organizationRole: "admin",
    }))).toBe("admin");
  });

  it("keeps the board owner as owner", () => {
    expect(resolveBoardRole("owner", snapshot({ organizationRole: "admin" }))).toBe("owner");
  });
});

function board(overrides: Record<string, unknown> = {}) {
  return {
    userId: "owner",
    accessMode: "organization",
    defaultRole: "member",
    members: [],
    organization: { members: [] },
    teamAccess: [],
    ...overrides,
  };
}

beforeEach(() => {
  findFirstUser.mockReset();
  findUniqueBoard.mockReset();
  findFirstUser.mockResolvedValue({ id: "user-1" });
});

describe("organization-aware board access", () => {
  it("grants organization members the board default role", async () => {
    findUniqueBoard.mockResolvedValue(board({ organization: { members: [{ role: "member" }] } }));
    await expect(getBoardRole("user-1", "board-1")).resolves.toBe("member");
    await expect(canEditBoard("user-1", "board-1")).resolves.toBe(true);
    await expect(canReadBoard("user-1", "board-1")).resolves.toBe(true);
  });

  it("allows a team to grant read-only access without edit access", async () => {
    findUniqueBoard.mockResolvedValue(board({
      accessMode: "restricted",
      organization: { members: [{ role: "member" }] },
      teamAccess: [{ role: "viewer" }],
    }));
    await expect(canReadBoard("user-1", "board-1")).resolves.toBe(true);
    await expect(canEditBoard("user-1", "board-1")).resolves.toBe(false);
  });

  it("builds a read filter for owner, direct, organization, team, and organization managers", () => {
    const filter = readableBoardWhere("user-1");
    expect(filter.OR).toContainEqual({ userId: "user-1" });
    expect(filter.OR).toContainEqual({ members: { some: { userId: "user-1" } } });
    expect(filter.OR).toContainEqual({
      accessMode: "organization",
      defaultRole: { in: ["viewer", "member"] },
      organization: { members: { some: { userId: "user-1" } } },
    });
    expect(filter.OR).toContainEqual({
      organization: { members: { some: { userId: "user-1", role: { in: ["owner", "admin"] } } } },
    });
    expect(filter.OR).toContainEqual({
      AND: [
        { organization: { members: { some: { userId: "user-1" } } } },
        { teamAccess: { some: { team: { members: { some: { userId: "user-1" } } } } } },
      ],
    });
  });
});
