import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireExternalAccessAdmin } from "@/lib/externalAccessAdmin";
import {
  createExternalAccessToken,
  readTokenRequest,
  TICKETS_READ_SCOPE,
} from "@/lib/externalAccess";

type RouteContext = { params: Promise<{ boardId: string }> };

const tokenSelect = {
  id: true,
  name: true,
  tokenPrefix: true,
  scopes: true,
  expiresAt: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

export async function GET(_request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  const admin = await requireExternalAccessAdmin(boardId);
  if ("response" in admin) return admin.response;

  const tokens = await db.externalAccessToken.findMany({
    where: { boardId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: tokenSelect,
  });
  return NextResponse.json(tokens);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  const admin = await requireExternalAccessAdmin(boardId);
  if ("response" in admin) return admin.response;

  const parsed = readTokenRequest(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { organizationId: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const generated = createExternalAccessToken();
  const created = await db.externalAccessToken.create({
    data: {
      name: parsed.name,
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      scopes: [TICKETS_READ_SCOPE],
      allEnvironments: true,
      environments: [],
      expiresAt: parsed.expiresAt,
      organizationId: board.organizationId,
      boardId,
      createdById: admin.user.id,
    },
    select: tokenSelect,
  });

  // The plaintext token is intentionally returned once and is never stored.
  return NextResponse.json({ ...created, token: generated.token }, { status: 201 });
}
