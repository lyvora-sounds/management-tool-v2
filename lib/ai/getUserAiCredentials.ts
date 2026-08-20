import db from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { AiCredentials, AiProvider } from "./types";

/**
 * Fetch and decrypt AI credentials for a given user ID.
 */
export async function getUserAiCredentials(
  userId: string,
): Promise<AiCredentials | null> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
  });

  if (!settings || !settings.aiApiKey) {
    return null;
  }

  const decryptedKey = decrypt(settings.aiApiKey);
  if (!decryptedKey) {
    return null;
  }

  return {
    provider: (settings.aiProvider as AiProvider) || "openai",
    apiKey: decryptedKey,
    model: settings.aiModel,
    baseUrl: settings.aiBaseUrl,
  };
}
