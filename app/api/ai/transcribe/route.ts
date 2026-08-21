import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserAiCredentials } from "@/lib/ai/getUserAiCredentials";

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
          "Configura tu API key en Ajustes para usar la transcripción de audio.",
      },
      { status: 400 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as Blob | null;
  const language = (formData.get("language") as string) || "es";

  if (!file) {
    return NextResponse.json({ error: "No se proporcionó archivo de audio" }, { status: 400 });
  }

  try {
    // If OpenAI key available, use Whisper
    if (creds.provider === "openai" || creds.provider === "custom") {
      const openAiFormData = new FormData();
      openAiFormData.append("file", file, "audio.webm");
      openAiFormData.append("model", "whisper-1");
      openAiFormData.append("language", language.startsWith("es") ? "es" : "en");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
        },
        body: openAiFormData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Whisper error: ${errText}`);
      }

      const data = await res.json();
      return NextResponse.json({ text: data.text });
    }

    // Fallback: Gemini multimodal transcription
    if (creds.provider === "gemini") {
      const buffer = await file.arrayBuffer();
      const base64Audio = Buffer.from(buffer).toString("base64");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        creds.apiKey,
      )}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Transcribe accurately the spoken words in this audio recording (${
                    language.startsWith("es") ? "Spanish" : "English"
                  }). Output ONLY the transcribed text.`,
                },
                {
                  inline_data: {
                    mime_type: file.type || "audio/webm",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini transcription error: ${errText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return NextResponse.json({ text: text.trim() });
    }

    return NextResponse.json(
      {
        error:
          "La transcripción por audio en el servidor requiere OpenAI o Gemini. Puedes usar el reconocimiento de voz nativo de tu navegador directamente.",
      },
      { status: 400 },
    );
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err.message || "Error al transcribir audio" },
      { status: 500 },
    );
  }
}
