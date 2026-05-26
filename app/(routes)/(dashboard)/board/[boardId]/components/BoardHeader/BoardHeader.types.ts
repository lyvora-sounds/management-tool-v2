import type { BoardLink } from "@/app/api/boards/[boardId]/links/route";

export type BoardHeaderProps = {
  boardId: string;
  title: string;
  isOwner: boolean;
  initialLinks: BoardLink[];
  memberCanAssign: boolean;
};
