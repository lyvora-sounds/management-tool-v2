import type { ApiBoardLink as BoardLink } from "@/lib/api/types";

export type BoardHeaderProps = {
  boardId: string;
  title: string;
  /** Propiedad real: borrar el tablero y editar sus enlaces. */
  isOwner: boolean;
  /** Propietario o administrador: gestionar permisos del tablero. */
  canManage: boolean;
  canEdit: boolean;
  initialLinks: BoardLink[];
  memberCanAssign: boolean;
};
