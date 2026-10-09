import db from "@/lib/db";
import { legacyOAuthClient, parseAuthorizationRequest, type OAuthClient } from "./oauthConfig";

export function validChatGptCallback(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.origin === "https://chatgpt.com" && !url.username && !url.password && !url.search && !url.hash &&
      (url.pathname === "/connector_platform_oauth_redirect" || /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(url.pathname));
  } catch { return false; }
}

export async function resolveOAuthClient(id: string): Promise<OAuthClient | null> {
  if (!id || id.length > 200) return null;
  if (id.startsWith("kiki_client_")) {
    const client = await db.mcpOAuthClient.findUnique({ where: { id } });
    if (!client || client.revokedAt) return null;
    return { clientId: client.id, secretHash: client.secretHash, redirects: client.redirectUris, ownerId: client.createdById, allowWrite: client.allowWrite };
  }
  try {
    const legacy = legacyOAuthClient();
    return legacy.clientId === id ? legacy : null;
  } catch { return null; }
}

export async function validateAuthorizationRequest(params: URLSearchParams) {
  const client = await resolveOAuthClient(params.get("client_id") ?? "");
  if (!client) throw new Error("Invalid OAuth client");
  return parseAuthorizationRequest(params, client);
}
