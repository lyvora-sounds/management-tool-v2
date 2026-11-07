import type { BoardUser } from "../TaskCard/TaskCard.types";

export type Props = {
  taskId: string;
  boardUsers: BoardUser[];
  reporter: BoardUser | null | undefined;
  canManage: boolean;
  memberCanAssign: boolean;
  onReporterChange: (reporter: BoardUser | null) => void;
};
