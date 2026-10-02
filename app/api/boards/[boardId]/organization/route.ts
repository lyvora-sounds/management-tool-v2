import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardOwner } from "@/lib/boardAccess";
import { requireOrganizationManager } from "@/lib/organizations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId || !(await isBoardOwner(clerkId, boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const actor = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { title: true, organizationId: true },
  });
  const body = await request.json().catch(() => null);
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  const confirmation = typeof body?.confirmation === "string" ? body.confirmation : "";

  if (!actor || !board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (organizationId === board.organizationId) {
    return NextResponse.json({ error: "Board already belongs to this organization" }, { status: 400 });
  }
  if (!(await requireOrganizationManager(actor.id, organizationId))) {
    return NextResponse.json({ error: "Destination organization not found" }, { status: 404 });
  }

  const requiredConfirmation = `MOVE ${board.title}`;
  if (confirmation !== requiredConfirmation) {
    return NextResponse.json({ error: "Confirmation text does not match" }, { status: 400 });
  }

  await db.$transaction([
    // Team grants belong to the source organization and must never cross the boundary.
    db.boardTeamAccess.deleteMany({ where: { boardId } }),
    db.board.update({ where: { id: boardId }, data: { organizationId } }),
  ]);

  return NextResponse.json({ success: true, organizationId });
}
