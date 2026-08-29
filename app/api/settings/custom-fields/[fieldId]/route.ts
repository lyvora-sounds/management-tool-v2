import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { isCustomFieldType } from "@/lib/customFieldsDefaults";

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

  if (type !== undefined && !isCustomFieldType(type)) {
    return NextResponse.json({ error: "Tipo de campo no válido" }, { status: 400 });
  }

  // Mismas comprobaciones que en el POST: sin ellas, un name no textual da un
  // 500 y unas options que no sean array rompen después la pantalla de ajustes
  // al hacer options.join().
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json(
      { error: "El nombre debe ser un texto no vacío" },
      { status: 400 }
    );
  }

  if (options !== undefined && options !== null && !Array.isArray(options)) {
    return NextResponse.json(
      { error: "options debe ser una lista" },
      { status: 400 }
    );
  }

  const nextType = type ?? field.type;

  const updated = await db.customField.update({
    where: { id: fieldId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      ...(options !== undefined && {
        options:
          nextType === "SELECT" && Array.isArray(options) ? options : undefined,
      }),
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

  // Los campos por defecto los recrea ensureDefaultCustomFields en el
  // siguiente GET, así que borrarlos solo consigue perder sus valores por
  // cascada y que el campo reaparezca vacío. Para ocultarlos está `enabled`.
  if (field.defaultKey) {
    return NextResponse.json(
      {
        error:
          "Los campos por defecto no se pueden eliminar. Desactívalo si no quieres usarlo.",
      },
      { status: 400 }
    );
  }

  await db.customField.delete({ where: { id: fieldId } });

  return NextResponse.json({ success: true });
}
