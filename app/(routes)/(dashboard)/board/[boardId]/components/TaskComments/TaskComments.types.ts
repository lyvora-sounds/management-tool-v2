export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; email: string; isAgent?: boolean };
  // Cambio que Kiki aplicó con este comentario; `reverted` = ya se deshizo.
  change?: { id: string; reverted: boolean } | null;
  // Sugerencia de triage; `pending` = aún sin aplicar.
  suggestion?: { pending: boolean } | null;
};

export type TaskCommentsProps = {
  taskId: string;
  // Personas del tablero que se pueden mencionar con «@».
  members?: { id: string; name: string | null; email: string }[];
};
