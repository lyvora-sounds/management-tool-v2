import { currentUser } from "@clerk/nextjs/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarRoutes } from "../SidebarRoutes/SidebarRoutes";
import { SidebarUserFooter } from "../SidebarUserFooter/SidebarUserFooter";
import { SidebarLogo } from "../SidebarLogo/SidebarLogo";

export async function AppSidebar() {
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    user = await currentUser();
  } catch {
    // Clerk error — render sidebar without user info
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-3 border-b">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarRoutes />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        {user && (
          <SidebarUserFooter
            name={user.fullName}
            email={user.emailAddresses[0]?.emailAddress ?? ""}
            imageUrl={user.imageUrl ?? null}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
