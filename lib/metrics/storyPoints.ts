import { isDoneList } from "@/lib/statusTheme";
import { parseStoryPoints, toDurationMs } from "@/lib/transitions";

export type GroupByInterval = "day" | "week" | "month";
export type VelocityInterval = "daily" | "weekly" | "monthly" | GroupByInterval;
export type AllocationPolicy = "primary" | "split";

export type StoryPointsQueryOptions = {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  groupBy?: GroupByInterval;
  userId?: string | null;
  allocationPolicy?: AllocationPolicy;
};

export type VelocityQueryOptions = {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  intervals?: VelocityInterval;
  userId?: string | null;
  allocationPolicy?: AllocationPolicy;
};

export type CycleLeadQueryOptions = {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

export type UserPeriodBucket = {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  points: number;
  tasks: number;
};

export type UserAchievedPointsEntry = {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  achievedPoints: number;
  completedTasks: number;
  buckets: UserPeriodBucket[];
};

export type VelocityTrendBucket = {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  achievedPoints: number;
  completedTasks: number;
  cumulativePoints: number;
  remainingPoints: number;
  byUser: {
    userId: string | null;
    userName: string | null;
    points: number;
    tasks: number;
  }[];
};

export type VelocityTrendsResult = {
  interval: GroupByInterval;
  totalPlannedPoints: number;
  totalAchievedPoints: number;
  totalCompletedTasks: number;
  buckets: VelocityTrendBucket[];
};

export type DurationSummary = {
  averageMs: number | null;
  medianMs: number | null;
  p85Ms: number | null;
  sampleSize: number;
};

export type ListDwellStats = {
  listId: string;
  listTitle: string;
  transitionCount: number;
  averageDwellMs: number;
  medianDwellMs: number;
  totalDwellMs: number;
  isBottleneck: boolean;
};

export type CycleAndLeadTimeResult = {
  leadTime: DurationSummary;
  cycleTime: DurationSummary;
  dwellByList: ListDwellStats[];
  bottleneckListId: string | null;
  bottleneckListTitle: string | null;
};

export type StateTransitionHistoryEntry = {
  id: string;
  taskId: string;
  taskTitle: string | null;
  boardId: string;
  fromListId: string | null;
  fromListTitle: string | null;
  toListId: string;
  toListTitle: string;
  movedById: string | null;
  movedByName: string | null;
  assigneeIdAtMove: string | null;
  assigneeNameAtMove: string | null;
  storyPointsAtMove: number | null;
  completedAfterMove: boolean;
  durationMs: number | null;
  transitionedAt: string;
};

export type BoardMetricsSummary = {
  boardId: string;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  totals: {
    plannedPoints: number;
    achievedPoints: number;
    remainingPoints: number;
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
  };
  achievedByUser: UserAchievedPointsEntry[];
  velocity: VelocityTrendsResult;
  cycleAndLeadTime: CycleAndLeadTimeResult;
};

type TransitionRow = {
  id: string;
  taskId: string;
  boardId: string;
  fromListId: string | null;
  fromListTitle: string | null;
  toListId: string;
  toListTitle: string;
  movedById: string | null;
  assigneeIdAtMove: string | null;
  storyPointsAtMove: number | null;
  completedAfterMove: boolean;
  durationMs: bigint | null;
  transitionedAt: Date;
};

type TaskMetaRow = {
  id: string;
  title: string;
  createdAt: Date;
  completed: boolean;
  completedAt: Date | null;
  archived: boolean;
  assigneeId: string | null;
  collaborators?: { userId: string }[];
  customValues?: { value: string | null }[];
};

type UserMetaRow = {
  id: string;
  name: string | null;
  email: string;
};

export type MetricsDbClient = {
  taskStateTransition: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
      take?: number;
    }) => Promise<TransitionRow[]>;
  };
  task: {
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<TaskMetaRow[]>;
  };
  user: {
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<UserMetaRow[]>;
  };
};

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a date bound. Bare `YYYY-MM-DD` is UTC start-of-day for `start` and
 * end-of-day (23:59:59.999Z) for `end` so day-long ranges stay inclusive.
 * Returns `"invalid"` when the value is present but not a real date.
 */
export function parseMetricsDate(
  value: Date | string | null | undefined,
  bound: "start" | "end" = "start",
): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const bare = value.trim();
    const m = DATE_ONLY.exec(bare);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      if (bound === "end") return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));
      return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "invalid" : d;
}

function toValidDate(
  value: Date | string | null | undefined,
  bound: "start" | "end" = "start",
): Date | null {
  const parsed = parseMetricsDate(value, bound);
  return parsed === "invalid" ? null : parsed;
}

function normalizeInterval(interval?: VelocityInterval): GroupByInterval {
  if (interval === "daily" || interval === "day") return "day";
  if (interval === "monthly" || interval === "month") return "month";
  return "week";
}

/** Computes UTC period key, start, and end for a given timestamp and granularity. */
export function getPeriodBounds(
  date: Date,
  groupBy: GroupByInterval,
): { periodKey: string; periodStart: string; periodEnd: string } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  if (groupBy === "day") {
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    const key = start.toISOString().slice(0, 10);
    return { periodKey: key, periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  if (groupBy === "month") {
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    return { periodKey: key, periodStart: start.toISOString(), periodEnd: end.toISOString() };
  }

  // ISO week starting Monday (UTC)
  const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(Date.UTC(y, m, d + diffToMonday, 0, 0, 0, 0));
  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + 6,
      23,
      59,
      59,
      999,
    ),
  );
  const key = start.toISOString().slice(0, 10);
  return { periodKey: key, periodStart: start.toISOString(), periodEnd: end.toISOString() };
}

function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}

function summarizeDurations(samplesMs: number[]): DurationSummary {
  const valid = samplesMs.filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b);
  if (valid.length === 0) {
    return { averageMs: null, medianMs: null, p85Ms: null, sampleSize: 0 };
  }
  const sum = valid.reduce((acc, v) => acc + v, 0);
  const averageMs = Math.round(sum / valid.length);
  const mid = Math.floor(valid.length / 2);
  const medianMs =
    valid.length % 2 === 1
      ? (valid[mid] ?? null)
      : Math.round(((valid[mid - 1] ?? 0) + (valid[mid] ?? 0)) / 2);
  const p85Index = Math.min(valid.length - 1, Math.ceil(valid.length * 0.85) - 1);
  const p85Ms = valid[Math.max(0, p85Index)] ?? null;
  return { averageMs, medianMs, p85Ms, sampleSize: valid.length };
}

type ResolvedCompletion = {
  taskId: string;
  transitionedAt: Date;
  points: number;
  assigneeIdAtMove: string | null;
  recipientUserIds: (string | null)[];
};

/**
 * Resolves net completed tasks within [startDate, endDate].
 * - If a ticket moved to Done and was subsequently moved back to a non-Done list on or before `endDate`,
 *   it is NOT counted as completed (prevents re-opened tickets from inflating velocity).
 * - Uses `storyPointsAtMove` snapshot from the terminal Done transition so post-completion edits
 *   to story points never skew historical reports.
 */
function resolveNetCompletions(
  transitions: TransitionRow[],
  tasksById: Map<string, TaskMetaRow>,
  options: {
    startDate: Date | null;
    endDate: Date | null;
    allocationPolicy: AllocationPolicy;
  },
): ResolvedCompletion[] {
  const { startDate, endDate, allocationPolicy } = options;

  // Group transitions by taskId in ascending chronological order (up to endDate if specified).
  const byTask = new Map<string, TransitionRow[]>();
  for (const row of transitions) {
    if (endDate && row.transitionedAt.getTime() > endDate.getTime()) continue;
    const list = byTask.get(row.taskId) ?? [];
    list.push(row);
    byTask.set(row.taskId, list);
  }

  const completions: ResolvedCompletion[] = [];

  for (const [taskId, rows] of byTask.entries()) {
    rows.sort((a, b) => a.transitionedAt.getTime() - b.transitionedAt.getTime());
    const last = rows[rows.length - 1];
    if (!last || !last.completedAfterMove) {
      // Ticket was moved back out of Done (or never reached Done) as of endDate.
      continue;
    }

    // Find the start of the unbroken terminal Done streak at the end of `rows`.
    let terminalDoneTransition = last;
    for (let i = rows.length - 1; i >= 0; i--) {
      const candidate = rows[i];
      if (candidate && candidate.completedAfterMove) {
        terminalDoneTransition = candidate;
      } else {
        break;
      }
    }

    const completedAt = terminalDoneTransition.transitionedAt;
    if (startDate && completedAt.getTime() < startDate.getTime()) continue;
    if (endDate && completedAt.getTime() > endDate.getTime()) continue;

    const points = terminalDoneTransition.storyPointsAtMove ?? 0;
    const taskMeta = tasksById.get(taskId);
    const primaryAssignee = terminalDoneTransition.assigneeIdAtMove ?? null;

    let recipientUserIds: (string | null)[] = [primaryAssignee];
    if (allocationPolicy === "split") {
      const collabIds = (taskMeta?.collaborators ?? []).map((c) => c.userId);
      const uniqueIds = Array.from(
        new Set([primaryAssignee, ...collabIds].filter((id): id is string => Boolean(id))),
      );
      recipientUserIds = uniqueIds.length > 0 ? uniqueIds : [null];
    }

    completions.push({
      taskId,
      transitionedAt: completedAt,
      points: Math.max(0, points),
      assigneeIdAtMove: primaryAssignee,
      recipientUserIds,
    });
  }

  return completions;
}

/**
 * Aggregates achieved story points and completed task count per user across a configurable date range.
 */
export async function getAchievedStoryPointsPerUser(
  prisma: MetricsDbClient,
  boardId: string,
  options: StoryPointsQueryOptions = {},
): Promise<UserAchievedPointsEntry[]> {
  const startDate = toValidDate(options.startDate, "start");
  const endDate = toValidDate(options.endDate, "end");
  const groupBy: GroupByInterval = options.groupBy ?? "week";
  const allocationPolicy: AllocationPolicy = options.allocationPolicy ?? "primary";
  const filterUserId = options.userId !== undefined ? options.userId : undefined;

  const [transitions, tasks] = await Promise.all([
    prisma.taskStateTransition.findMany({
      where: {
        boardId,
        ...(endDate ? { transitionedAt: { lte: endDate } } : {}),
      },
      orderBy: { transitionedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { list: { boardId } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completed: true,
        completedAt: true,
        archived: true,
        assigneeId: true,
        collaborators: { select: { userId: true } },
        customValues: {
          where: { customField: { defaultKey: "story_points" } },
          select: { value: true },
        },
      },
    }),
  ]);

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const completions = resolveNetCompletions(transitions, tasksById, {
    startDate,
    endDate,
    allocationPolicy,
  });

  // Collect all referenced user IDs to hydrate names/emails.
  const userIds = new Set<string>();
  for (const c of completions) {
    for (const uid of c.recipientUserIds) {
      if (uid) userIds.add(uid);
    }
  }
  const users =
    userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const accumulator = new Map<
    string,
    {
      userId: string | null;
      achievedPoints: number;
      completedTasks: number;
      buckets: Map<string, UserPeriodBucket>;
    }
  >();

  for (const comp of completions) {
    const share = comp.points / comp.recipientUserIds.length;
    const period = getPeriodBounds(comp.transitionedAt, groupBy);

    for (const uid of comp.recipientUserIds) {
      if (filterUserId !== undefined && uid !== filterUserId) continue;

      const mapKey = uid ?? "__unassigned__";
      let entry = accumulator.get(mapKey);
      if (!entry) {
        entry = {
          userId: uid,
          achievedPoints: 0,
          completedTasks: 0,
          buckets: new Map(),
        };
        accumulator.set(mapKey, entry);
      }

      entry.achievedPoints = roundPoints(entry.achievedPoints + share);
      entry.completedTasks += 1;

      const existingBucket = entry.buckets.get(period.periodKey);
      if (existingBucket) {
        existingBucket.points = roundPoints(existingBucket.points + share);
        existingBucket.tasks += 1;
      } else {
        entry.buckets.set(period.periodKey, {
          periodKey: period.periodKey,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          points: roundPoints(share),
          tasks: 1,
        });
      }
    }
  }

  const results: UserAchievedPointsEntry[] = Array.from(accumulator.values()).map((entry) => {
    const user = entry.userId ? userById.get(entry.userId) : null;
    return {
      userId: entry.userId,
      userName: user?.name ?? (entry.userId ? user?.email ?? entry.userId : "Unassigned"),
      userEmail: user?.email ?? null,
      achievedPoints: roundPoints(entry.achievedPoints),
      completedTasks: entry.completedTasks,
      buckets: Array.from(entry.buckets.values()).sort((a, b) =>
        a.periodKey.localeCompare(b.periodKey),
      ),
    };
  });

  return results.sort((a, b) => {
    if (b.achievedPoints !== a.achievedPoints) return b.achievedPoints - a.achievedPoints;
    return b.completedTasks - a.completedTasks;
  });
}

/**
 * Computes board velocity trends and cumulative burndown across weekly/monthly/daily intervals.
 */
export async function getBoardVelocityTrends(
  prisma: MetricsDbClient,
  boardId: string,
  options: VelocityQueryOptions = {},
): Promise<VelocityTrendsResult> {
  const startDate = toValidDate(options.startDate, "start");
  const endDate = toValidDate(options.endDate, "end");
  const interval = normalizeInterval(options.intervals);
  const allocationPolicy: AllocationPolicy = options.allocationPolicy ?? "primary";
  const filterUserId = options.userId !== undefined ? options.userId : undefined;

  const [transitions, tasks] = await Promise.all([
    prisma.taskStateTransition.findMany({
      where: {
        boardId,
        ...(endDate ? { transitionedAt: { lte: endDate } } : {}),
      },
      orderBy: { transitionedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { list: { boardId }, archived: false },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completed: true,
        completedAt: true,
        archived: true,
        assigneeId: true,
        collaborators: { select: { userId: true } },
        customValues: {
          where: { customField: { defaultKey: "story_points" } },
          select: { value: true },
        },
      },
    }),
  ]);

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const completions = resolveNetCompletions(transitions, tasksById, {
    startDate,
    endDate,
    allocationPolicy,
  });

  // Planned points: use snapshot points for completed tasks in window, plus current points for other tasks on board.
  const completedPointsByTask = new Map(completions.map((c) => [c.taskId, c.points]));
  let totalPlannedPoints = 0;
  for (const task of tasks) {
    if (filterUserId !== undefined && task.assigneeId !== filterUserId) continue;
    const snap = completedPointsByTask.get(task.id);
    if (snap !== undefined) {
      totalPlannedPoints += snap;
    } else {
      const raw = task.customValues?.[0]?.value ?? null;
      totalPlannedPoints += Math.max(0, parseStoryPoints(raw) ?? 0);
    }
  }

  const userIds = new Set<string>();
  for (const c of completions) {
    for (const uid of c.recipientUserIds) {
      if (uid) userIds.add(uid);
    }
  }
  const users =
    userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const bucketMap = new Map<
    string,
    {
      periodKey: string;
      periodStart: string;
      periodEnd: string;
      achievedPoints: number;
      completedTasks: number;
      byUser: Map<string, { userId: string | null; points: number; tasks: number }>;
    }
  >();

  let totalAchievedPoints = 0;
  let totalCompletedTasks = 0;

  for (const comp of completions) {
    if (
      filterUserId !== undefined &&
      !comp.recipientUserIds.some((uid) => uid === filterUserId)
    ) {
      continue;
    }

    const period = getPeriodBounds(comp.transitionedAt, interval);
    let bucket = bucketMap.get(period.periodKey);
    if (!bucket) {
      bucket = {
        periodKey: period.periodKey,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        achievedPoints: 0,
        completedTasks: 0,
        byUser: new Map(),
      };
      bucketMap.set(period.periodKey, bucket);
    }

    const share = comp.points / comp.recipientUserIds.length;
    let taskCountedInBucket = false;

    for (const uid of comp.recipientUserIds) {
      if (filterUserId !== undefined && uid !== filterUserId) continue;
      bucket.achievedPoints = roundPoints(bucket.achievedPoints + share);
      totalAchievedPoints = roundPoints(totalAchievedPoints + share);
      if (!taskCountedInBucket) {
        bucket.completedTasks += 1;
        totalCompletedTasks += 1;
        taskCountedInBucket = true;
      }

      const uKey = uid ?? "__unassigned__";
      const prevUser = bucket.byUser.get(uKey);
      if (prevUser) {
        prevUser.points = roundPoints(prevUser.points + share);
        prevUser.tasks += 1;
      } else {
        bucket.byUser.set(uKey, {
          userId: uid,
          points: roundPoints(share),
          tasks: 1,
        });
      }
    }
  }

  const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) =>
    a.periodKey.localeCompare(b.periodKey),
  );

  // Ensure totalPlannedPoints is at least totalAchievedPoints so remainingPoints never starts negative.
  const effectivePlanned = Math.max(totalPlannedPoints, totalAchievedPoints);
  let runningCumulative = 0;

  const buckets: VelocityTrendBucket[] = sortedBuckets.map((b) => {
    runningCumulative = roundPoints(runningCumulative + b.achievedPoints);
    const remainingPoints = roundPoints(Math.max(0, effectivePlanned - runningCumulative));
    return {
      periodKey: b.periodKey,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      achievedPoints: b.achievedPoints,
      completedTasks: b.completedTasks,
      cumulativePoints: runningCumulative,
      remainingPoints,
      byUser: Array.from(b.byUser.values())
        .map((u) => {
          const user = u.userId ? userById.get(u.userId) : null;
          return {
            userId: u.userId,
            userName: user?.name ?? (u.userId ? user?.email ?? u.userId : "Unassigned"),
            points: u.points,
            tasks: u.tasks,
          };
        })
        .sort((a, b) => b.points - a.points),
    };
  });

  return {
    interval,
    totalPlannedPoints: roundPoints(effectivePlanned),
    totalAchievedPoints: roundPoints(totalAchievedPoints),
    totalCompletedTasks,
    buckets,
  };
}

/**
 * Computes lead time, cycle time, and per-column state dwell times (identifying workflow bottlenecks).
 */
export async function getCycleAndLeadTime(
  prisma: MetricsDbClient,
  boardId: string,
  options: CycleLeadQueryOptions = {},
): Promise<CycleAndLeadTimeResult> {
  const startDate = toValidDate(options.startDate, "start");
  const endDate = toValidDate(options.endDate, "end");

  const [transitions, tasks] = await Promise.all([
    prisma.taskStateTransition.findMany({
      where: {
        boardId,
        ...(endDate ? { transitionedAt: { lte: endDate } } : {}),
      },
      orderBy: { transitionedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { list: { boardId } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completed: true,
        completedAt: true,
        archived: true,
        assigneeId: true,
      },
    }),
  ]);

  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  // 1. Per-list dwell time across transitions occurring within [startDate, endDate]
  const dwellSamplesByList = new Map<
    string,
    { listId: string; listTitle: string; samples: number[] }
  >();

  for (const row of transitions) {
    if (startDate && row.transitionedAt.getTime() < startDate.getTime()) continue;
    if (endDate && row.transitionedAt.getTime() > endDate.getTime()) continue;
    if (!row.fromListId || row.durationMs == null) continue;

    const ms = toDurationMs(row.durationMs);
    if (ms == null || ms < 0) continue;

    let entry = dwellSamplesByList.get(row.fromListId);
    if (!entry) {
      entry = {
        listId: row.fromListId,
        listTitle: row.fromListTitle ?? row.fromListId,
        samples: [],
      };
      dwellSamplesByList.set(row.fromListId, entry);
    }
    if (row.fromListTitle) entry.listTitle = row.fromListTitle;
    entry.samples.push(ms);
  }

  const rawDwellStats: ListDwellStats[] = Array.from(dwellSamplesByList.values()).map((entry) => {
    const summary = summarizeDurations(entry.samples);
    const totalDwellMs = entry.samples.reduce((acc, v) => acc + v, 0);
    return {
      listId: entry.listId,
      listTitle: entry.listTitle,
      transitionCount: entry.samples.length,
      averageDwellMs: summary.averageMs ?? 0,
      medianDwellMs: summary.medianMs ?? 0,
      totalDwellMs,
      isBottleneck: false,
    };
  });

  // Bottleneck is the non-Done column with the highest average dwell time.
  let bottleneck: ListDwellStats | null = null;
  for (const stat of rawDwellStats) {
    if (isDoneList(stat.listTitle) || stat.transitionCount === 0) continue;
    if (!bottleneck || stat.averageDwellMs > bottleneck.averageDwellMs) {
      bottleneck = stat;
    }
  }
  if (bottleneck && bottleneck.averageDwellMs > 0) {
    bottleneck.isBottleneck = true;
  }

  // 2. Lead time & Cycle time for net completed tickets in [startDate, endDate]
  const completions = resolveNetCompletions(transitions, tasksById, {
    startDate,
    endDate,
    allocationPolicy: "primary",
  });

  const transitionsByTask = new Map<string, TransitionRow[]>();
  for (const row of transitions) {
    if (endDate && row.transitionedAt.getTime() > endDate.getTime()) continue;
    const list = transitionsByTask.get(row.taskId) ?? [];
    list.push(row);
    transitionsByTask.set(row.taskId, list);
  }

  const leadSamples: number[] = [];
  const cycleSamples: number[] = [];

  for (const comp of completions) {
    const taskMeta = tasksById.get(comp.taskId);
    const taskRows = (transitionsByTask.get(comp.taskId) ?? []).sort(
      (a, b) => a.transitionedAt.getTime() - b.transitionedAt.getTime(),
    );

    const createdAt =
      taskMeta?.createdAt ??
      taskRows.find((r) => r.fromListId === null)?.transitionedAt ??
      null;
    if (createdAt instanceof Date) {
      const leadMs = Math.max(0, comp.transitionedAt.getTime() - createdAt.getTime());
      leadSamples.push(leadMs);
    }

    // Cycle time: from first move into an active (non-initial) list until Done, or the dwell time of the move into Done.
    const firstMoveRow = taskRows.find((r) => r.fromListId !== null);
    if (firstMoveRow) {
      if (firstMoveRow.id === taskRows[taskRows.length - 1]?.id && firstMoveRow.durationMs != null) {
        const directMs = toDurationMs(firstMoveRow.durationMs);
        if (directMs != null) cycleSamples.push(directMs);
      } else {
        const cycleMs = Math.max(
          0,
          comp.transitionedAt.getTime() - firstMoveRow.transitionedAt.getTime(),
        );
        cycleSamples.push(cycleMs);
      }
    }
  }

  return {
    leadTime: summarizeDurations(leadSamples),
    cycleTime: summarizeDurations(cycleSamples),
    dwellByList: rawDwellStats,
    bottleneckListId: bottleneck && bottleneck.averageDwellMs > 0 ? bottleneck.listId : null,
    bottleneckListTitle: bottleneck && bottleneck.averageDwellMs > 0 ? bottleneck.listTitle : null,
  };
}

/**
 * Returns chronological state transition history for a ticket or board.
 */
export async function getStateTransitionHistory(
  prisma: MetricsDbClient,
  params: {
    boardId: string;
    taskId?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    limit?: number;
  },
): Promise<StateTransitionHistoryEntry[]> {
  const startDate = toValidDate(params.startDate, "start");
  const endDate = toValidDate(params.endDate, "end");
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);

  const timeFilter: Record<string, Date> = {};
  if (startDate) timeFilter.gte = startDate;
  if (endDate) timeFilter.lte = endDate;

  const rows = await prisma.taskStateTransition.findMany({
    where: {
      boardId: params.boardId,
      ...(params.taskId ? { taskId: params.taskId } : {}),
      ...(Object.keys(timeFilter).length > 0 ? { transitionedAt: timeFilter } : {}),
    },
    orderBy: { transitionedAt: "desc" },
    take: limit,
  });

  if (rows.length === 0) return [];

  const taskIds = Array.from(new Set(rows.map((r) => r.taskId)));
  const userIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.movedById, r.assigneeIdAtMove]).filter((id): id is string => Boolean(id)),
    ),
  );

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, title: true, createdAt: true, completed: true, completedAt: true, archived: true, assigneeId: true },
    }),
    userIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const titleById = new Map(tasks.map((t) => [t.id, t.title]));
  const userNameById = new Map(users.map((u) => [u.id, u.name ?? u.email]));

  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    taskTitle: titleById.get(row.taskId) ?? null,
    boardId: row.boardId,
    fromListId: row.fromListId,
    fromListTitle: row.fromListTitle,
    toListId: row.toListId,
    toListTitle: row.toListTitle,
    movedById: row.movedById,
    movedByName: row.movedById ? userNameById.get(row.movedById) ?? null : null,
    assigneeIdAtMove: row.assigneeIdAtMove,
    assigneeNameAtMove: row.assigneeIdAtMove ? userNameById.get(row.assigneeIdAtMove) ?? null : null,
    storyPointsAtMove: row.storyPointsAtMove,
    completedAfterMove: row.completedAfterMove,
    durationMs: toDurationMs(row.durationMs),
    transitionedAt: row.transitionedAt.toISOString(),
  }));
}

/**
 * Returns a complete board observability & delivery metrics summary.
 */
export async function getBoardMetricsSummary(
  prisma: MetricsDbClient,
  boardId: string,
  options: {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    groupBy?: GroupByInterval;
    userId?: string | null;
    allocationPolicy?: AllocationPolicy;
  } = {},
): Promise<BoardMetricsSummary> {
  const startDate = toValidDate(options.startDate, "start");
  const endDate = toValidDate(options.endDate, "end");
  const groupBy = options.groupBy ?? "week";

  // One shared history/task load for the three aggregators (avoids 3× full-board scans).
  const [sharedTransitions, sharedTasks] = await Promise.all([
    prisma.taskStateTransition.findMany({
      where: {
        boardId,
        ...(endDate ? { transitionedAt: { lte: endDate } } : {}),
      },
      orderBy: { transitionedAt: "asc" },
    }),
    prisma.task.findMany({
      where: { list: { boardId } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completed: true,
        completedAt: true,
        archived: true,
        assigneeId: true,
        collaborators: { select: { userId: true } },
        customValues: {
          where: { customField: { defaultKey: "story_points" } },
          select: { value: true },
        },
      },
    }),
  ]);

  const cachedPrisma = {
    taskStateTransition: {
      findMany: async () => sharedTransitions,
    },
    task: {
      findMany: async (args?: { where?: { archived?: boolean; list?: unknown; assigneeId?: string | null } }) => {
        let rows = sharedTasks;
        if (args?.where?.archived === false) {
          rows = rows.filter((t) => !t.archived);
        }
        if (args?.where && "assigneeId" in args.where) {
          rows = rows.filter((t) => t.assigneeId === args.where!.assigneeId);
        }
        return rows;
      },
    },
    user: prisma.user,
  } as unknown as MetricsDbClient;

  const [achievedByUser, velocity, cycleAndLeadTime] = await Promise.all([
    getAchievedStoryPointsPerUser(cachedPrisma, boardId, {
      startDate,
      endDate,
      groupBy,
      userId: options.userId,
      allocationPolicy: options.allocationPolicy,
    }),
    getBoardVelocityTrends(cachedPrisma, boardId, {
      startDate,
      endDate,
      intervals: groupBy,
      userId: options.userId,
      allocationPolicy: options.allocationPolicy,
    }),
    getCycleAndLeadTime(cachedPrisma, boardId, { startDate, endDate }),
  ]);

  const tasks = sharedTasks.filter((t) => {
    if (t.archived) return false;
    if (options.userId !== undefined) return t.assigneeId === options.userId;
    return true;
  });

  const plannedPoints = velocity.totalPlannedPoints;
  const achievedPoints = velocity.totalAchievedPoints;
  const remainingPoints = roundPoints(Math.max(0, plannedPoints - achievedPoints));
  const completionRate =
    plannedPoints > 0 ? Math.min(100, Math.round((achievedPoints / plannedPoints) * 100)) : 0;

  return {
    boardId,
    dateRange: {
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    },
    totals: {
      plannedPoints,
      achievedPoints,
      remainingPoints,
      completionRate,
      totalTasks: tasks.length,
      completedTasks: velocity.totalCompletedTasks,
    },
    achievedByUser,
    velocity,
    cycleAndLeadTime,
  };
}
