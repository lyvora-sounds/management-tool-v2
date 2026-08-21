import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getGoogleOAuthUrl } from "@/lib/integrations/googleCalendar";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  try {
    const url = getGoogleOAuthUrl(user.id);
    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.message ||
          "GOOGLE_CLIENT_ID no configurado. Añade tus credenciales de Google OAuth al archivo .env.",
      },
      { status: 500 },
    );
  }
}
