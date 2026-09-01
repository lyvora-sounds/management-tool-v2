import type { BoardUser, TaskCollaborator } from "../TaskCard/TaskCard.types";

export type Props = {
  taskId: string;
  boardUsers: BoardUser[];
  collaborators: TaskCollaborator[];
  canManage: boolean;
  memberCanAssign: boolean;
  onCollaboratorsChange: (collaborators: TaskCollaborator[]) => void;
};
