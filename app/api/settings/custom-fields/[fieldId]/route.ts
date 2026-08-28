import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fieldId } = await params;
  const field = await db.customField.findUnique({ where: { id: fieldId } });

  if (!field) {
    return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 });
  }

  const isAdmin = await isBoardAdmin(user.id, field.boardId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Solo los administradores del board pueden editar campos personalizados" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, type, options, enabled } = body;

  const updated = await db.customField.update({
    where: { id: fieldId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      ...(options !== undefined && { options: type === "SELECT" || field.type === "SELECT" ? options : undefined }),
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fieldId } = await params;
  const field = await db.customField.findUnique({ where: { id: fieldId } });

  if (!field) {
    return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 });
  }

  const isAdmin = await isBoardAdmin(user.id, field.boardId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Solo los administradores del board pueden eliminar campos personalizados" },
      { status: 403 }
    );
  }

  await db.customField.delete({ where: { id: fieldId } });

  return NextResponse.json({ success: true });
}
