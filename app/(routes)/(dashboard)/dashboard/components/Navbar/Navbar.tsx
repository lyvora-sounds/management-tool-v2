import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import { GlobalSearch } from "../GlobalSearch/GlobalSearch";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";

export function Navbar() {
  return (
    <header className="flex items-center h-14 px-3 sm:px-4 border-b shrink-0 gap-2">
      <SidebarTrigger className="shrink-0" />
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <LanguageSwitcher />
        <NotificationBell />
      </div>
    </header>
  );
}

