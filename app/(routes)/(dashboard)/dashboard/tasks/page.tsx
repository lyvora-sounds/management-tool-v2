import { redirect } from "next/navigation";
import { MyTasksView } from "./components/MyTasksView";
import { apiServerGet } from "@/lib/apiServer";
import type { ApiMyTasks } from "@/lib/api/types";

export default async function MyTasksPage() {
  const read = await apiServerGet<ApiMyTasks>("/v1/me/tasks");
  if (!read.ok) redirect("/sign-in");
  const { userId, boards, tasks } = read.data;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <MyTasksView
        initialTasks={tasks}
        userId={userId}
        boards={boards}
      />
    </div>
  );
}
