import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { oauthServerConfig } from "@/lib/mcp/oauthConfig";

const headers = { "cache-control": "no-store" };
const select = {
  id: true,
  name: true,
  tokenPrefix: true,
  scopes: true,
  expiresAt: true,
  lastUsedAt: true,
  createdAt: true,
  organization: { select: { id: true, name: true } },
  board: { select: { id: true, title: true } },
} as const;

async function actor() {
  const { userId } = await auth();
  return userId ? db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
}

export async function GET() {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const tokens = await db.externalAccessToken.findMany({
    where: { createdById: user.id, revokedAt: null },
    select,
    orderBy: { createdAt: "desc" },
  });
  return Response.json(tokens, { headers });
}

export async function DELETE(request: Request) {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (request.headers.get("origin") !== oauthServerConfig().issuer) {
    return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string" || !body.id) {
    return Response.json({ error: "Invalid token" }, { status: 400, headers });
  }
  const changed = await db.externalAccessToken.updateMany({
    where: { id: body.id, createdById: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return changed.count
    ? Response.json({ success: true }, { headers })
    : Response.json({ error: "Not found" }, { status: 404, headers });
}
