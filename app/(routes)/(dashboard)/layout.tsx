import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard/components/Sidebar";
import { Navbar } from "./dashboard/components/Navbar/Navbar";
import { BoardsStoreInitializer } from "./dashboard/components/BoardsStoreInitializer/BoardsStoreInitializer";
import { OnboardingGuide } from "@/components/Shared/GuidePointer";
import { Suspense } from "react";
import { AppearanceProvider } from "@/components/Appearance/AppearanceProvider";
import { apiServerGet } from "@/lib/apiServer";
import { boardFromApi } from "@/lib/api/boards";
import type { ApiWorkspace } from "@/lib/api/types";

export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nobody signed in (or no user row yet): the shell renders empty and the page decides what to do.
  const read = await apiServerGet<ApiWorkspace>("/v1/me/workspace", { dates: "keep" });
  const { boards, dbUserId, appearance } = read.ok
    ? {
        boards: read.data.boards.map((board) => ({ ...boardFromApi(board), organization: board.organization })),
        dbUserId: read.data.userId,
        appearance: read.data.appearance,
      }
    : { boards: [], dbUserId: "", appearance: null };

  return (
    <AppearanceProvider initial={appearance}>
    <SidebarProvider className="workspace-theme">
      <BoardsStoreInitializer boards={boards} ownUserId={dbUserId} />
      <AppSidebar />
      <main className="workspace-background flex flex-col flex-1 min-h-svh w-full overflow-auto min-w-0">
        <Navbar />
        {children}
      </main>
      {/* Señala el control del paso que traiga `?guide=` en la URL. Va aquí y
          no en cada página porque los pasos apuntan a sitios distintos.
          Suspense porque useSearchParams obliga a un límite de suspensión. */}
      <Suspense fallback={null}>
        <OnboardingGuide />
      </Suspense>
    </SidebarProvider>
    </AppearanceProvider>
  );
}
