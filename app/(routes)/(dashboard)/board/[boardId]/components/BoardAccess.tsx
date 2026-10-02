"use client";

import { createContext, useContext } from "react";

type BoardAccessValue = {
  canEdit: boolean;
};

const BoardAccessContext = createContext<BoardAccessValue>({ canEdit: false });

export function BoardAccessProvider({
  canEdit,
  children,
}: BoardAccessValue & { children: React.ReactNode }) {
  return <BoardAccessContext.Provider value={{ canEdit }}>{children}</BoardAccessContext.Provider>;
}

export function useBoardAccess() {
  return useContext(BoardAccessContext);
}
