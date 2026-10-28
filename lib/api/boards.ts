import type { BoardModel } from "@/lib/generated/prisma/models/Board";
import type { ApiBoard } from "./types";

/**
 * A board as the API sends it, in the shape the boards store holds. Dates become Date objects.
 *
 * The API never sends the Slack and Discord webhook URLs, so they are null here: nothing in the browser may
 * rely on them. Reading each field by name is what makes a change in the API's board fail the build.
 */
export function boardFromApi(board: ApiBoard): BoardModel {
  return {
    id: board.id,
    title: board.title,
    description: board.description,
    color: board.color,
    links: board.links,
    memberCanAssign: board.memberCanAssign,
    kikiMode: board.kikiMode,
    kikiTriage: board.kikiTriage,
    accessMode: board.accessMode,
    defaultRole: board.defaultRole,
    slackWebhookUrl: null,
    discordWebhookUrl: null,
    notifyOnTaskCreated: board.notifyOnTaskCreated,
    notifyOnTaskCompleted: board.notifyOnTaskCompleted,
    notifyOnTaskMoved: board.notifyOnTaskMoved,
    userId: board.userId,
    organizationId: board.organizationId,
    createdAt: new Date(board.createdAt),
    updatedAt: new Date(board.updatedAt),
  };
}
