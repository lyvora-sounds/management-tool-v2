import { redirect } from "next/navigation";
import { CreateBoardModal } from "../components/boards/CreateBoardModal/CreateBoardModal";
import { getTranslations } from "next-intl/server";
import { BoardList } from "../components/boards/BoardList/BoardList";
import { apiServerGet } from "@/lib/apiServer";
import type { ApiBoardCard } from "@/lib/api/types";

export default async function BoardsPage() {
  const read = await apiServerGet<ApiBoardCard[]>("/v1/me/boards");
  if (!read.ok) redirect("/sign-in");
  const boards = read.data;

  const t = await getTranslations("boards");

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("totalCount", { count: boards.length })}
          </p>
        </div>
        <CreateBoardModal />
      </div>
      <BoardList boards={boards} />
    </div>
  );
}
