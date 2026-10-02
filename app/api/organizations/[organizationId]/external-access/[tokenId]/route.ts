import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireOrganizationManager } from "@/lib/organizations";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; tokenId: string }> },
) {
  const { organizationId, tokenId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || !(await requireOrganizationManager(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await db.externalAccessToken.updateMany({
    where: { id: tokenId, organizationId, boardId: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
