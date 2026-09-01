"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart2,
  Tags,
  CalendarIcon,
  CheckCircle2,
  Circle,
  ListChecks,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { AnimatedList } from "@/components/ui/animated-list";
import {
  tasks,
  notifications,
  members,
  bars,
  labels,
  highlighted,
  subtasks,
} from "./BentoSection.data";
import { Reveal } from "@/components/Shared/Reveal/Reveal";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// ── Kanban background — Marquee of task cards ──────────────────────────────

function TaskCard({
  title,
  list,
  done,
}: {
  title: string;
  list: string;
  done: boolean;
}) {
  return (
    <figure
      className={cn(
        "relative w-44 cursor-pointer overflow-hidden rounded-xl border p-3",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none",
      )}
    >
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 size={13} className="text-primary shrink-0" />
        ) : (
          <Circle size={13} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-medium truncate">{title}</span>
      </div>
      <span className="mt-1 block text-[10px] text-muted-foreground">
        {list}
      </span>
    </figure>
  );
}

function KanbanBackground() {
  const t = useTranslations("bentoDemo");

  return (
    <>
      <Marquee
        className="absolute top-10 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] [--duration:25s]"
      >
        {tasks.map((task, i) => (
          <TaskCard key={i} title={t(task.title)} list={t(task.list)} done={task.done} />
        ))}
      </Marquee>
      <Marquee
        reverse
        className="absolute bottom-35 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] [--duration:25s]"
      >
        {tasks.map((task, i) => (
          <TaskCard key={i} title={t(task.title)} list={t(task.list)} done={task.done} />
        ))}
      </Marquee>
    </>
  );
}

// ── Notifications background — AnimatedList ────────────────────────────────

function NotifItem({
  icon,
  msg,
  time,
}: {
  icon: React.ReactNode;
  msg: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 w-64 shadow-sm">
      <span className="text-primary shrink-0">{icon}</span>
      <span className="text-xs flex-1 truncate">{msg}</span>
      <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}

function NotificationsBackground() {
  const t = useTranslations("bentoDemo");

  return (
    <AnimatedList
      delay={1500}
      className="absolute top-4 left-2 h-[280px] w-full scale-90 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-95"
    >
      {notifications.map((n, i) => (
        <NotifItem key={i} icon={n.icon} msg={t(n.msg)} time={t(n.time)} />
      ))}
    </AnimatedList>
  );
}

// ── Team background — avatars ──────────────────────────────────────────────

function TeamBackground() {
  const t = useTranslations("home");

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-40 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]">
      <div className="flex -space-x-3">
        {members.map((m) => (
          <div
            key={m.name}
            className={`w-12 h-12 rounded-full ${m.color} flex items-center justify-center text-white font-bold text-lg border-2 border-background`}
          >
            {m.name[0]}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 w-48">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5"
          >
            <div className={`w-2 h-2 rounded-full ${m.color}`} />
            <span className="text-xs">{t("bentoMemberTasks", { name: m.name })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress background — bar chart ───────────────────────────────────────
const MAX_BAR_PX = 80;

function ProgressBackground() {
  const t = useTranslations("home");
  const tDays = useTranslations("weekdays");

  return (
    <div className="absolute inset-x-6 top-8 bottom-20 flex flex-col justify-end gap-3 [mask-image:linear-gradient(to_top,transparent_10%,#000_70%)]">
      {/* mini stats row */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>{t("bentoThisWeek")}</span>
        <span className="text-primary font-semibold">{t("bentoCompletedCount")}</span>
      </div>
      {/* bars */}
      <div className="flex items-end gap-1.5" style={{ height: MAX_BAR_PX }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-primary/80"
            style={{ height: `${Math.round((h / 100) * MAX_BAR_PX)}px` }}
          />
        ))}
      </div>
      {/* day labels */}
      <div className="flex gap-1.5">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="flex-1 text-center text-[9px] text-muted-foreground"
          >
            {tDays(d)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Labels background — Marquee of tags ───────────────────────────────────

function LabelsBackground() {
  const t = useTranslations("bentoDemo");

  return (
    <div className="absolute inset-0 flex flex-col gap-2 justify-center px-4 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]">
      <Marquee pauseOnHover className="[--duration:15s]">
        {labels.slice(0, 4).map(({ text, color }) => (
          <span
            key={text}
            className={`rounded-full px-3 py-1 text-xs text-white font-medium ${color} opacity-60`}
          >
            {t(text)}
          </span>
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:15s]">
        {labels.slice(4).map(({ text, color }) => (
          <span
            key={text}
            className={`rounded-full px-3 py-1 text-xs text-white font-medium ${color} opacity-60`}
          >
            {t(text)}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

// ── Subtasks background ───────────────────────────────────────────────────

function SubtasksBackground() {
  const t = useTranslations("bentoDemo");

  return (
    <div className="absolute inset-x-4 top-8 bottom-20 flex flex-col gap-2 scale-90 transition-all duration-300 ease-out group-hover:scale-95 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]">
      <div className="text-[10px] text-muted-foreground mb-1">
        {t("subtasksProgress", { done: 2, total: 5 })}
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: "40%" }}
        />
      </div>
      {subtasks.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
        >
          {s.done ? (
            <CheckCircle2 size={13} className="text-primary shrink-0" />
          ) : (
            <Circle size={13} className="text-muted-foreground shrink-0" />
          )}
          <span
            className={`text-xs truncate ${s.done ? "line-through text-muted-foreground" : ""}`}
          >
            {t(s.label)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Calendar background ───────────────────────────────────────────────────
const calDays = Array.from({ length: 31 }, (_, i) => i);

function CalendarBackground() {
  const tDays = useTranslations("weekdays");

  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-5 [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] opacity-50 transition-all duration-300 ease-out group-hover:opacity-70">
      <div className="grid grid-cols-7 gap-1 text-[9px] text-muted-foreground text-center mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d}>{tDays(d)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((i) => (
          <div
            key={i}
            className={cn(
              "h-8 rounded-md flex items-center justify-center text-[10px]",
              highlighted.includes(i)
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted",
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BentoSection() {
  const t = useTranslations("home");

  const features = [
    {
      Icon: LayoutDashboard,
      name: t("bentoKanbanName"),
      description: t("bentoKanbanDesc"),
      href: "/sign-up",
      cta: t("bentoKanbanCta"),
      className: "col-span-3 lg:col-span-2",
      background: <KanbanBackground />,
    },
    {
      Icon: Bell,
      name: t("bentoNotifName"),
      description: t("bentoNotifDesc"),
      href: "/sign-up",
      cta: t("bentoNotifCta"),
      className: "col-span-3 lg:col-span-1",
      background: <NotificationsBackground />,
    },
    {
      Icon: Users,
      name: t("bentoTeamName"),
      description: t("bentoTeamDesc"),
      href: "/sign-up",
      cta: t("bentoTeamCta"),
      className: "col-span-3 lg:col-span-1",
      background: <TeamBackground />,
    },
    {
      Icon: Tags,
      name: t("bentoTagsName"),
      description: t("bentoTagsDesc"),
      href: "/sign-up",
      cta: t("bentoTagsCta"),
      className: "col-span-3 lg:col-span-1",
      background: <LabelsBackground />,
    },
    {
      Icon: BarChart2,
      name: t("bentoProgressName"),
      description: t("bentoProgressDesc"),
      href: "/sign-up",
      cta: t("bentoProgressCta"),
      className: "col-span-3 lg:col-span-1",
      background: <ProgressBackground />,
    },
    {
      Icon: ListChecks,
      name: t("bentoSubtasksName"),
      description: t("bentoSubtasksDesc"),
      href: "/sign-up",
      cta: t("bentoSubtasksCta"),
      className: "col-span-3 lg:col-span-1",
      background: <SubtasksBackground />,
    },
    {
      Icon: CalendarIcon,
      name: t("bentoCalendarName"),
      description: t("bentoCalendarDesc"),
      href: "/sign-up",
      cta: t("bentoCalendarCta"),
      className: "col-span-3 lg:col-span-2",
      background: <CalendarBackground />,
    },
  ];

  return (
    <Reveal position="right" className="px-4 sm:px-8 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          {t("bentoHeading")}
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          {t("bentoSubtitle")}
        </p>
      </div>
      <BentoGrid>
        {features.map((f) => (
          <BentoCard key={f.name} {...f} />
        ))}
      </BentoGrid>
    </Reveal>
  );
}
