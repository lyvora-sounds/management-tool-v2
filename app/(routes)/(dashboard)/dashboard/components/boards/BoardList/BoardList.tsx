import { LayoutDashboard, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { BoardCard } from "./BoardCard";
import { BoardListProps } from "./BoardList.types";

function EmptySection({ shared }: { shared?: boolean }) {
  const t = useTranslations("boards");
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center gap-2">
      {shared ? (
        <Users size={24} className="text-muted-foreground" />
      ) : (
        <LayoutDashboard size={24} className="text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground">
        {shared ? t("emptyShared") : t("emptyOwn")}
      </p>
    </div>
  );
}

function BoardGrid({ boards }: { boards: BoardListProps["boards"] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}

export function BoardList({ boards }: BoardListProps) {
  const t = useTranslations("boards");
  const ownBoards = boards.filter((b) => b.isOwner);
  const sharedBoards = boards.filter((b) => !b.isOwner);

  if (boards.length === 0) {
    return <EmptySection />;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("myBoards")}
          </h2>
          <span className="text-xs text-muted-foreground">({ownBoards.length})</span>
        </div>
        {ownBoards.length > 0 ? <BoardGrid boards={ownBoards} /> : <EmptySection />}
      </section>

      {sharedBoards.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("sharedWithMe")}
            </h2>
            <span className="text-xs text-muted-foreground">({sharedBoards.length})</span>
          </div>
          <BoardGrid boards={sharedBoards} />
        </section>
      )}
    </div>
  );
}
