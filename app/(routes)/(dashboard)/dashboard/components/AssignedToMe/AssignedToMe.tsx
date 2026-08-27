import Link from "next/link";
import { UserCheck, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "./AssignedToMe.constants";
import { AssignedTask, AssignedToMeProps } from "./AssignedToMe.types";

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  return due.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// Agrupa las tareas por board
function groupByBoard(
  tasks: AssignedTask[],
): { boardId: string; boardTitle: string; tasks: AssignedTask[] }[] {
  const map = new Map<
    string,
    { boardId: string; boardTitle: string; tasks: AssignedTask[] }
  >();
  for (const task of tasks) {
    const { id, title } = task.list.board;
    if (!map.has(id))
      map.set(id, { boardId: id, boardTitle: title, tasks: [] });
    map.get(id)!.tasks.push(task);
  }
  return Array.from(map.values());
}

export function AssignedToMe({ tasks }: AssignedToMeProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Asignado a mí</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4">
          <UserCheck size={16} className="shrink-0" />
          <span>No tienes tareas asignadas en ningún board</span>
        </div>
      </div>
    );
  }

  const groups = groupByBoard(tasks);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Asignado a mí</h2>
        <Badge variant="secondary">
          {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.boardId} className="flex flex-col gap-1.5">
            <Link
              href={`/board/${group.boardId}`}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors w-fit"
            >
              {group.boardTitle}
            </Link>
            <div className="flex flex-col gap-1.5">
              {group.tasks.map((task) => {
                const overdue = isOverdue(task.dueDate) && !task.completed;
                return (
                  <Link
                    key={task.id}
                    href={`/board/${task.list.board.id}?taskId=${task.id}`}
                    className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 hover:bg-muted/50 hover:border-primary/40 transition-colors group cursor-pointer"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {task.completed ? (
                        <CheckCircle2 size={15} className="text-primary" />
                      ) : overdue ? (
                        <AlertCircle size={15} className="text-destructive" />
                      ) : (
                        <Circle size={15} />
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.list.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority && PRIORITY_COLOR[task.priority] && (
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}
                          />
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {PRIORITY_LABEL[task.priority]}
                          </span>
                        </span>
                      )}
                      {task.dueDate && (
                        <Badge
                          variant={overdue ? "destructive" : "secondary"}
                          className="text-xs tabular-nums"
                        >
                          {formatDueDate(task.dueDate)}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
