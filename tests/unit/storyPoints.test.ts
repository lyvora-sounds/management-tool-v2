import { describe, expect, it } from "vitest";
import {
  getAchievedStoryPointsPerUser,
  getBoardMetricsSummary,
  getBoardVelocityTrends,
  getCycleAndLeadTime,
  getStateTransitionHistory,
  parseMetricsDate,
  type MetricsDbClient,
} from "@/lib/metrics/storyPoints";

function createMockDb(data: {
  transitions: {
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
  }[];
  tasks?: {
    id: string;
    title: string;
    createdAt: Date;
    completed: boolean;
    completedAt: Date | null;
    archived: boolean;
    assigneeId: string | null;
    collaborators?: { userId: string }[];
    customValues?: { value: string | null }[];
  }[];
  users?: { id: string; name: string | null; email: string }[];
}): MetricsDbClient {
  return {
    taskStateTransition: {
      findMany: async ({ where, orderBy, take }) => {
        let rows = data.transitions.filter((t) => {
          if (where.boardId && t.boardId !== where.boardId) return false;
          if (where.taskId && t.taskId !== where.taskId) return false;
          const timeFilter = where.transitionedAt as
            | { gte?: Date; lte?: Date }
            | undefined;
          if (timeFilter?.gte && t.transitionedAt < timeFilter.gte) return false;
          if (timeFilter?.lte && t.transitionedAt > timeFilter.lte) return false;
          return true;
        });
        const dir =
          orderBy && !Array.isArray(orderBy) ? orderBy.transitionedAt : "asc";
        rows = [...rows].sort((a, b) =>
          dir === "desc"
            ? b.transitionedAt.getTime() - a.transitionedAt.getTime()
            : a.transitionedAt.getTime() - b.transitionedAt.getTime(),
        );
        if (typeof take === "number") rows = rows.slice(0, take);
        return rows;
      },
    },
    task: {
      findMany: async () => data.tasks ?? [],
    },
    user: {
      findMany: async () =>
        data.users ?? [
          { id: "u-daniel", name: "Daniel Alvarez", email: "daniel@kiki.test" },
          { id: "u-mario", name: "Mario Ruby", email: "mario@kiki.test" },
        ],
    },
  };
}

describe("Story Points Velocity & Burndown Engine (KI-00062)", () => {
  it("aggregates achieved story points per user and preserves snapshot immutability when points change later", async () => {
    const db = createMockDb({
      transitions: [
        {
          id: "tr-1",
          taskId: "t-1",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 5, // Snapshot at move was 5
          completedAfterMove: true,
          durationMs: BigInt(7_200_000),
          transitionedAt: new Date("2026-10-15T12:00:00.000Z"),
        },
        {
          id: "tr-2",
          taskId: "t-2",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-mario",
          assigneeIdAtMove: "u-mario",
          storyPointsAtMove: 8,
          completedAfterMove: true,
          durationMs: BigInt(3_600_000),
          transitionedAt: new Date("2026-10-16T14:00:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "t-1",
          title: "Ticket 1",
          createdAt: new Date("2026-10-14T10:00:00.000Z"),
          completed: true,
          completedAt: new Date("2026-10-15T12:00:00.000Z"),
          archived: false,
          assigneeId: "u-daniel",
          // Later edited to 21 points! Snapshot must remain 5.
          customValues: [{ value: "21" }],
        },
        {
          id: "t-2",
          title: "Ticket 2",
          createdAt: new Date("2026-10-14T11:00:00.000Z"),
          completed: true,
          completedAt: new Date("2026-10-16T14:00:00.000Z"),
          archived: false,
          assigneeId: "u-mario",
          customValues: [{ value: "8" }],
        },
      ],
    });

    const perUser = await getAchievedStoryPointsPerUser(db, "b-1", {
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-31T23:59:59.000Z",
      groupBy: "week",
    });

    expect(perUser).toHaveLength(2);
    expect(perUser[0]).toMatchObject({
      userId: "u-mario",
      userName: "Mario Ruby",
      achievedPoints: 8,
      completedTasks: 1,
    });
    expect(perUser[1]).toMatchObject({
      userId: "u-daniel",
      userName: "Daniel Alvarez",
      achievedPoints: 5, // Uses snapshot 5, not the mutated 21!
      completedTasks: 1,
    });
  });

  it("handles edge cases: tickets moved back from Done to In progress, unassigned tickets, and tickets without story points", async () => {
    const db = createMockDb({
      transitions: [
        // Ticket A: Moved to Done, then moved BACK to In progress -> should NOT count!
        {
          id: "tr-a1",
          taskId: "t-reopened",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 13,
          completedAfterMove: true,
          durationMs: BigInt(1000),
          transitionedAt: new Date("2026-10-10T10:00:00.000Z"),
        },
        {
          id: "tr-a2",
          taskId: "t-reopened",
          boardId: "b-1",
          fromListId: "l-done",
          fromListTitle: "Done",
          toListId: "l-ip",
          toListTitle: "In progress",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 13,
          completedAfterMove: false,
          durationMs: BigInt(2000),
          transitionedAt: new Date("2026-10-11T10:00:00.000Z"),
        },
        // Ticket B: Unassigned ticket with 3 points
        {
          id: "tr-b1",
          taskId: "t-unassigned",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: null,
          storyPointsAtMove: 3,
          completedAfterMove: true,
          durationMs: BigInt(5000),
          transitionedAt: new Date("2026-10-12T10:00:00.000Z"),
        },
        // Ticket C: Assigned to Daniel, but NO story points (null)
        {
          id: "tr-c1",
          taskId: "t-nopoints",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: null,
          completedAfterMove: true,
          durationMs: BigInt(5000),
          transitionedAt: new Date("2026-10-12T12:00:00.000Z"),
        },
      ],
    });

    const perUser = await getAchievedStoryPointsPerUser(db, "b-1");

    const unassigned = perUser.find((u) => u.userId === null);
    const daniel = perUser.find((u) => u.userId === "u-daniel");

    expect(unassigned).toMatchObject({
      userId: null,
      userName: "Unassigned",
      achievedPoints: 3,
      completedTasks: 1,
    });
    expect(daniel).toMatchObject({
      userId: "u-daniel",
      achievedPoints: 0, // t-reopened (13 pts) was excluded; t-nopoints contributed 0 pts + 1 task
      completedTasks: 1,
    });
  });

  it("supports split allocation across assignee and collaborators", async () => {
    const db = createMockDb({
      transitions: [
        {
          id: "tr-split",
          taskId: "t-split",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 8,
          completedAfterMove: true,
          durationMs: BigInt(3_600_000),
          transitionedAt: new Date("2026-10-20T10:00:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "t-split",
          title: "Paired task",
          createdAt: new Date("2026-10-19T10:00:00.000Z"),
          completed: true,
          completedAt: new Date("2026-10-20T10:00:00.000Z"),
          archived: false,
          assigneeId: "u-daniel",
          collaborators: [{ userId: "u-mario" }],
          customValues: [{ value: "8" }],
        },
      ],
    });

    const splitResult = await getAchievedStoryPointsPerUser(db, "b-1", {
      allocationPolicy: "split",
    });

    expect(splitResult).toHaveLength(2);
    expect(splitResult[0]?.achievedPoints).toBe(4);
    expect(splitResult[1]?.achievedPoints).toBe(4);
  });

  it("computes velocity trends, burndown remaining points, lead/cycle time, and bottleneck list", async () => {
    const db = createMockDb({
      transitions: [
        {
          id: "tr-1",
          taskId: "t-1",
          boardId: "b-1",
          fromListId: "l-todo",
          fromListTitle: "To do",
          toListId: "l-ip",
          toListTitle: "In progress",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 5,
          completedAfterMove: false,
          durationMs: BigInt(3_600_000), // 1h in To do
          transitionedAt: new Date("2026-10-10T11:00:00.000Z"),
        },
        {
          id: "tr-2",
          taskId: "t-1",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-review",
          toListTitle: "To Review",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 5,
          completedAfterMove: false,
          durationMs: BigInt(7_200_000), // 2h in In progress
          transitionedAt: new Date("2026-10-10T13:00:00.000Z"),
        },
        {
          id: "tr-3",
          taskId: "t-1",
          boardId: "b-1",
          fromListId: "l-review",
          fromListTitle: "To Review",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 5,
          completedAfterMove: true,
          durationMs: BigInt(36_000_000), // 10h in To Review -> Bottleneck!
          transitionedAt: new Date("2026-10-10T23:00:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "t-1",
          title: "Completed task",
          createdAt: new Date("2026-10-10T10:00:00.000Z"),
          completed: true,
          completedAt: new Date("2026-10-10T23:00:00.000Z"),
          archived: false,
          assigneeId: "u-daniel",
          customValues: [{ value: "5" }],
        },
        {
          id: "t-2",
          title: "Open task",
          createdAt: new Date("2026-10-10T10:00:00.000Z"),
          completed: false,
          completedAt: null,
          archived: false,
          assigneeId: "u-daniel",
          customValues: [{ value: "8" }],
        },
      ],
    });

    const velocity = await getBoardVelocityTrends(db, "b-1", { intervals: "weekly" });
    expect(velocity.totalPlannedPoints).toBe(13);
    expect(velocity.totalAchievedPoints).toBe(5);
    expect(velocity.buckets[0]).toMatchObject({
      achievedPoints: 5,
      cumulativePoints: 5,
      remainingPoints: 8,
    });

    const cycleLead = await getCycleAndLeadTime(db, "b-1");
    expect(cycleLead.bottleneckListId).toBe("l-review");
    expect(cycleLead.bottleneckListTitle).toBe("To Review");
    expect(cycleLead.leadTime.averageMs).toBe(13 * 3_600_000); // 10:00 -> 23:00 = 13h
    expect(cycleLead.cycleTime.averageMs).toBe(12 * 3_600_000); // 11:00 -> 23:00 = 12h

    const history = await getStateTransitionHistory(db, { boardId: "b-1", taskId: "t-1" });
    expect(history).toHaveLength(3);
    expect(history[0]?.toListTitle).toBe("Done");

    const summary = await getBoardMetricsSummary(db, "b-1");
    expect(summary.totals).toMatchObject({
      plannedPoints: 13,
      achievedPoints: 5,
      remainingPoints: 8,
      completionRate: 38,
      totalTasks: 2,
      completedTasks: 1,
    });
  });

  it("includes completions later on a bare YYYY-MM-DD endDate (inclusive UTC day)", async () => {
    const db = createMockDb({
      transitions: [
        {
          id: "tr-late",
          taskId: "t-1",
          boardId: "b-1",
          fromListId: "l-ip",
          fromListTitle: "In progress",
          toListId: "l-done",
          toListTitle: "Done",
          movedById: "u-daniel",
          assigneeIdAtMove: "u-daniel",
          storyPointsAtMove: 5,
          completedAfterMove: true,
          durationMs: BigInt(1_000),
          transitionedAt: new Date("2026-10-31T18:30:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "t-1",
          title: "Late finish",
          createdAt: new Date("2026-10-01T10:00:00.000Z"),
          completed: true,
          completedAt: new Date("2026-10-31T18:30:00.000Z"),
          archived: false,
          assigneeId: "u-daniel",
          customValues: [{ value: "5" }],
        },
      ],
    });

    const end = parseMetricsDate("2026-10-31", "end");
    expect(end).toEqual(new Date("2026-10-31T23:59:59.999Z"));

    const midnightOnly = await getAchievedStoryPointsPerUser(db, "b-1", {
      endDate: new Date("2026-10-31T00:00:00.000Z"),
    });
    expect(midnightOnly).toHaveLength(0);

    const inclusive = await getAchievedStoryPointsPerUser(db, "b-1", {
      endDate: "2026-10-31",
    });
    expect(inclusive).toHaveLength(1);
    expect(inclusive[0]).toMatchObject({ userId: "u-daniel", achievedPoints: 5 });
  });

  it("loads board history once when building the metrics summary", async () => {
    let transitionLoads = 0;
    let taskLoads = 0;
    const base = createMockDb({
      transitions: [],
      tasks: [
        {
          id: "t-1",
          title: "Open",
          createdAt: new Date("2026-10-01T10:00:00.000Z"),
          completed: false,
          completedAt: null,
          archived: false,
          assigneeId: "u-daniel",
          customValues: [{ value: "3" }],
        },
      ],
    });
    const db: MetricsDbClient = {
      taskStateTransition: {
        findMany: async (args) => {
          transitionLoads += 1;
          return base.taskStateTransition.findMany(args);
        },
      },
      task: {
        findMany: async (args) => {
          taskLoads += 1;
          return base.task.findMany(args);
        },
      },
      user: base.user,
    };

    await getBoardMetricsSummary(db, "b-1", { endDate: "2026-10-31" });
    expect(transitionLoads).toBe(1);
    expect(taskLoads).toBe(1);
  });
});
