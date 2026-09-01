import type {
  ListWithTasks,
  TaskWithLabels,
  BoardUser,
} from "../TaskCard/TaskCard.types";

export interface BoardListViewProps {
  lists: ListWithTasks[];
  boardId: string;
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}

export interface TaskRowProps {
  task: TaskWithLabels;
  listId: string;
  listTitle: string;
  boardId: string;
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
}
