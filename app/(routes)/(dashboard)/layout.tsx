import { auth } from "@clerk/nextjs/server";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard/components/Sidebar";
import { Navbar } from "./dashboard/components/Navbar/Navbar";
import { BoardsStoreInitializer } from "./dashboard/components/BoardsStoreInitializer/BoardsStoreInitializer";
import { OnboardingGuide } from "@/components/Shared/GuidePointer";
import { Suspense } from "react";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";
import { AppearanceProvider } from "@/components/Appearance/AppearanceProvider";

export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  const { boards, dbUserId, appearance } = await (async () => {
    if (!userId) return { boards: [], dbUserId: "", appearance: null };
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { settings: { select: { appearance: true } } },
    });
    if (!user) return { boards: [], dbUserId: "", appearance: null };
    const boards = await db.board.findMany({
      where: readableBoardWhere(user.id),
      orderBy: { createdAt: "desc" },
      include: { organization: { select: { id: true, name: true } } },
    });
    return {
      boards,
      dbUserId: user.id,
      appearance: user.settings?.appearance ?? null,
    };
  })();

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
