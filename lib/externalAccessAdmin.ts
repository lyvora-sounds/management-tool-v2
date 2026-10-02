import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";

export async function requireExternalAccessAdmin(boardId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!(await isBoardAdmin(userId, boardId))) {
    return {
      response: NextResponse.json(
        { error: "Only board admins can manage external access" },
        { status: 403 },
      ),
    };
  }
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
