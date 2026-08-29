import Link from "next/link";
import { CalendarDays, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UpcomingTasksProps } from "./UpcomingTasks.types";
import { PRIORITY_COLOR } from "./UpcomingTasks.constants";

function formatDueDate(date: Date): { label: string; overdue: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0)
    return { label: `Venció hace ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: "Hoy", overdue: false };
  if (diffDays === 1) return { label: "Mañana", overdue: false };
  return {
    label: due.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    overdue: false,
  };
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tareas próximas</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4">
          <CalendarDays size={16} className="shrink-0" />
          <span>Sin tareas con vencimiento en los próximos 7 días</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tareas próximas</h2>
        <span className="text-xs text-muted-foreground">próximos 7 días</span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          if (!task.dueDate) return null;
          const { label, overdue } = formatDueDate(task.dueDate);
          return (
            <Link
              key={task.id}
              href={`/board/${task.list.board.id}?taskId=${task.id}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50 hover:border-primary/40 transition-colors group cursor-pointer"
            >
              <span className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                {task.completed ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : overdue ? (
                  <AlertCircle size={16} className="text-destructive" />
                ) : (
                  <Circle size={16} />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {task.list.board.title} · {task.list.title}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.priority && PRIORITY_COLOR[task.priority] && (
                  <span
                    className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[task.priority]}`}
                  />
                )}
                <Badge
                  variant={overdue ? "destructive" : "secondary"}
                  className="text-xs tabular-nums"
                >
                  {label}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
