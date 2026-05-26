import type { LabelModel } from "@/lib/generated/prisma/models/Label";
import type { BoardUser, TaskWithLabels } from "../TaskCard/TaskCard.types";

export type TaskModalProps = {
  task: TaskWithLabels;
  listId: string;
  listTitle: string;
  boardId: string;
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
};

export type LabelWithActive = LabelModel & { active: boolean };
