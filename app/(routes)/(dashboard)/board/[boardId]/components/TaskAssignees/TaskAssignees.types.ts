import { BoardUser, TaskAssignee } from "../TaskCard/TaskCard.types";

export type Props = {
  taskId: string;
  boardUsers: BoardUser[];
  activeAssignees: TaskAssignee[];
  isOwner: boolean;
  memberCanAssign: boolean;
  onAssigneesChange: (assignees: TaskAssignee[]) => void;
};
