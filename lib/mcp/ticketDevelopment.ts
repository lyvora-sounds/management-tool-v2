import {
  checkoutCommand,
  formatTicketKey,
  suggestedBranch as buildSuggestedBranch,
} from "@/lib/integrations/ticketBranch";
import {
  ISO_PR_DESCRIPTION_INSTRUCTION,
  ISO_PR_DESCRIPTION_TEMPLATE,
} from "./prDescriptionTemplate";

export const MCP_SERVER_INSTRUCTIONS = [
  "When implementing a Kikiboard ticket, call get_ticket first and read development.",
  "Git branch name and PR head MUST equal development.suggestedBranch. Do not invent feat/... names when suggestedBranch is present.",
  "PR title defaults to the ticket title.",
  ISO_PR_DESCRIPTION_INSTRUCTION,
  "Use development.prDescriptionTemplate as the PR body skeleton and fill every section.",
  "After the pull request is created, the next chat message MUST include the PR URL as a clickable link. Do not finish the turn without that URL.",
  "Move the ticket with update_tickets listId as work changes. List titles differ by board, so call get_project and match the board's lists by meaning, never by a fixed English name.",
  "Starting work: move to the in-progress list (titles like In progress, Doing, En progreso, En curso, Desarrollo).",
  "Pull request open for review: move to the review list (titles like To Review, Code review, Revisión, QA).",
  "Merged or finished: move to the done list (titles like Done, Hecho, Completado) and set completed true.",
  "If no list matches that meaning, ask the user which list to use. Do not create a list.",
  "list_tickets returns newest created first (createdAt descending) and includes createdAt on each summary.",
].join(" ");

type BoardForDevelopment = {
  key: string;
  organization?: {
    githubConnection?: { branch: string | null } | null;
  } | null;
};

export function ticketDevelopment(task: {
  title: string;
  number?: number | null;
  list: { board: Partial<BoardForDevelopment> & { key?: string } };
}) {
  if (typeof task.number !== "number" || typeof task.list.board.key !== "string" || !task.list.board.key) {
    return null;
  }
  const ticketKey = formatTicketKey(task.list.board.key, task.number);
  const suggestedBranch = buildSuggestedBranch(ticketKey, task.title);
  const baseBranch = task.list.board.organization?.githubConnection?.branch ?? null;
  return {
    ticketKey,
    suggestedBranch,
    command: checkoutCommand(suggestedBranch, baseBranch),
    baseBranch,
    prDescriptionTemplate: ISO_PR_DESCRIPTION_TEMPLATE,
  };
}
