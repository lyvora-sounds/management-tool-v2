import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { MyTasksView } from "./components/MyTasksView";

export default async function MyTasksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  // Get all boards user has access to (owned or member) with their lists
  const boards = await db.board.findMany({
    where: {
      OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
    },
    select: {
      id: true,
      title: true,
      color: true,
      list: {
        select: { id: true, title: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const boardIds = boards.map((b) => b.id);

  // Fetch tasks where user is assignee, collaborator, or QA
  const tasks = await db.task.findMany({
    where: {
      OR: [
        { assigneeId: user.id },
        { collaborators: { some: { userId: user.id } } },
        { qaId: user.id },
      ],
      archived: false,
      list: { boardId: { in: boardIds } },
    },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      list: {
        include: {
          board: { select: { id: true, title: true, color: true } },
        },
      },
      labels: { include: { label: true } },
      subtasks: { select: { id: true, title: true, completed: true } },
      assignee: { select: { id: true, name: true, email: true } },
      qa: { select: { id: true, name: true, email: true } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      epic: { select: { id: true, title: true, color: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <MyTasksView
        initialTasks={tasks}
        userId={user.id}
        boards={boards}
      />
    </div>
  );
}
