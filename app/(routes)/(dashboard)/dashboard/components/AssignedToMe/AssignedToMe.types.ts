export interface BoardListSummary {
  id: string;
  title: string;
  order: number;
}

export interface AssignedTask {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: Date | string | null;
  quarter?: string | null;
  assigneeId?: string | null;
  qaId?: string | null;
  collaborators?: { userId: string }[];
  epic?: { id: string; title: string; color: string } | null;
  _count?: { comments: number; attachments: number };
  subtasks?: { id: string; completed: boolean }[];
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
      list?: BoardListSummary[];
    };
  };
}

export interface AssignedToMeProps {
  tasks: AssignedTask[];
  userId: string;
}

