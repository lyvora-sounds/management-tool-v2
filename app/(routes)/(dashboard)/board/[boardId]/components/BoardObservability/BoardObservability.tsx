"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";
import type {
  BoardMetricsSummary,
  GroupByInterval,
  StateTransitionHistoryEntry,
} from "@/lib/metrics/storyPoints";
import type { SecurityAuditLogRecord } from "@/lib/securityAudit";
import {
  formatIsoObservabilityJsonBundle,
  formatSecurityAuditLogsCsv,
  formatStateTransitionsCsv,
} from "@/lib/metrics/exportObservability";

export interface BoardObservabilityProps {
  boardId: string;
  boardUsers: { id: string; name: string | null; email: string }[];
}

type DatePreset = "7d" | "30d" | "quarter" | "all";

function formatDurationHuman(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms) || ms <= 0) {
    return "—";
  }
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const mins = Math.max(1, Math.round(ms / (1000 * 60)));
    return `${mins}m`;
  }
  if (hours < 48) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BoardObservability({ boardId, boardUsers }: BoardObservabilityProps) {
  const t = useTranslations("observability");

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [groupBy, setGroupBy] = useState<GroupByInterval>("week");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [activeAuditTab, setActiveAuditTab] = useState<"transitions" | "security">("transitions");

  const [metrics, setMetrics] = useState<BoardMetricsSummary | null>(null);
  const [transitions, setTransitions] = useState<StateTransitionHistoryEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const dateWindow = useMemo(() => {
    const now = new Date();
    if (preset === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (preset === "30d") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (preset === "quarter") {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [preset]);

  const loadObservabilityData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("groupBy", groupBy);
      if (dateWindow.startDate) params.set("startDate", dateWindow.startDate);
      if (dateWindow.endDate) params.set("endDate", dateWindow.endDate);
      if (selectedUserId !== "all") params.set("userId", selectedUserId);

      const historyParams = new URLSearchParams();
      if (dateWindow.startDate) historyParams.set("startDate", dateWindow.startDate);
      if (dateWindow.endDate) historyParams.set("endDate", dateWindow.endDate);
      historyParams.set("limit", "150");

      const [metricsRes, historyRes, auditRes] = await Promise.all([
        apiFetch(`/api/boards/${boardId}/metrics?${params.toString()}`),
        apiFetch(`/api/boards/${boardId}/state-history?${historyParams.toString()}`),
        apiFetch(`/api/boards/${boardId}/audit-logs?${historyParams.toString()}`),
      ]);

      if (metricsRes.ok) {
        const data = (await metricsRes.json()) as BoardMetricsSummary;
        setMetrics(data);
      }
      if (historyRes.ok) {
        const data = (await historyRes.json()) as { transitions?: StateTransitionHistoryEntry[] };
        setTransitions(Array.isArray(data.transitions) ? data.transitions : []);
      }
      if (auditRes.ok) {
        const data = (await auditRes.json()) as { auditLogs?: SecurityAuditLogRecord[] };
        setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, dateWindow.endDate, dateWindow.startDate, groupBy, selectedUserId]);

  useEffect(() => {
    void loadObservabilityData();
  }, [loadObservabilityData]);

  const maxBucketPoints = useMemo(() => {
    const buckets = metrics?.velocity.buckets ?? [];
    return Math.max(1, ...buckets.map((b) => b.achievedPoints));
  }, [metrics]);

  const maxDwellMs = useMemo(() => {
    const lists = metrics?.cycleAndLeadTime.dwellByList ?? [];
    return Math.max(1, ...lists.map((l) => l.averageDwellMs));
  }, [metrics]);

  const handleExportCsv = () => {
    if (activeAuditTab === "transitions") {
      const csv = formatStateTransitionsCsv(transitions);
      triggerFileDownload(
        `kikiboard-${boardId}-state-transitions.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
    } else {
      const csv = formatSecurityAuditLogsCsv(auditLogs);
      triggerFileDownload(
        `kikiboard-${boardId}-security-audit-logs.csv`,
        csv,
        "text/csv;charset=utf-8",
      );
    }
  };

  const handleExportJson = () => {
    const json = formatIsoObservabilityJsonBundle({
      boardId,
      metrics,
      transitions,
      auditLogs,
    });
    triggerFileDownload(
      `kikiboard-${boardId}-iso27001-observability.json`,
      json,
      "application/json;charset=utf-8",
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-8" data-testid="board-observability-dashboard">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Preset */}
          <div className="flex items-center rounded-lg border border-border/60 bg-background/60 p-0.5 text-xs">
            {(["7d", "30d", "quarter", "all"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreset(item)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  preset === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`preset_${item}`)}
              </button>
            ))}
          </div>

          {/* Group By Interval */}
          <select
            aria-label={t("groupByLabel")}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByInterval)}
            className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
          >
            <option value="day">{t("interval_day")}</option>
            <option value="week">{t("interval_week")}</option>
            <option value="month">{t("interval_month")}</option>
          </select>

          {/* User Filter */}
          <select
            aria-label={t("userFilterLabel")}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="h-8 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
          >
            <option value="all">{t("allUsers")}</option>
            {boardUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 gap-1.5 text-xs">
            <FileSpreadsheet size={14} />
            {t("exportCsv")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} className="h-8 gap-1.5 text-xs">
            <FileJson size={14} />
            {t("exportJson")}
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("kpiAchievedPoints")}</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {metrics?.totals.achievedPoints ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">
              / {metrics?.totals.plannedPoints ?? 0} {t("ptsUnit")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("kpiCompletionRate", { rate: metrics?.totals.completionRate ?? 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("kpiLeadTime")}</span>
            <Clock size={15} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">
            {formatDurationHuman(metrics?.cycleAndLeadTime.leadTime.averageMs)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("kpiMedian", {
              value: formatDurationHuman(metrics?.cycleAndLeadTime.leadTime.medianMs),
            })}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("kpiCycleTime")}</span>
            <Activity size={15} className="text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">
            {formatDurationHuman(metrics?.cycleAndLeadTime.cycleTime.averageMs)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("kpiMedian", {
              value: formatDurationHuman(metrics?.cycleAndLeadTime.cycleTime.medianMs),
            })}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("kpiBottleneck")}</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <div className="mt-2 truncate text-lg font-semibold">
            {metrics?.cycleAndLeadTime.bottleneckListTitle || t("noBottleneck")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("kpiCompletedTasks", {
              done: metrics?.totals.completedTasks ?? 0,
              total: metrics?.totals.totalTasks ?? 0,
            })}
          </p>
        </div>
      </div>

      {/* Velocity & User Achieved Story Points + Column Dwell Time */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Achieved Story Points per User */}
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">{t("achievedByUserTitle")}</h3>
            </div>
            <span className="text-xs text-muted-foreground">{t("snapshotAttributionNote")}</span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("loading")}</p>
          ) : (metrics?.achievedByUser.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("emptyVelocity")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics?.achievedByUser.map((entry) => (
                <div
                  key={entry.userId ?? "__unassigned__"}
                  className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-background/40 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {entry.userName || entry.userEmail || t("unassignedUser")}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {entry.achievedPoints} {t("ptsUnit")} · {entry.completedTasks} {t("tasksUnit")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.buckets.map((b) => (
                      <span
                        key={b.periodKey}
                        className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary tabular-nums"
                      >
                        {b.periodKey}: {b.points} {t("ptsUnit")} ({b.tasks})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Velocity Trend & Burndown + Column Dwell Time */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <h3 className="mb-3 text-sm font-semibold">{t("velocityTrendTitle")}</h3>
            {(metrics?.velocity.buckets.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">{t("emptyVelocity")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {metrics?.velocity.buckets.map((bucket) => {
                  const widthPct = Math.max(
                    6,
                    Math.round((bucket.achievedPoints / maxBucketPoints) * 100),
                  );
                  return (
                    <div key={bucket.periodKey} className="flex items-center gap-3 text-xs">
                      <span className="w-24 shrink-0 font-mono text-[11px] text-muted-foreground">
                        {bucket.periodKey}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right tabular-nums">
                        {bucket.achievedPoints} {t("ptsUnit")} ({bucket.remainingPoints} {t("remainingShort")})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <h3 className="mb-3 text-sm font-semibold">{t("dwellTimeTitle")}</h3>
            {(metrics?.cycleAndLeadTime.dwellByList.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">{t("emptyDwell")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {metrics?.cycleAndLeadTime.dwellByList.map((listStat) => {
                  const widthPct = Math.max(
                    6,
                    Math.round((listStat.averageDwellMs / maxDwellMs) * 100),
                  );
                  return (
                    <div key={listStat.listId} className="flex items-center gap-3 text-xs">
                      <span className="w-28 shrink-0 truncate font-medium">
                        {listStat.listTitle}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            listStat.isBottleneck ? "bg-amber-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right tabular-nums">
                        {formatDurationHuman(listStat.averageDwellMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ISO 27001 Immutable State Transition & Security Audit Trail */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h3 className="text-sm font-semibold">{t("isoAuditTitle")}</h3>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveAuditTab("transitions")}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeAuditTab === "transitions"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabStateTransitions", { count: transitions.length })}
            </button>
            <button
              type="button"
              onClick={() => setActiveAuditTab("security")}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeAuditTab === "security"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tabSecurityAudit", { count: auditLogs.length })}
            </button>
          </div>
        </div>

        {activeAuditTab === "transitions" ? (
          transitions.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {t("emptyTransitions")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("colTimestamp")}</th>
                    <th className="py-2 pr-3 font-medium">{t("colTicket")}</th>
                    <th className="py-2 pr-3 font-medium">{t("colTransition")}</th>
                    <th className="py-2 pr-3 font-medium">{t("colAssigneeSnapshot")}</th>
                    <th className="py-2 pr-3 font-medium">{t("colPointsSnapshot")}</th>
                    <th className="py-2 font-medium">{t("colDwell")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {transitions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-muted/30">
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(tr.transitionedAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                      </td>
                      <td className="py-2 pr-3 font-medium">{tr.taskTitle || tr.taskId}</td>
                      <td className="py-2 pr-3">
                        <span className="text-muted-foreground">
                          {tr.fromListTitle || t("createdInitial")}
                        </span>{" "}
                        → <span className="font-medium">{tr.toListTitle}</span>
                      </td>
                      <td className="py-2 pr-3">
                        {tr.assigneeNameAtMove || tr.assigneeIdAtMove || t("unassignedUser")}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {tr.storyPointsAtMove ?? "—"}
                      </td>
                      <td className="py-2 tabular-nums">
                        {formatDurationHuman(tr.durationMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : auditLogs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{t("emptyAuditLogs")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">{t("colTimestamp")}</th>
                  <th className="py-2 pr-3 font-medium">{t("colAction")}</th>
                  <th className="py-2 pr-3 font-medium">{t("colActor")}</th>
                  <th className="py-2 pr-3 font-medium">{t("colEntity")}</th>
                  <th className="py-2 font-medium">{t("colIpAddress")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                    </td>
                    <td className="py-2 pr-3 font-mono font-medium">{log.action}</td>
                    <td className="py-2 pr-3">{log.actorEmail || log.actorId || "—"}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">
                      {log.entityType}
                      {log.entityId ? ` (${log.entityId})` : ""}
                    </td>
                    <td className="py-2 font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
