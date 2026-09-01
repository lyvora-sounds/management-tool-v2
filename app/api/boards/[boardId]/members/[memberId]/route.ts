import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getBoardRole } from "@/lib/boardAccess";
import { canManageBoard, isAssignableRole } from "@/lib/boardRoles";

/** Resuelve al usuario autenticado y su rol, validando que el miembro exista. */
async function resolveContext(boardId: string, memberId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const role = await getBoardRole(user.id, boardId);
  if (!canManageBoard(role)) {
    // 404 y no 403: quien no gestiona el board tampoco debería poder deducir
    // qué miembros tiene.
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const member = await db.boardMember.findUnique({ where: { id: memberId } });
  if (!member || member.boardId !== boardId) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { user, role, member };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  const { boardId, memberId } = await params;
  const ctx = await resolveContext(boardId, memberId);
  if (ctx.error) return ctx.error;

  const { role: nextRole } = await req.json();

  if (!isAssignableRole(nextRole)) {
    return NextResponse.json(
      { error: "El rol debe ser 'admin' o 'member'" },
      { status: 400 }
    );
  }

  // Misma regla que en DELETE: un admin no toca a otro admin. Sin esto, el
  // guard de DELETE es papel mojado —bastaba degradar al otro a member y
  // luego echarlo— y dos administradores podrían desactivarse entre ellos.
  if (ctx.role !== "owner" && ctx.member.role === "admin") {
    return NextResponse.json(
      { error: "Solo el propietario puede cambiar el rol de un administrador" },
      { status: 403 }
    );
  }

  // El propietario no es una fila de BoardMember, así que su rol no se toca
  // por aquí. Cambiar la propiedad del board es otra operación.
  const updated = await db.boardMember.update({
    where: { id: memberId },
    data: { role: nextRole },
    select: { id: true, role: true, user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  const { boardId, memberId } = await params;
  const ctx = await resolveContext(boardId, memberId);
  if (ctx.error) return ctx.error;

  // Un admin no puede echar a otro admin: eso queda para el propietario, para
  // que dos administradores no puedan expulsarse mutuamente.
  if (ctx.role !== "owner" && ctx.member.role === "admin") {
    return NextResponse.json(
      { error: "Solo el propietario puede eliminar a un administrador" },
      { status: 403 }
    );
  }

  await db.boardMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
