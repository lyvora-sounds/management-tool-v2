import type { ApiBoardLink as BoardLink } from "@/lib/api/types";

export interface BoardLinksProps {
  boardId: string;
  isOwner: boolean;
  initialLinks: BoardLink[];
}
