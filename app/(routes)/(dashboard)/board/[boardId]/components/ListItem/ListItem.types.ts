import type { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type ListItemProps = {
  list: ListWithTasks;
  boardId: string;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
