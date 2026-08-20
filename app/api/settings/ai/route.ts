import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { encrypt, maskApiKey, decrypt } from "@/lib/crypto";
import { AiProvider, PROVIDER_DEFAULT_MODELS } from "@/lib/ai/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { settings: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const settings = user.settings;
  const rawKey = settings?.aiApiKey ? decrypt(settings.aiApiKey) : "";

  return NextResponse.json({
    provider: (settings?.aiProvider as AiProvider) || "openai",
    hasApiKey: Boolean(rawKey),
    maskedApiKey: rawKey ? maskApiKey(rawKey) : "",
    model: settings?.aiModel || PROVIDER_DEFAULT_MODELS[(settings?.aiProvider as AiProvider) || "openai"],
    baseUrl: settings?.aiBaseUrl || "",
    voiceLanguage: settings?.voiceLanguage || "es-ES",
  });
}

export async function PUT(req: Request) {
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

  const body = await req.json();
  const { provider, apiKey, model, baseUrl, voiceLanguage } = body;

  const currentSettings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  let encryptedKey = currentSettings?.aiApiKey ?? null;
  // If user provided a new key (and it's not a masked string)
  if (apiKey && !apiKey.includes("••••")) {
    encryptedKey = encrypt(apiKey.trim());
  } else if (apiKey === "") {
    encryptedKey = null;
  }

  const updated = await db.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      aiProvider: provider || "openai",
      aiApiKey: encryptedKey,
      aiModel: model || null,
      aiBaseUrl: baseUrl || null,
      voiceLanguage: voiceLanguage || "es-ES",
    },
    update: {
      aiProvider: provider || "openai",
      aiApiKey: encryptedKey,
      aiModel: model || null,
      aiBaseUrl: baseUrl || null,
      voiceLanguage: voiceLanguage || "es-ES",
    },
  });

  const rawKey = updated.aiApiKey ? decrypt(updated.aiApiKey) : "";

  return NextResponse.json({
    success: true,
    provider: updated.aiProvider,
    hasApiKey: Boolean(rawKey),
    maskedApiKey: rawKey ? maskApiKey(rawKey) : "",
    model: updated.aiModel,
    baseUrl: updated.aiBaseUrl,
    voiceLanguage: updated.voiceLanguage,
  });
}
