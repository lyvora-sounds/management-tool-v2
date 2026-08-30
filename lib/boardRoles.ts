/**
 * Roles de un board.
 *
 * - owner:  el creador (Board.userId). Hay exactamente uno y no tiene fila en
 *           BoardMember. Es el único que puede borrar el board.
 * - admin:  gestiona miembros, invitaciones, integraciones, campos
 *           personalizados y ajustes. Todo menos borrar el board.
 * - member: trabaja con las tareas. La asignación de personas sigue
 *           dependiendo del interruptor `memberCanAssign` del board.
 */
export const BOARD_ROLES = ["owner", "admin", "member"] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

/** Roles que se pueden guardar en BoardMember.role (owner vive en el board). */
export const ASSIGNABLE_ROLES = ["admin", "member"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return (
    typeof value === "string" &&
    (ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}

/**
 * `BoardMember.role` es un String libre en el schema y arrastra filas creadas
 * antes de que los roles significaran nada. Cualquier valor que no reconozcamos
 * se trata como el rol menos privilegiado.
 */
export function normalizeRole(value: string | null | undefined): AssignableRole {
  return value === "admin" ? "admin" : "member";
}

export function canManageBoard(role: BoardRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteBoard(role: BoardRole | null): boolean {
  return role === "owner";
}

export const ROLE_LABELS: Record<BoardRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  member: "Miembro",
};
