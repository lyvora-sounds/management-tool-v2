import { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type ListContainerProps = {
  lists: ListWithTasks[];
  boardId: string;
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
