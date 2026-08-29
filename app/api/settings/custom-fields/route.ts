import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hasBoardAccess, isBoardAdmin } from "@/lib/boardAccess";
import { isCustomFieldType } from "@/lib/customFieldsDefaults";
import { ensureDefaultCustomFields } from "@/lib/ensureDefaultCustomFields";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const canAccess = await hasBoardAccess(user.id, boardId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = await isBoardAdmin(user.id, boardId);

  await ensureDefaultCustomFields(boardId);

  const fields = await db.customField.findMany({
    where: { boardId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ customFields: fields, isAdmin });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { boardId, name, type, options, enabled } = body;

  if (!boardId || !name || !isCustomFieldType(type)) {
    return NextResponse.json(
      { error: "boardId, name, and a valid type are required" },
      { status: 400 }
    );
  }

  const isAdmin = await isBoardAdmin(user.id, boardId);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Solo los administradores del board pueden crear campos personalizados" },
      { status: 403 }
    );
  }

  const count = await db.customField.count({ where: { boardId } });

  const newField = await db.customField.create({
    data: {
      boardId,
      name: name.trim(),
      type,
      options: type === "SELECT" && Array.isArray(options) ? options : undefined,
      enabled: enabled ?? true,
      isDefault: false,
      order: count,
    },
  });

  return NextResponse.json(newField, { status: 201 });
}
