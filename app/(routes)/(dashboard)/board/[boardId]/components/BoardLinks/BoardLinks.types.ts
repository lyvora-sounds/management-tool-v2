import type { ApiBoardLink as BoardLink } from "@/lib/api/types";

export interface BoardLinksProps {
  boardId: string;
  isOwner: boolean;
  initialLinks: BoardLink[];
  /** Controlled open state when opened from the Board menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When false, only the popover content is rendered (no toolbar button). */
  showTrigger?: boolean;
  onLinksChange?: (count: number) => void;
}
