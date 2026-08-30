import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizeRole,
  isAssignableRole,
  canManageBoard,
  canDeleteBoard,
} from "@/lib/boardRoles";

describe("normalizeRole", () => {
  it("reconoce admin", () => {
    expect(normalizeRole("admin")).toBe("admin");
  });

  it("trata cualquier otro valor como member", () => {
    // BoardMember.role es un String libre y arrastra filas creadas cuando el
    // rol no significaba nada: lo desconocido cae al mínimo privilegio.
    expect(normalizeRole("member")).toBe("member");
    expect(normalizeRole("owner")).toBe("member");
    expect(normalizeRole("ADMIN")).toBe("member");
    expect(normalizeRole("")).toBe("member");
    expect(normalizeRole(null)).toBe("member");
    expect(normalizeRole(undefined)).toBe("member");
  });
});

describe("isAssignableRole", () => {
  it("solo admite los roles que viven en BoardMember", () => {
    expect(isAssignableRole("admin")).toBe(true);
    expect(isAssignableRole("member")).toBe(true);
    // owner no es asignable: vive en Board.userId, no en BoardMember.
    expect(isAssignableRole("owner")).toBe(false);
    expect(isAssignableRole("viewer")).toBe(false);
    expect(isAssignableRole(1)).toBe(false);
    expect(isAssignableRole(null)).toBe(false);
  });
});

describe("capacidades por rol", () => {
  it("gestionan el board el propietario y los administradores", () => {
    expect(canManageBoard("owner")).toBe(true);
    expect(canManageBoard("admin")).toBe(true);
    expect(canManageBoard("member")).toBe(false);
    expect(canManageBoard(null)).toBe(false);
  });

  it("solo el propietario puede borrar el board", () => {
    expect(canDeleteBoard("owner")).toBe(true);
    expect(canDeleteBoard("admin")).toBe(false);
    expect(canDeleteBoard("member")).toBe(false);
    expect(canDeleteBoard(null)).toBe(false);
  });
});

// getBoardRole toca la base, así que se mockea el cliente como en boardAccess.
const findFirstUser = vi.fn();
const findUniqueBoard = vi.fn();

vi.mock("@/lib/db", () => ({
  default: {
    user: { findFirst: (...a: unknown[]) => findFirstUser(...a) },
    board: { findUnique: (...a: unknown[]) => findUniqueBoard(...a) },
  },
}));

const { getBoardRole, isBoardAdmin } = await import("@/lib/boardAccess");

beforeEach(() => {
  findFirstUser.mockReset();
  findUniqueBoard.mockReset();
  findFirstUser.mockResolvedValue({ id: "u1" });
});

describe("getBoardRole", () => {
  it("devuelve owner cuando el board es suyo", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "u1", members: [] });
    expect(await getBoardRole("u1", "b1")).toBe("owner");
  });

  it("devuelve admin cuando su membresía lo dice", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [{ role: "admin" }] });
    expect(await getBoardRole("u1", "b1")).toBe("admin");
  });

  it("devuelve member para una membresía normal", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [{ role: "member" }] });
    expect(await getBoardRole("u1", "b1")).toBe("member");
  });

  it("degrada a member un rol no reconocido", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [{ role: "superadmin" }] });
    expect(await getBoardRole("u1", "b1")).toBe("member");
  });

  it("devuelve null si no es miembro ni propietario", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [] });
    expect(await getBoardRole("u1", "b1")).toBeNull();
  });

  it("devuelve null si el usuario no existe", async () => {
    findFirstUser.mockResolvedValue(null);
    expect(await getBoardRole("fantasma", "b1")).toBeNull();
    expect(findUniqueBoard).not.toHaveBeenCalled();
  });

  it("devuelve null si el board no existe", async () => {
    findUniqueBoard.mockResolvedValue(null);
    expect(await getBoardRole("u1", "inexistente")).toBeNull();
  });
});

describe("isBoardAdmin", () => {
  it("es cierto para propietario y administrador, falso para miembro", async () => {
    findUniqueBoard.mockResolvedValue({ userId: "u1", members: [] });
    expect(await isBoardAdmin("u1", "b1")).toBe(true);

    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [{ role: "admin" }] });
    expect(await isBoardAdmin("u1", "b1")).toBe(true);

    findUniqueBoard.mockResolvedValue({ userId: "otro", members: [{ role: "member" }] });
    expect(await isBoardAdmin("u1", "b1")).toBe(false);
  });
});
