/**
 * The shape of the rows kiki-api sends for a board, a ticket, a label, a list and a person, as the screens use them.
 * They used to be the Prisma models; the database is kiki-api's now, so they are written out here. Relations are
 * not part of them: a screen that needs one extends the type.
 */
type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type UserModel = {
  id: string;
  isAgent: boolean;
  clerkId: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BoardModel = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  links: JsonValue | null;
  memberCanAssign: boolean;
  kikiMode: string;
  kikiTriage: boolean;
  accessMode: string;
  defaultRole: string;
  slackWebhookUrl: string | null;
  discordWebhookUrl: string | null;
  notifyOnTaskCreated: boolean;
  notifyOnTaskCompleted: boolean;
  notifyOnTaskMoved: boolean;
  key: string;
  nextTicketNumber: number;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListModel = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LabelModel = {
  id: string;
  title: string;
  color: string;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskModel = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: Date | null;
  completedById: string | null;
  priority: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  archived: boolean;
  archivedAt: Date | null;
  quarter: string | null;
  epicId: string | null;
  shareToken: string | null;
  googleEventId: string | null;
  order: number;
  listId: string;
  assigneeId: string | null;
  qaId: string | null;
  reporterId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
