import type { BoardWithOrganization } from "@/store/useBoardsStore";

export type BoardsStoreInitializerProps = {
  boards: BoardWithOrganization[];
  ownUserId: string;
};
