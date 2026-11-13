import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";
import { ACCESS_DENIED_HREF } from "@/lib/ticketShare";
import { BoardObservability } from "../components/BoardObservability/BoardObservability";

interface BoardObservabilityPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardObservabilityPage({ params }: BoardObservabilityPageProps) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const board = await db.board.findFirst({
    where: { id: boardId, ...readableBoardWhere(user.id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!board) redirect(ACCESS_DENIED_HREF);

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

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4 sm:gap-6 min-w-0">
      <BoardObservability boardId={board.id} boardUsers={boardUsers} />
    </div>
  );
}
