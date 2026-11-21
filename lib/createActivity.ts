import db from "@/lib/db";
import { encodeLogMessage, type ActivityTicketRef, type LogParams } from "@/lib/activityMessages";

export async function createActivity({
  type,
  boardId,
  userId,
  key,
  params = {},
  refs,
}: {
  type: string;
  boardId: string;
  userId: string;
  key: string;
  params?: LogParams;
  refs?: ActivityTicketRef[];
}) {
  await db.activityLog.create({
    data: {
      type,
      message: encodeLogMessage(key, params, refs),
      boardId,
      userId,
    },
  });
}
