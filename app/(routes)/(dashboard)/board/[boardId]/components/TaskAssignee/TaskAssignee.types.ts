import type { BoardUser } from "../TaskCard/TaskCard.types";

export type Props = {
  taskId: string;
  boardUsers: BoardUser[];
  assignee: BoardUser | null | undefined;
  canManage: boolean;
  memberCanAssign: boolean;
  onAssigneeChange: (assignee: BoardUser | null) => void;
};
