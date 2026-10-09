import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { oauthHash, oauthToken, oauthServerConfig } from "@/lib/mcp/oauthConfig";
import { validChatGptCallback } from "@/lib/mcp/oauthClients";

const headers = { "cache-control": "no-store" };
const select = { id: true, redirectUris: true, allowWrite: true, createdAt: true } as const;

async function actor() {
  const { userId } = await auth();
  return userId ? db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
}

export async function GET() {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const clients = await db.mcpOAuthClient.findMany({ where: { createdById: user.id, revokedAt: null }, select, orderBy: { createdAt: "desc" } });
  return Response.json(clients, { headers });
}

export async function POST(request: Request) {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  // A settings POST must originate from the same canonical application.
  const config = oauthServerConfig();
  if (request.headers.get("origin") !== config.issuer) return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  if (!validChatGptCallback(body?.redirectUri)) return Response.json({ error: "Invalid ChatGPT callback URL" }, { status: 400, headers });
  if (body.allowWrite !== undefined && typeof body.allowWrite !== "boolean") return Response.json({ error: "Invalid access mode" }, { status: 400, headers });
  const secret = oauthToken("kiki_secret_");
  const client = await db.mcpOAuthClient.create({ data: {
    id: oauthToken("kiki_client_"), secretHash: oauthHash(secret), redirectUris: [body.redirectUri], createdById: user.id, allowWrite: body.allowWrite === true,
  }, select });
  return Response.json({ ...client, secret }, { status: 201, headers });
}

export async function DELETE(request: Request) {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (request.headers.get("origin") !== oauthServerConfig().issuer) return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string") return Response.json({ error: "Invalid client" }, { status: 400, headers });
  const result = await db.$transaction(async (tx) => {
    const changed = await tx.mcpOAuthClient.updateMany({ where: { id: body.id, createdById: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (changed.count) await tx.externalAccessToken.updateMany({ where: { oauthGrant: { clientId: body.id } }, data: { revokedAt: new Date() } });
    return changed.count;
  });
  return result ? Response.json({ success: true }, { headers }) : Response.json({ error: "Not found" }, { status: 404, headers });
}
