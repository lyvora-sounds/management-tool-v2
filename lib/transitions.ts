import type { Prisma } from "@/lib/generated/prisma/client";
import { isDoneList } from "@/lib/statusTheme";

export type TaskStateMoveInput = {
  taskId: string;
  boardId: string;
  fromListId: string | null;
  fromListTitle?: string | null;
  toListId: string;
  toListTitle: string;
  movedById?: string | null;
  assigneeIdAtMove?: string | null;
  completedAfterMove?: boolean;
  taskCreatedAt?: Date | null;
  transitionedAt?: Date;
};

/** Converts a nullable BigInt duration (ms) to a JSON-safe number. */
export function toDurationMs(durationMs: bigint | null | undefined): number | null {
  return durationMs == null ? null : Number(durationMs);
}

/** Parses a raw story_points CustomFieldValue string into a finite integer or null. */
export function parseStoryPoints(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Records an immutable workflow state transition inside an active Prisma transaction.
 * Computes dwell time (`durationMs`) from the most recent transition into `fromListId`
 * (or falls back to the ticket's `createdAt` timestamp on its first move) and captures
 * a point-in-time snapshot of `story_points`.
 */
export async function recordTaskStateTransition(
  tx: Prisma.TransactionClient,
  input: TaskStateMoveInput,
) {
  const {
    taskId,
    boardId,
    fromListId,
    toListId,
    toListTitle,
    movedById = null,
  } = input;

  if (fromListId !== null && fromListId === toListId) {
    return null;
  }

  const transitionedAt = input.transitionedAt ?? new Date();

  let durationMs: bigint | null = null;
  let assigneeIdAtMove = input.assigneeIdAtMove ?? null;
  let fromListTitle = input.fromListTitle ?? null;

  if (fromListId !== null) {
    const prior = await tx.taskStateTransition.findFirst({
      where: { taskId, toListId: fromListId },
      orderBy: { transitionedAt: "desc" },
      select: { transitionedAt: true, toListTitle: true },
    });

    if (!fromListTitle && prior?.toListTitle) {
      fromListTitle = prior.toListTitle;
    }

    let enteredAt: Date | null = prior?.transitionedAt ?? input.taskCreatedAt ?? null;

    if (!enteredAt || input.assigneeIdAtMove === undefined) {
      const taskRow = await tx.task.findUnique({
        where: { id: taskId },
        select: { createdAt: true, assigneeId: true, list: { select: { title: true } } },
      });
      if (!enteredAt && taskRow?.createdAt instanceof Date) {
        enteredAt = taskRow.createdAt;
      }
      if (input.assigneeIdAtMove === undefined && taskRow?.assigneeId !== undefined) {
        assigneeIdAtMove = taskRow.assigneeId;
      }
      if (!fromListTitle && taskRow?.list?.title) {
        fromListTitle = taskRow.list.title;
      }
    }

    if (enteredAt instanceof Date && !Number.isNaN(enteredAt.getTime())) {
      durationMs = BigInt(Math.max(0, transitionedAt.getTime() - enteredAt.getTime()));
    }
  }

  const spRows = await tx.customFieldValue.findMany({
    where: {
      taskId,
      customField: { defaultKey: "story_points" },
    },
    select: { value: true },
    take: 1,
  });
  const storyPointsAtMove = parseStoryPoints(spRows[0]?.value);

  const completedAfterMove =
    input.completedAfterMove !== undefined ? input.completedAfterMove : isDoneList(toListTitle);

  return tx.taskStateTransition.create({
    data: {
      taskId,
      boardId,
      fromListId,
      fromListTitle,
      toListId,
      toListTitle,
      movedById,
      assigneeIdAtMove,
      storyPointsAtMove,
      completedAfterMove,
      durationMs,
      transitionedAt,
    },
  });
}

/**
 * Records multiple workflow state transitions inside the caller's transaction.
 */
export async function recordTaskStateTransitions(
  tx: Prisma.TransactionClient,
  moves: TaskStateMoveInput[],
) {
  const results = [];
  for (const move of moves) {
    const created = await recordTaskStateTransition(tx, move);
    if (created) results.push(created);
  }
  return results;
}
