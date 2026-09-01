import {
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DashboardStatsProps, StatCardProps } from "./DashboardStats.types";

function StatCard({ icon, label, value, variant = "default" }: StatCardProps) {
  const iconColor = {
    default: "text-primary",
    danger: "text-destructive",
    success: "text-emerald-500",
    muted: "text-muted-foreground",
  }[variant];

  const bgColor = {
    default: "bg-primary/10",
    danger: "bg-destructive/10",
    success: "bg-emerald-500/10",
    muted: "bg-muted",
  }[variant];

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <div className={`rounded-lg p-2.5 shrink-0 ${bgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

export async function DashboardStats({
  totalPending,
  overdue,
  completedThisWeek,
  totalBoards,
}: DashboardStatsProps) {
  const t = await getTranslations("dashboard");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon={<Clock size={20} />}
        label={t("pendingTasks")}
        value={totalPending}
        variant="default"
      />
      <StatCard
        icon={<AlertCircle size={20} />}
        label={t("overdue")}
        value={overdue}
        variant={overdue > 0 ? "danger" : "muted"}
      />
      <StatCard
        icon={<CheckCircle2 size={20} />}
        label={t("completedThisWeek")}
        value={completedThisWeek}
        variant="success"
      />
      <StatCard
        icon={<LayoutDashboard size={20} />}
        label={t("activeBoards")}
        value={totalBoards}
        variant="muted"
      />
    </div>
  );
}
