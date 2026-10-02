import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ boardId: string; tokenId: string }> },
) {
  const { boardId, tokenId } = await params;
  const { userId } = await auth();
  if (!userId || !(await isBoardAdmin(userId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await db.externalAccessToken.updateMany({
    where: { id: tokenId, boardId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
