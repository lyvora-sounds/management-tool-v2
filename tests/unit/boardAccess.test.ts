import { describe, it, expect, beforeEach, vi } from "vitest";

// lib/db.ts construye un PrismaClient real al importarse, así que lo
// sustituimos antes de que boardAccess lo cargue. vi.mock se iza al principio.
const findFirstUser = vi.fn();
const findFirstBoard = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    user: { findFirst: (...a: unknown[]) => findFirstUser(...a) },
    board: { findFirst: (...a: unknown[]) => findFirstBoard(...a) },
  },
}));

const { hasBoardAccess, isBoardOwner, canAccessBoard } = await import(
  "@/lib/boardAccess"
);

beforeEach(() => {
  findFirstUser.mockReset();
  findFirstBoard.mockReset();
});

describe("hasBoardAccess", () => {
  it("deniega el acceso si el usuario no existe", async () => {
    findFirstUser.mockResolvedValue(null);
    expect(await hasBoardAccess("desconocido", "board-1")).toBe(false);
    // No debe llegar a consultar el board si no hay usuario.
    expect(findFirstBoard).not.toHaveBeenCalled();
  });

  it("concede el acceso si el board aparece para ese usuario", async () => {
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue({ id: "board-1" });
    expect(await hasBoardAccess("user-db-1", "board-1")).toBe(true);
  });

  it("deniega el acceso si el board no aparece para ese usuario", async () => {
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue(null);
    expect(await hasBoardAccess("user-db-1", "board-ajeno")).toBe(false);
  });

  it("acepta tanto el id de base como el clerkId", async () => {
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue({ id: "board-1" });

    await hasBoardAccess("user_clerk_abc", "board-1");

    const where = findFirstUser.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { id: "user_clerk_abc" },
      { clerkId: "user_clerk_abc" },
    ]);
  });

  it("filtra por propietario O miembro, nunca por board suelto", async () => {
    // Es la comprobación de seguridad: si esta consulta perdiera el filtro de
    // usuario, cualquiera podría abrir cualquier board.
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue({ id: "board-1" });

    await hasBoardAccess("user-db-1", "board-1");

    const where = findFirstBoard.mock.calls[0][0].where;
    expect(where.id).toBe("board-1");
    expect(where.OR).toEqual([
      { userId: "user-db-1" },
      { members: { some: { userId: "user-db-1" } } },
    ]);
  });

  it("canAccessBoard es el mismo comprobante que hasBoardAccess", () => {
    expect(canAccessBoard).toBe(hasBoardAccess);
  });
});

describe("isBoardOwner", () => {
  it("deniega si el usuario no existe", async () => {
    findFirstUser.mockResolvedValue(null);
    expect(await isBoardOwner("desconocido", "board-1")).toBe(false);
    expect(findFirstBoard).not.toHaveBeenCalled();
  });

  it("solo mira propiedad, sin aceptar pertenencia como miembro", async () => {
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue({ id: "board-1" });

    expect(await isBoardOwner("user-db-1", "board-1")).toBe(true);

    const where = findFirstBoard.mock.calls[0][0].where;
    expect(where).toEqual({ id: "board-1", userId: "user-db-1" });
    // Un miembro no propietario no debe colarse por aquí.
    expect(where.OR).toBeUndefined();
  });

  it("deniega si el board no es de ese usuario", async () => {
    findFirstUser.mockResolvedValue({ id: "user-db-1" });
    findFirstBoard.mockResolvedValue(null);
    expect(await isBoardOwner("user-db-1", "board-ajeno")).toBe(false);
  });
});
