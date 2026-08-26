import { currentUser } from "@clerk/nextjs/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarRoutes } from "../SidebarRoutes/SidebarRoutes";
import { SidebarItem } from "../SidebarRoutes/SidebarItem/SidebarItem";
import { settingsRoute } from "../SidebarRoutes/SidebarRoutes.data";
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
        {/* Un único grupo con padding propio: los grupos vacíos que había
            antes solo añadían 16px muertos sobre "Dashboard", y dejaban la
            navegación desalineada respecto al pie. */}
        <SidebarGroup>
          <SidebarRoutes />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t gap-1">
        <SidebarItem item={settingsRoute} />
        {/* Separa Ajustes del bloque de usuario: llevan al mismo sitio y
            pegados se leían como un único botón. */}
        {user && <SidebarSeparator className="my-1" />}
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
