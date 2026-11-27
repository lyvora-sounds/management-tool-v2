import type { LabelModel } from "@/lib/modelTypes";
import type { BoardQuarterDto } from "@/lib/boardQuarters";
import type { BoardUser, TaskWithLabels } from "../TaskCard/TaskCard.types";

export type TaskModalProps = {
  task: TaskWithLabels;
  listId: string;
  listTitle: string;
  boardId: string;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
  boardQuarters?: BoardQuarterDto[];
};

export type LabelWithActive = LabelModel & { active: boolean };
