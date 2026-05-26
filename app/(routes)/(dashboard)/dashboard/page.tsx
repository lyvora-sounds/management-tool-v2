import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { CreateBoardModal } from "./components/boards/CreateBoardModal/CreateBoardModal";
import { BoardList } from "./components/boards/BoardList/BoardList";
import { DashboardStats } from "./components/DashboardStats/DashboardStats";
import { UpcomingTasks } from "./components/UpcomingTasks/UpcomingTasks";
import { RecentActivity } from "./components/RecentActivity/RecentActivity";
import { AssignedToMe } from "./components/AssignedToMe/AssignedToMe";
import { RecentBoards } from "./components/RecentBoards/RecentBoards";
import { GlobalProgress } from "./components/GlobalProgress/GlobalProgress";
import { WeeklyActivity } from "./components/WeeklyActivity/WeeklyActivity";
import { Greeting } from "./components/Greeting/Greeting";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getOrCreateUser(userId);
  if (!user) {
    // Clerk API failed but user IS authenticated — avoid redirect loop, show retry
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-sm font-medium">Servicio temporalmente no disponible</p>
        <p className="text-xs text-muted-foreground">Recarga la página en unos segundos.</p>
        <a href="/dashboard" className="text-xs underline text-muted-foreground hover:text-foreground">
          Reintentar
        </a>
      </div>
    );
  }

  const rawBoards = await db.board.findMany({
    where: {
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      color: true,
      updatedAt: true,
      userId: true,
      list: {
        select: {
          _count: { select: { tasks: true } },
          tasks: { select: { completed: true } },
        },
      },
    },
  });

  const boards = rawBoards.map((b) => ({
    id: b.id,
    title: b.title,
    color: b.color,
    updatedAt: b.updatedAt,
    isOwner: b.userId === user.id,
    totalTasks: b.list.reduce((acc, l) => acc + l._count.tasks, 0),
    completedTasks: b.list.reduce((acc, l) => acc + l.tasks.filter((t) => t.completed).length, 0),
    totalLists: b.list.length,
  }));

  const boardIds = boards.map((b) => b.id);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);
  in7Days.setHours(23, 59, 59, 999);

  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);

  const [totalTasks, totalPending, overdue, completedThisWeek, upcomingTasks, recentActivity, assignedTasks, completedLast7] = await Promise.all([
    db.task.count({
      where: { list: { boardId: { in: boardIds } } },
    }),
    db.task.count({
      where: {
        completed: false,
        list: { boardId: { in: boardIds } },
      },
    }),
    db.task.count({
      where: {
        completed: false,
        dueDate: { lt: now },
        list: { boardId: { in: boardIds } },
      },
    }),
    db.task.count({
      where: {
        completed: true,
        updatedAt: { gte: startOfWeek },
        list: { boardId: { in: boardIds } },
      },
    }),
    db.task.findMany({
      where: {
        completed: false,
        dueDate: { gte: now, lte: in7Days },
        list: { boardId: { in: boardIds } },
      },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        completed: true,
        dueDate: true,
        priority: true,
        list: {
          select: {
            title: true,
            board: { select: { id: true, title: true } },
          },
        },
      },
    }),
    db.activityLog.findMany({
      where: { boardId: { in: boardIds } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        board: { select: { id: true, title: true } },
        user: { select: { name: true } },
      },
    }),
    db.task.findMany({
      where: {
        assignees: { some: { userId: user.id } },
        list: { boardId: { in: boardIds } },
      },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      select: {
        id: true,
        title: true,
        completed: true,
        priority: true,
        dueDate: true,
        list: {
          select: {
            title: true,
            board: { select: { id: true, title: true } },
          },
        },
      },
    }),
    db.task.findMany({
      where: {
        completed: true,
        completedAt: { gte: last7Days },
        completedById: user.id,
      },
      select: { completedAt: true },
    }),
  ]);

  // Formatear fecha en zona local (YYYY-MM-DD) sin conversión UTC
  const toLocalKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Construir array de los últimos 7 días con conteo de completadas
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(last7Days);
    d.setDate(last7Days.getDate() + i);
    const key = toLocalKey(d);
    const count = completedLast7.filter((t) => t.completedAt && toLocalKey(t.completedAt) === key).length;
    return { date: key, count };
  });

  return (
    <div className="p-3 sm:p-6 flex flex-col gap-6">
      <Greeting name={user.name} />

      <DashboardStats
        totalPending={totalPending}
        overdue={overdue}
        completedThisWeek={completedThisWeek}
        totalBoards={boards.length}
      />

      <GlobalProgress
        totalTasks={totalTasks}
        completedTasks={totalTasks - totalPending}
        completedThisWeek={completedThisWeek}
      />

      <UpcomingTasks tasks={upcomingTasks} />

      <RecentActivity logs={recentActivity} />

      <WeeklyActivity days={weeklyDays} />

      <AssignedToMe tasks={assignedTasks} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Mis boards</h2>
          <CreateBoardModal />
        </div>
        <RecentBoards boards={boards} />
        {/* <div className="mt-4">
          <BoardList boards={boards} />
        </div> */}
      </div>
    </div>
  );
}
