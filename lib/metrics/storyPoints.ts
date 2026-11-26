/** The shapes of the board metrics kiki-api computes (`GET /v1/boards/:boardId/metrics` and `/state-history`). */
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
