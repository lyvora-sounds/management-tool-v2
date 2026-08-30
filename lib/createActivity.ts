import db from "@/lib/db";
import { encodeLogMessage, type LogParams } from "@/lib/activityMessages";

export async function createActivity({
  type,
  boardId,
  userId,
  key,
  params = {},
}: {
  type: string;
  boardId: string;
  userId: string;
  key: string;
  params?: LogParams;
}) {
  await db.activityLog.create({
    data: {
      type,
      message: encodeLogMessage(key, params),
      boardId,
      userId,
    },
  });
}
