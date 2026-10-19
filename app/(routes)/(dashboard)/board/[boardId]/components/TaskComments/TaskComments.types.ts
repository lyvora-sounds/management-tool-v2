export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; email: string; isAgent?: boolean };
  // Cambio que Kiki aplicó con este comentario; `reverted` = ya se deshizo.
  change?: { id: string; reverted: boolean } | null;
};

export type TaskCommentsProps = {
  taskId: string;
};
