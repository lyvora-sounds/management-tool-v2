import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireExternalAccessAdmin } from "@/lib/externalAccessAdmin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ boardId: string; tokenId: string }> },
) {
  const { boardId, tokenId } = await params;
  const admin = await requireExternalAccessAdmin(boardId);
  if ("response" in admin) return admin.response;

  const result = await db.externalAccessToken.updateMany({
    where: { id: tokenId, boardId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
