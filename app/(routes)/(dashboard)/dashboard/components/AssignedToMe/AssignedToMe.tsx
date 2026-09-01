"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { isDoneList } from "@/lib/statusTheme";
import { useTranslations } from "next-intl";
import { AssignedTask, AssignedToMeProps } from "./AssignedToMe.types";
import { DashboardTaskRow } from "../DashboardTaskRow/DashboardTaskRow";

function groupByBoard(tasks: AssignedTask[]) {
  const map = new Map<
    string,
    {
      boardId: string;
      boardTitle: string;
      tasks: AssignedTask[];
    }
  >();

  for (const task of tasks) {
    const { id, title } = task.list.board;
    if (!map.has(id)) {
      map.set(id, { boardId: id, boardTitle: title, tasks: [] });
    }
    map.get(id)!.tasks.push(task);
  }

  return Array.from(map.values());
}

export function AssignedToMe({ tasks: initialTasks, userId }: AssignedToMeProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [tasks, setTasks] = useState<AssignedTask[]>(initialTasks);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleStatusChange = async (task: AssignedTask, targetListId: string) => {
    const nextTitle = task.list.board.list?.find((l) => l.id === targetListId)?.title;
    if (!nextTitle || targetListId === task.list.id) return;

    const prevTask = { ...task };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: isDoneList(nextTitle),
              list: { ...t.list, id: targetListId, title: nextTitle },
            }
          : t,
      ),
    );

    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/updateTask/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: targetListId }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(t("statusChanged", { title: nextTitle }));
    } catch {
      setTasks((prev) => prev.map((item) => (item.id === task.id ? prevTask : item)));
      toast.error(t("statusUpdateError"));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("assignedToMe")}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border p-4 bg-card">
          <UserCheck size={16} className="shrink-0" />
          <span>{t("noAssigned")}</span>
        </div>
      </div>
    );
  }

  const groups = groupByBoard(tasks);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("assignedToMe")}</h2>
        <Badge variant="secondary">
          {t("taskCount", { count: tasks.length })}
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
              {group.tasks.map((task) => (
                <DashboardTaskRow
                  key={task.id}
                  task={task}
                  isAssignee={task.assigneeId === userId}
                  isCollab={Boolean(task.collaborators?.some((c) => c.userId === userId))}
                  isQa={task.qaId === userId}
                  lists={task.list.board.list ?? []}
                  updating={updatingTaskId === task.id}
                  onOpen={() =>
                    router.push(`/board/${task.list.board.id}?taskId=${task.id}`)
                  }
                  onOpenBoard={() => router.push(`/board/${task.list.board.id}`)}
                  onStatusChange={(listId) => handleStatusChange(task, listId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
