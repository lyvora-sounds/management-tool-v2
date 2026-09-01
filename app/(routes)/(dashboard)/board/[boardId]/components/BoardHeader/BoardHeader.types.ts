import type { BoardLink } from "@/app/api/boards/[boardId]/links/route";

export type BoardHeaderProps = {
  boardId: string;
  title: string;
  /** Propiedad real: borrar el tablero y editar sus enlaces. */
  isOwner: boolean;
  /** Propietario o administrador: gestionar permisos del tablero. */
  canManage: boolean;
  initialLinks: BoardLink[];
  memberCanAssign: boolean;
};
