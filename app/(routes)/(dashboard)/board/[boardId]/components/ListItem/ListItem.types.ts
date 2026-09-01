import type { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type ListItemProps = {
  list: ListWithTasks;
  boardId: string;
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
