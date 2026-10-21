import { auth } from "@clerk/nextjs/server";
import { NextResponse, after } from "next/server";
import db from "@/lib/db";
import { canEditBoard, canReadBoard } from "@/lib/boardAccess";
import { encodeLogMessage } from "@/lib/activityMessages";
import { hasKikiMention, runKiki } from "@/lib/agent/kiki";
import { getBoardUsers } from "@/lib/boardUsers";
import { findMentionedUserIds } from "@/lib/mentions";

// Kiki responde después de contestar al usuario (after), así que necesita margen para llamar al modelo.
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canReadBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await db.comment.findMany({
    where: { taskId },
    include: { user: { select: { name: true, email: true, isAgent: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Para pintar «Deshacer» solo donde aún se puede: el cambio de Kiki existe y no se ha revertido.
  const changeIds = comments.flatMap((c) => (c.agentChangeId ? [c.agentChangeId] : []));
  const changes = changeIds.length
    ? await db.mcpChange.findMany({ where: { id: { in: changeIds } }, select: { id: true, revertedAt: true } })
    : [];
  const reverted = new Map(changes.map((c) => [c.id, c.revertedAt !== null]));

  return NextResponse.json(
    comments.map(({ agentChangeId, agentSuggestion, ...c }) => ({
      ...c,
      suggestion: agentSuggestion && typeof agentSuggestion === "object" && !Array.isArray(agentSuggestion) ? { pending: (agentSuggestion as { applied?: boolean }).applied !== true } : null,
      change: agentChangeId ? { id: agentChangeId, reverted: reverted.get(agentChangeId) ?? true } : null,
    })),
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { list: { include: { board: true } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canEditBoard(user.id, task.list.board.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const taskWithMembers = await db.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      qaId: true,
      collaborators: { select: { userId: true } },
    },
  });

  const notifyUserIds = new Set<string>();
  if (taskWithMembers?.assigneeId && taskWithMembers.assigneeId !== user.id) {
    notifyUserIds.add(taskWithMembers.assigneeId);
  }
  if (taskWithMembers?.qaId && taskWithMembers.qaId !== user.id) {
    notifyUserIds.add(taskWithMembers.qaId);
  }
  taskWithMembers?.collaborators.forEach((c) => {
    if (c.userId !== user.id) notifyUserIds.add(c.userId);
  });

  const actorName = user.name ?? user.email;

  // «@Nombre» avisa a esa persona aunque no esté en la tarjeta; el aviso de mención sustituye al de comentario.
  const boardUsers = await getBoardUsers(task.list.board);
  const mentioned = new Set(findMentionedUserIds(content, boardUsers).filter((id) => id !== user.id));
  mentioned.forEach((id) => notifyUserIds.add(id));
  const notifyList = Array.from(notifyUserIds);

  const [comment] = await db.$transaction([
    db.comment.create({
      data: { content: content.trim(), taskId, userId: user.id },
      include: { user: { select: { name: true, email: true, isAgent: true } } },
    }),
    ...(notifyList.length > 0
      ? [
          db.notification.createMany({
            data: notifyList.map((notifyUserId) => ({
              type: "comment",
              message: encodeLogMessage(mentioned.has(notifyUserId) ? "notifications.mentioned" : "notifications.commented", {
                actor: actorName,
                ticket: task.title,
              }),
              userId: notifyUserId,
              boardId: task.list.board.id,
              taskId,
            })),
          }),
        ]
      : []),
  ]);

  if (task.list.board.kikiMode !== "off" && hasKikiMention(comment.content)) {
    after(() => runKiki({ taskId, invokerId: user.id }).catch((error) => console.error("[kiki]", error)));
  }

  return NextResponse.json({ ...comment, change: null, suggestion: null }, { status: 201 });
}
