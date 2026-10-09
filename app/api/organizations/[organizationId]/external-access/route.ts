import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  createExternalAccessToken,
  readTokenRequest,
  TICKETS_READ_SCOPE,
  TICKETS_WRITE_SCOPE,
} from "@/lib/externalAccess";
import { requireOrganizationManager } from "@/lib/organizations";

const tokenSelect = {
  id: true,
  name: true,
  tokenPrefix: true,
  scopes: true,
  expiresAt: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

async function manager(organizationId: string) {
  const { userId } = await auth();
  if (!userId) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || !(await requireOrganizationManager(user.id, organizationId))) {
    return { response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { user };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const actor = await manager(organizationId);
  if ("response" in actor) return actor.response;

  const tokens = await db.externalAccessToken.findMany({
    where: { organizationId, boardId: null, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: tokenSelect,
  });
  return NextResponse.json(tokens);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const actor = await manager(organizationId);
  if ("response" in actor) return actor.response;

  const parsed = readTokenRequest(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const generated = createExternalAccessToken();
  const created = await db.externalAccessToken.create({
    data: {
      name: parsed.name,
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      scopes: parsed.access === "write" ? [TICKETS_READ_SCOPE, TICKETS_WRITE_SCOPE] : [TICKETS_READ_SCOPE],
      allEnvironments: true,
      environments: [],
      expiresAt: parsed.expiresAt,
      organizationId,
      boardId: null,
      createdById: actor.user.id,
    },
    select: tokenSelect,
  });

  return NextResponse.json({ ...created, token: generated.token }, { status: 201 });
}
