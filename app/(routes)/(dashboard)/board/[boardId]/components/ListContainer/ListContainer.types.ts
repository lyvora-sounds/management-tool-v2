import { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type ListContainerProps = {
  lists: ListWithTasks[];
  boardId: string;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
