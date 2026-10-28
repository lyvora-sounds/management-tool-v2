/** Private ticket URL. It is derived from the board and ticket ids, never minted. */
export function privateTicketUrl(origin: string, boardId: string, taskId: string) {
  const url = new URL(`/board/${boardId}`, origin);
  url.searchParams.set("taskId", taskId);
  return url.toString();
}

/** Signed-in visitors who cannot read a board land here. Missing boards use the same path. */
export const ACCESS_DENIED_HREF = "/dashboard?access=denied";

export function isAccessDeniedAccess(access: string | string[] | undefined) {
  return access === "denied";
}
