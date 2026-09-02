import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * Marca hitos del onboarding. Solo escribe sobre el propio usuario, así que no
 * hay más ACL que estar autenticado.
 *
 * Body: { dismissed?: boolean, tourSeen?: boolean }
 */
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { dismissed, tourSeen } = body as { dismissed?: unknown; tourSeen?: unknown };

  const now = new Date();
  // Solo se marca, nunca se desmarca: pasar `false` no revive el onboarding.
  // Reiniciarlo es otra operación y hoy no existe pantalla que la pida.
  const data = {
    ...(dismissed === true && { onboardingDismissedAt: now }),
    ...(tourSeen === true && { tourSeenAt: now }),
  };

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nada que marcar: se espera 'dismissed' o 'tourSeen'" },
      { status: 400 }
    );
  }

  // upsert porque UserSettings solo existe si el usuario pasó por ajustes.
  const settings = await db.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
    select: { onboardingDismissedAt: true, tourSeenAt: true },
  });

  return NextResponse.json(settings);
}
