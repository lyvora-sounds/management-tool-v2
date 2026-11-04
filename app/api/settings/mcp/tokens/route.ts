import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { adminBoardWhere } from "@/lib/boardAccess";
import {
  createExternalAccessToken,
  readTokenRequest,
  TICKETS_READ_SCOPE,
  TICKETS_WRITE_SCOPE,
} from "@/lib/externalAccess";
import { isValidRequestOrigin } from "@/lib/mcp/oauthConfig";

const headers = { "cache-control": "no-store" };
const select = {
  id: true,
  name: true,
  tokenPrefix: true,
  scopes: true,
  fullAccess: true,
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

export async function POST(request: Request) {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (!isValidRequestOrigin(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  }

  const parsed = readTokenRequest(await request.json().catch(() => null));
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400, headers });
  }

  const adminBoard = await db.board.findFirst({
    where: adminBoardWhere(user.id),
    select: { id: true },
  });
  if (!adminBoard) {
    return Response.json(
      { error: "Only an owner or admin can create a full-access token" },
      { status: 403, headers },
    );
  }

  const generated = createExternalAccessToken();
  const created = await db.externalAccessToken.create({
    data: {
      name: parsed.name,
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      scopes: parsed.access === "write" ? [TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE] : [TICKETS_READ_SCOPE],
      fullAccess: true,
      allEnvironments: true,
      environments: [],
      expiresAt: parsed.expiresAt,
      organizationId: null,
      boardId: null,
      createdById: user.id,
    },
    select,
  });

  return Response.json({ ...created, token: generated.token }, { status: 201, headers });
}

export async function DELETE(request: Request) {
  const user = await actor();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (!isValidRequestOrigin(request)) {
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
