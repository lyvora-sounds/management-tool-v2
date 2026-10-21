import db from "@/lib/db";

/**
 * Personas que pueden participar en un tablero: propietario, miembros directos y miembros de la
 * organización. Sin el usuario de sistema de Kiki. Es una lista de candidatos (para mencionar o
 * sugerir responsables); el permiso real lo siguen decidiendo las comprobaciones de acceso.
 */
export async function getBoardUsers(board: { id: string; userId: string; organizationId: string }) {
  const [boardMembers, orgMembers] = await Promise.all([
    db.boardMember.findMany({ where: { boardId: board.id }, select: { userId: true } }),
    db.organizationMember.findMany({ where: { organizationId: board.organizationId }, select: { userId: true } }),
  ]);
  const ids = [...new Set([board.userId, ...boardMembers.map((m) => m.userId), ...orgMembers.map((m) => m.userId)])];
  return db.user.findMany({ where: { id: { in: ids }, isAgent: false }, select: { id: true, name: true, email: true } });
}
