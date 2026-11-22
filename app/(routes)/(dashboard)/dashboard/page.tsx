import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { apiServerGet } from "@/lib/apiServer";
import type { ApiDashboard } from "@/lib/api/types";
import { CreateBoardModal } from "./components/boards/CreateBoardModal/CreateBoardModal";
import { DashboardStats } from "./components/DashboardStats/DashboardStats";
import { UpcomingTasks } from "./components/UpcomingTasks/UpcomingTasks";
import { RecentActivity } from "./components/RecentActivity/RecentActivity";
import { AssignedToMe } from "./components/AssignedToMe/AssignedToMe";
import { RecentBoards } from "./components/RecentBoards/RecentBoards";
import { GlobalProgress } from "./components/GlobalProgress/GlobalProgress";
import { WeeklyActivity } from "./components/WeeklyActivity/WeeklyActivity";
import { PriorityBreakdownChart } from "./components/PriorityBreakdownChart/PriorityBreakdownChart";
import { Greeting } from "./components/Greeting/Greeting";
import { OnboardingChecklist } from "./components/OnboardingChecklist/OnboardingChecklist";
import { AccessDeniedNotice } from "./components/AccessDeniedNotice/AccessDeniedNotice";
import { isAccessDeniedAccess } from "@/lib/ticketShare";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { access } = await searchParams;

  const read = await apiServerGet<ApiDashboard>("/v1/me/dashboard");
  if (!read.ok) {
    const tDash = await getTranslations("dashboard");
    const tCommon = await getTranslations("common");
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-sm font-medium">{tDash("unavailable")}</p>
        <p className="text-xs text-muted-foreground">{tDash("unavailableHint")}</p>
        <a href="/dashboard" className="text-xs underline text-muted-foreground hover:text-foreground">
          {tCommon("retry")}
        </a>
      </div>
    );
  }

  const {
    boards,
    totalTasks,
    totalPending,
    overdue,
    completedThisWeek,
    upcomingTasks,
    recentActivity,
    assignedTasks,
    priorityCounts,
    onboarding,
  } = read.data;
  const user = { id: read.data.userId, name: read.data.userName };
  const completedLast7 = read.data.completedLast7.map((at) => new Date(at));

  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 6);
  last7Days.setHours(0, 0, 0, 0);

  // Formatear fecha en zona local (YYYY-MM-DD) sin conversión UTC
  const toLocalKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Construir array de los últimos 7 días con conteo de completadas
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(last7Days);
    d.setDate(last7Days.getDate() + i);
    const key = toLocalKey(d);
    const count = completedLast7.filter((completedAt) => toLocalKey(completedAt) === key).length;
    return { date: key, count };
  });

  const tBoards = await getTranslations("boards");

  // Se deja de mostrar cuando el usuario la cierra y cuando ya no queda nada
  // por hacer: enseñar cinco checks verdes para siempre no ayuda a nadie.
  const showOnboarding = !onboarding.dismissed && !onboarding.isComplete;

  return (
    <div className="p-3 sm:p-6 flex flex-col gap-6">
      {isAccessDeniedAccess(access) && <AccessDeniedNotice />}
      <Greeting name={user.name} />

      {showOnboarding && (
        <OnboardingChecklist state={onboarding} firstBoardId={boards[0]?.id} />
      )}

      <DashboardStats
        totalPending={totalPending}
        overdue={overdue}
        completedThisWeek={completedThisWeek}
        totalBoards={boards.length}
      />

      <GlobalProgress
        totalTasks={totalTasks}
        completedTasks={totalTasks - totalPending}
        completedThisWeek={completedThisWeek}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriorityBreakdownChart counts={priorityCounts} />
        <WeeklyActivity days={weeklyDays} />
      </div>

      <UpcomingTasks tasks={upcomingTasks} />

      <RecentActivity logs={recentActivity} />

      <AssignedToMe tasks={assignedTasks} userId={user.id} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">{tBoards("myBoards")}</h2>
          <CreateBoardModal />
        </div>
        <RecentBoards boards={boards} />
      </div>
    </div>
  );
}
