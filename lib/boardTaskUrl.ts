/** Keep ticket detail open across list moves by owning it via the board URL. */
export function boardTaskHref(
  pathname: string,
  searchParams: { toString(): string } | URLSearchParams,
  taskId: string | null,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (taskId) params.set("taskId", taskId);
  else params.delete("taskId");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
