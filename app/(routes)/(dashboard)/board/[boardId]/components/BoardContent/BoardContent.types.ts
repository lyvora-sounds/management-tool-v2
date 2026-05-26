import { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type BoardContentProps = {
  lists: ListWithTasks[];
  boardId: string;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
