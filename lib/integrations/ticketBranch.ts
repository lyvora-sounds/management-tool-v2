import type { Prisma } from "@/lib/generated/prisma/client";

const MAX_BRANCH_LENGTH = 80;
const SAFE_GIT_REF = /^(?![-/.])(?!.*\.\.)(?!.*\/\/)[A-Za-z0-9._/-]{1,200}$/;

export function isTicketKey(value: string) {
  return /^[A-Z]{2}-\d{5,}$/.test(value);
}

export function formatTicketKey(boardKey: string, number: number) {
  return `${boardKey.toUpperCase()}-${String(number).padStart(5, "0")}`;
}

/** Two letters from the board title. `Lyvora sounds` becomes `LS`. */
export function boardKeyFromTitle(title: string) {
  const words = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);
  const initials = words.map((word) => word[0]).join("");
  const compact = words.join("");
  const source = initials.length >= 2 ? initials : compact;
  if (source.length >= 2) return source.slice(0, 2);
  if (source.length === 1) return `${source}X`;
  return "BD";
}

/** Prefer the title key, then the next free pair in the same organization. */
export function nextBoardKey(preferred: string, taken: Iterable<string>) {
  const used = new Set([...taken].map((key) => key.toUpperCase()));
  const start = /^[A-Z]{2}$/.test(preferred) ? preferred : "BD";
  const origin = (start.charCodeAt(0) - 65) * 26 + (start.charCodeAt(1) - 65);
  for (let step = 0; step < 26 * 26; step += 1) {
    const cursor = (origin + step) % (26 * 26);
    const key = String.fromCharCode(65 + Math.floor(cursor / 26)) + String.fromCharCode(65 + (cursor % 26));
    if (!used.has(key)) return key;
  }
  throw new Error("No board key left");
}

export function branchSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

export function suggestedBranch(ticketKey: string, title: string) {
  const slug = branchSlug(title);
  const name = slug ? `${ticketKey}-${slug}` : ticketKey;
  if (name.length <= MAX_BRANCH_LENGTH) return name;
  return name.slice(0, MAX_BRANCH_LENGTH).replace(/-+$/g, "");
}

export function checkoutCommand(branch: string, baseBranch: string | null) {
  if (!SAFE_GIT_REF.test(branch)) return null;
  if (baseBranch && SAFE_GIT_REF.test(baseBranch)) {
    return `git checkout -b ${branch} origin/${baseBranch}`;
  }
  return `git checkout -b ${branch}`;
}

export function isRepositoryName(value: string) {
  const parts = value.split("/");
  return parts.length === 2 && parts.every((part) => part !== "." && part !== ".." && /^[A-Za-z0-9._-]+$/.test(part));
}

export function githubTreeUrl(repositoryName: string, branch: string) {
  const path = branch.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `https://github.com/${repositoryName}/tree/${path}`;
}

/** A branch belongs to the ticket when it is the key, or the key followed by `-` or `/`. */
export function branchesFromMatchingRefs(body: unknown, ticketKey: string) {
  if (!isTicketKey(ticketKey) || !Array.isArray(body)) return [];
  const prefix = `refs/heads/`;
  const names: string[] = [];
  for (const item of body) {
    if (!item || typeof item !== "object" || !("ref" in item)) continue;
    const ref = (item as { ref: unknown }).ref;
    if (typeof ref !== "string" || !ref.startsWith(prefix)) continue;
    const name = ref.slice(prefix.length);
    const matches = name === ticketKey || name.startsWith(`${ticketKey}-`) || name.startsWith(`${ticketKey}/`);
    if (!matches || name.length === 0 || name.length > 255) continue;
    names.push(name);
  }
  return names;
}

export async function allocateBoardKey(
  tx: Prisma.TransactionClient,
  organizationId: string,
  title: string,
) {
  const existing = await tx.board.findMany({
    where: { organizationId },
    select: { key: true },
  });
  return nextBoardKey(boardKeyFromTitle(title), existing.map((board) => board.key));
}

/** Hands out the next number and advances the board counter in the caller's transaction. */
export async function takeTicketNumber(tx: Prisma.TransactionClient, boardId: string) {
  const board = await tx.board.update({
    where: { id: boardId },
    data: { nextTicketNumber: { increment: 1 } },
    select: { key: true, nextTicketNumber: true },
  });
  const number = board.nextTicketNumber - 1;
  return { number, ticketKey: formatTicketKey(board.key, number) };
}
