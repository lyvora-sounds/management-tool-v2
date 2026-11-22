import { redirect } from "next/navigation";
import { ACCESS_DENIED_HREF } from "@/lib/ticketShare";
import { apiServerGet } from "@/lib/apiServer";
import type { ApiBoardPeople } from "@/lib/api/types";
import { BoardObservability } from "../components/BoardObservability/BoardObservability";

interface BoardObservabilityPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardObservabilityPage({ params }: BoardObservabilityPageProps) {
  const { boardId } = await params;
  const read = await apiServerGet<ApiBoardPeople>(`/v1/boards/${encodeURIComponent(boardId)}/members`);
  if (!read.ok) redirect(read.status === 401 ? "/sign-in" : ACCESS_DENIED_HREF);

  // The owner first, then the members, each person once.
  const { owner, members } = read.data;
  const seen = new Set([owner.id]);
  const boardUsers = [
    { id: owner.id, name: owner.name, email: owner.email },
    ...members.flatMap((m) => (seen.has(m.userId) ? [] : (seen.add(m.userId), [{ id: m.userId, name: m.user.name, email: m.user.email }]))),
  ];

  return (
    <div className="flex flex-col h-full p-3 sm:p-6 gap-4 sm:gap-6 min-w-0">
      <BoardObservability boardId={boardId} boardUsers={boardUsers} />
    </div>
  );
}
