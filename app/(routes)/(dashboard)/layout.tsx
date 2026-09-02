import { auth } from "@clerk/nextjs/server";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard/components/Sidebar";
import { Navbar } from "./dashboard/components/Navbar/Navbar";
import { BoardsStoreInitializer } from "./dashboard/components/BoardsStoreInitializer/BoardsStoreInitializer";
import { OnboardingGuide } from "@/components/Shared/GuidePointer";
import { Suspense } from "react";
import db from "@/lib/db";

export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  const { boards, dbUserId } = await (async () => {
    if (!userId) return { boards: [], dbUserId: "" };
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) return { boards: [], dbUserId: "" };
    const boards = await db.board.findMany({
      where: {
        OR: [
          { userId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return { boards, dbUserId: user.id };
  })();

  return (
    <SidebarProvider>
      <BoardsStoreInitializer boards={boards} ownUserId={dbUserId} />
      <AppSidebar />
      <main className="flex flex-col flex-1 min-h-svh w-full overflow-auto min-w-0">
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
  );
}
