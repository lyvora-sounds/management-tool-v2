import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import db from "@/lib/db";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Paperclip,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITIES } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskPriority/TaskPriority.constants";
import { KikiLogo } from "@/components/Shared/KikiLogo/KikiLogo";
import { dateLocale } from "@/i18n/routing";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicTaskSharePage({ params }: Props) {
  const { token } = await params;
  const locale = await getLocale();
  const tShare = await getTranslations("share");
  const tTask = await getTranslations("task");
  const tPriority = await getTranslations("priority");
  const dateFmt = dateLocale(locale);

  const task = await db.task.findUnique({
    where: { shareToken: token },
    include: {
      list: {
        include: {
          board: {
            select: { id: true, title: true, color: true },
          },
        },
      },
      labels: {
        include: { label: true },
      },
      subtasks: {
        orderBy: { order: "asc" },
      },
      epic: true,
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  const priorityMeta = PRIORITIES.find((p) => p.value === task.priority);
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b bg-background/80 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <KikiLogo />
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {tShare("publicView")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>{tShare("readOnly")}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {task.list.board.title}
          </span>
          <span>/</span>
          <span>{task.list.title}</span>
          {task.quarter && (
            <>
              <span>/</span>
              <Badge variant="outline" className="text-[10px] font-medium">
                {task.quarter}
              </Badge>
            </>
          )}
        </div>

        {/* Task Header */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 shrink-0">
              {task.completed ? (
                <CheckCircle2 size={24} className="text-emerald-500" />
              ) : (
                <Circle size={24} className="text-muted-foreground/60" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h1
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.title}
              </h1>

              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Priority */}
                {priorityMeta && (
                  <Badge
                    className="text-xs font-medium"
                    style={{
                      backgroundColor: `${priorityMeta.color}20`,
                      color: priorityMeta.color,
                      borderColor: `${priorityMeta.color}40`,
                    }}
                  >
                    {tPriority(priorityMeta.value)}
                  </Badge>
                )}

                {/* Epic */}
                {task.epic && (
                  <Badge
                    className="text-xs font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: task.epic.color }}
                  >
                    <Layers size={11} />
                    <span>{task.epic.title}</span>
                  </Badge>
                )}

                {/* Labels */}
                {task.labels.map(({ label }) => (
                  <Badge
                    key={label.id}
                    className="text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.title}
                  </Badge>
                ))}

                {/* Dates */}
                {(task.startDate || task.dueDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                    <Calendar size={13} />
                    <span>
                      {task.startDate
                        ? new Date(task.startDate).toLocaleDateString(dateFmt)
                        : ""}{" "}
                      {task.startDate && task.dueDate ? "→ " : ""}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString(dateFmt)
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="pt-4 border-t space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {tTask("description")}
              </h3>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          )}

          {/* Subtasks Checklist */}
          {totalSubtasks > 0 && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {tShare("subtasks", { done: completedSubtasks, total: totalSubtasks })}
                </h3>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {subtaskProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>

              <ul className="space-y-2 pt-1">
                {task.subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center gap-2.5 text-sm rounded-lg p-2 bg-muted/40"
                  >
                    {sub.completed ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="text-muted-foreground/40 shrink-0"
                      />
                    )}
                    <span
                      className={
                        sub.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }
                    >
                      {sub.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip size={13} />
                <span>{tTask("attachmentsCount", { count: task.attachments.length })}</span>
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted transition-colors text-xs"
                  >
                    <span className="truncate font-medium">{att.filename}</span>
                    <span className="text-muted-foreground text-[11px] shrink-0 ml-2">
                      {(att.size / 1024).toFixed(1)} KB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} />
                <span>{tShare("comments", { count: task.comments.length })}</span>
              </h3>
              <div className="space-y-3">
                {task.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {c.user.name || tShare("unknownUser")}
                      </span>
                      <span>
                        {new Date(c.createdAt).toLocaleString(dateFmt)}
                      </span>
                    </div>
                    <div
                      className="prose prose-xs dark:prose-invert max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: c.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center text-xs text-muted-foreground">
        <span>{tShare("organizedWith")} </span>
        <Link
          href="https://kikiboard.xyz"
          target="_blank"
          className="font-semibold text-foreground hover:underline"
        >
          Kikiboard
        </Link>
      </footer>
    </div>
  );
}
