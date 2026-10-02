import { create } from "zustand";
import type { BoardModel } from "@/lib/generated/prisma/models/Board";

export type BoardWithOrganization = BoardModel & {
  organization?: { id: string; name: string } | null;
};

type BoardsState = {
  boards: BoardWithOrganization[];
  ownUserId: string | null;
  setBoards: (boards: BoardWithOrganization[], ownUserId: string) => void;
  addBoard: (board: BoardWithOrganization) => void;
  removeBoard: (boardId: string) => void;
  renameBoard: (boardId: string, title: string) => void;
};

export const useBoardsStore = create<BoardsState>((set) => ({
  boards: [],
  ownUserId: null,
  setBoards: (boards, ownUserId) => set({ boards, ownUserId }),
  addBoard: (board) => set((state) => ({ boards: [board, ...state.boards] })),
  removeBoard: (boardId) =>
    set((state) => ({ boards: state.boards.filter((b) => b.id !== boardId) })),
  renameBoard: (boardId, title) =>
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? { ...b, title } : b)),
    })),
}));
