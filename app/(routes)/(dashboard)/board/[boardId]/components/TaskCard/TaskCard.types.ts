import type { ListModel } from "@/lib/generated/prisma/models/List";
import type { TaskModel } from "@/lib/generated/prisma/models/Task";
import type { LabelModel } from "@/lib/generated/prisma/models/Label";
import type { UserModel } from "@/lib/generated/prisma/models/User";

export type TaskAssignee = { user: Pick<UserModel, "id" | "name" | "email"> };
export type BoardUser = Pick<UserModel, "id" | "name" | "email">;

export type TaskWithLabels = TaskModel & {
  labels: { label: LabelModel }[];
  assignees: TaskAssignee[];
  priority?: string | null;
  _count?: {
    comments: number;
    attachments: number;
  };
  subtasks?: { completed: boolean }[];
};

export type ListWithTasks = ListModel & { tasks: TaskWithLabels[] };

export type TaskCardProps = {
  task: TaskWithLabels;
  listId: string;
  listTitle: string;
  boardId: string;
  isOwner: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
};
