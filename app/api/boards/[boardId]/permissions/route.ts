import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { KIKI_MODES, type KikiMode } from "@/lib/agent/kiki";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Apagar el interruptor es cosa de quien gestiona el tablero, propietario o
  // administrador. La variable se llamaba `owner` y ya no era cierto.
  const canManage = await isBoardAdmin(user.id, boardId);
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: { memberCanAssign?: boolean; kikiMode?: KikiMode; kikiTriage?: boolean } = {};
  if ("kikiTriage" in body) data.kikiTriage = Boolean(body.kikiTriage);
  if ("memberCanAssign" in body) data.memberCanAssign = Boolean(body.memberCanAssign);
  if ("kikiMode" in body) {
    if (!KIKI_MODES.includes(body.kikiMode)) return NextResponse.json({ error: "Invalid kikiMode" }, { status: 400 });
    data.kikiMode = body.kikiMode;
  }

  const board = await db.board.update({
    where: { id: boardId },
    data,
    select: { memberCanAssign: true, kikiMode: true, kikiTriage: true },
  });

  return NextResponse.json(board);
}
