import type { BoardUser } from "../TaskCard/TaskCard.types";

export type Props = {
  taskId: string;
  boardUsers: BoardUser[];
  qa: BoardUser | null | undefined;
  canManage: boolean;
  memberCanAssign: boolean;
  onQaChange: (qa: BoardUser | null) => void;
};
