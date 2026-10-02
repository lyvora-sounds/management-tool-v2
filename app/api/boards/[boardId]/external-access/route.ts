import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireExternalAccessAdmin } from "@/lib/externalAccessAdmin";
import {
  configuredEnvironments,
  createExternalAccessToken,
  parseEnvironmentGrant,
  TICKETS_READ_SCOPE,
} from "@/lib/externalAccess";

type RouteContext = { params: Promise<{ boardId: string }> };

const tokenSelect = {
  id: true,
  name: true,
  tokenPrefix: true,
  scopes: true,
  allEnvironments: true,
  environments: true,
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

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;
  const grant = parseEnvironmentGrant(body);

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Name must contain 1 to 80 characters" }, { status: 400 });
  }
  if ("error" in grant) {
    return NextResponse.json({ error: grant.error }, { status: 400 });
  }
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) {
    return NextResponse.json({ error: "Expiration must be a future date" }, { status: 400 });
  }

  if (!grant.allEnvironments) {
    const configured = await configuredEnvironments(boardId);
    const invalid = grant.environments.filter((environment) => !configured.includes(environment));
    if (invalid.length) {
      return NextResponse.json(
        { error: "Unknown environment", invalidEnvironments: invalid },
        { status: 400 },
      );
    }
  }

  const generated = createExternalAccessToken();
  const created = await db.externalAccessToken.create({
    data: {
      name,
      tokenHash: generated.hash,
      tokenPrefix: generated.prefix,
      scopes: [TICKETS_READ_SCOPE],
      allEnvironments: grant.allEnvironments,
      environments: grant.environments,
      expiresAt,
      boardId,
      createdById: admin.user.id,
    },
    select: tokenSelect,
  });

  // The plaintext token is intentionally returned once and is never stored.
  return NextResponse.json({ ...created, token: generated.token }, { status: 201 });
}
