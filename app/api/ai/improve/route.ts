import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserAiCredentials } from "@/lib/ai/getUserAiCredentials";
import { improveTask } from "@/lib/ai/engine";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const creds = await getUserAiCredentials(user.id);
  if (!creds) {
    return NextResponse.json(
      {
        error:
          "No tienes configurada tu clave de API de IA. Ve a Ajustes para añadir tu API key personal.",
      },
      { status: 400 },
    );
  }

  const { title, description } = await req.json();
  if (!title && !description) {
    return NextResponse.json(
      { error: "Se requiere un título o descripción para mejorar" },
      { status: 400 },
    );
  }

  try {
    const result = await improveTask(title || "", description || "", creds);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("AI improve error:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar la mejora con IA" },
      { status: 500 },
    );
  }
}
