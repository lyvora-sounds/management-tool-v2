import type { ListModel } from "@/lib/generated/prisma/models/List";
import type { TaskModel } from "@/lib/generated/prisma/models/Task";
import type { LabelModel } from "@/lib/generated/prisma/models/Label";
import type { UserModel } from "@/lib/generated/prisma/models/User";

export type BoardUser = Pick<UserModel, "id" | "name" | "email">;
export type TaskCollaborator = { user: BoardUser };
export type TaskAssignee = { user: BoardUser };

export type TaskCustomValue = {
  id: string;
  value: string | null;
  customField?: {
    name: string;
    enabled?: boolean;
    defaultKey?: string | null;
  } | null;
};

export type TaskWithLabels = TaskModel & {
  labels: { label: LabelModel }[];
  assignee?: BoardUser | null;
  qa?: BoardUser | null;
  collaborators: TaskCollaborator[];
  assignees?: TaskAssignee[];
  priority?: string | null;
  epic?: { id: string; title: string; color: string } | null;
  customValues?: TaskCustomValue[];
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
  canManage: boolean;
  boardUsers: BoardUser[];
  memberCanAssign: boolean;
};
