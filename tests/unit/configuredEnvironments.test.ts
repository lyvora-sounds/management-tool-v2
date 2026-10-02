import { beforeEach, describe, expect, it, vi } from "vitest";

const createMany = vi.fn();
const findUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    customField: {
      createMany: (...args: unknown[]) => createMany(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

const { configuredEnvironments } = await import("@/lib/externalAccess");

beforeEach(() => {
  createMany.mockReset();
  findUnique.mockReset();
});

describe("configuredEnvironments", () => {
  it("ensures default fields before reading environment options", async () => {
    const calls: string[] = [];
    createMany.mockImplementation(async () => {
      calls.push("create");
    });
    findUnique.mockImplementation(async () => {
      calls.push("read");
      return { options: ["dev", 1, "uat"] };
    });

    await expect(configuredEnvironments("board-1")).resolves.toEqual(["dev", "uat"]);
    expect(calls).toEqual(["create", "read"]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { boardId_defaultKey: { boardId: "board-1", defaultKey: "environment" } },
      select: { options: true },
    });
  });
});
