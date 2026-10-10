import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sanitizeAppearance } from "@/lib/appearance";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { settings: { select: { appearance: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(sanitizeAppearance(user.settings?.appearance));
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // Nunca se guarda lo que llega tal cual: se normaliza contra las listas
  // cerradas de lib/appearance.ts.
  const appearance = sanitizeAppearance(body);

  await db.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, appearance },
    update: { appearance },
  });

  return NextResponse.json(appearance);
}
