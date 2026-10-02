import { BoardUser, ListWithTasks } from "../TaskCard/TaskCard.types";

export type BoardContentProps = {
  lists: ListWithTasks[];
  boardId: string;
  canManage: boolean;
  canEdit: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
