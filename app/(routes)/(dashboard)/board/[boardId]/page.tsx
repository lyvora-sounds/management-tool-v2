import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BoardContent } from "./components/BoardContent/BoardContent";
import { BoardHeader } from "./components/BoardHeader/BoardHeader";
import { BoardVisitTracker } from "./components/BoardVisitTracker/BoardVisitTracker";
import { BoardTour } from "./components/BoardTour/BoardTour";
import { ACCESS_DENIED_HREF } from "@/lib/ticketShare";
import { apiServerGet } from "@/lib/apiServer";
import { listsFromApi } from "@/lib/api/boardView";
import type { ApiBoardView } from "@/lib/api/types";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const read = await apiServerGet<ApiBoardView>(`/v1/boards/${encodeURIComponent(boardId)}/view`, { dates: "keep" });
  if (!read.ok) redirect(read.status === 401 ? "/sign-in" : ACCESS_DENIED_HREF);

  const view = read.data;
  const { board, canManage, canEdit, isOwner } = view;

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4 sm:gap-6 min-w-0">
      <BoardVisitTracker boardId={board.id} />
      <BoardTour tourSeen={view.tourSeen} />
      <BoardHeader boardId={board.id} title={board.title} isOwner={isOwner} canManage={canManage} canEdit={canEdit} initialLinks={board.links ?? []} memberCanAssign={board.memberCanAssign} boardKey={board.key} keyLocked={board.nextTicketNumber > 1} />
      <Suspense fallback={null}>
        <BoardContent
          lists={listsFromApi(view)}
          boardId={board.id}
          canManage={canManage}
          canEdit={canEdit}
          boardUsers={view.people}
          memberCanAssign={canEdit && board.memberCanAssign}
        />
      </Suspense>
    </div>
  );
}
