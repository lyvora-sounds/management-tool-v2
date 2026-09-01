import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { Suspense } from "react";
import { BoardContent } from "./components/BoardContent/BoardContent";
import { BoardHeader } from "./components/BoardHeader/BoardHeader";
import { BoardVisitTracker } from "./components/BoardVisitTracker/BoardVisitTracker";
import { normalizeRole } from "@/lib/boardRoles";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const board = await db.board.findFirst({
    where: {
      id: boardId,
      OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      list: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              labels: { include: { label: true } },
              assignee: { select: { id: true, name: true, email: true } },
              qa: { select: { id: true, name: true, email: true } },
              collaborators: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
              subtasks: { select: { completed: true } },
              epic: { select: { id: true, title: true, color: true } },
              customValues: { include: { customField: true } },
              _count: { select: { comments: true, attachments: true } },
            },
          },
        },
      },
    },
  });

  if (!board) redirect("/dashboard");

  const isOwner = board.userId === user.id;

  // Quien gestiona el tablero. Sale de los miembros que ya trae la consulta, no
  // de otra llamada a getBoardRole: el rol viene con ellos.
  const membership = board.members.find((m) => m.userId === user.id);
  const canManage = isOwner || normalizeRole(membership?.role) === "admin";

  // Owner + members as assignable users (deduped by id)
  const ownerUser = { id: board.user.id, name: board.user.name, email: board.user.email };
  const memberUsers = board.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));
  const seen = new Set([ownerUser.id]);
  const boardUsers = [
    ownerUser,
    ...memberUsers.filter((m) => !seen.has(m.id) && seen.add(m.id)),
  ];

  const initialLinks = Array.isArray(board.links) ? (board.links as { id: string; label: string; url: string }[]) : [];

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4 sm:gap-6 min-w-0">
      <BoardVisitTracker boardId={board.id} />
      <BoardHeader boardId={board.id} title={board.title} isOwner={isOwner} canManage={canManage} initialLinks={initialLinks} memberCanAssign={board.memberCanAssign} />
      <Suspense fallback={null}>
        <BoardContent
          lists={board.list}
          boardId={board.id}
          canManage={canManage}
          boardUsers={boardUsers}
          memberCanAssign={board.memberCanAssign}
        />
      </Suspense>
    </div>
  );
}
