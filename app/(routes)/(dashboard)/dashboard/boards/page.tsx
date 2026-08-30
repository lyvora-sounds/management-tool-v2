import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { CreateBoardModal } from "../components/boards/CreateBoardModal/CreateBoardModal";
import { getTranslations } from "next-intl/server";
import { BoardList } from "../components/boards/BoardList/BoardList";

export default async function BoardsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

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

  const boards = rawBoards.map((b) => {
    const totalTasks = b.list.reduce((acc, l) => acc + l._count.tasks, 0);
    const completedTasks = b.list.reduce(
      (acc, l) => acc + l.tasks.filter((t) => t.completed).length,
      0,
    );
    return {
      id: b.id,
      title: b.title,
      color: b.color,
      updatedAt: b.updatedAt,
      isOwner: b.userId === user.id,
      totalTasks,
      completedTasks,
      totalLists: b.list.length,
    };
  });

  const t = await getTranslations("boards");

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("totalCount", { count: boards.length })}
          </p>
        </div>
        <CreateBoardModal />
      </div>
      <BoardList boards={boards} />
    </div>
  );
}
