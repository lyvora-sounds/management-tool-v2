import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import {
  createExternalAccessToken,
  TICKETS_READ_SCOPE,
} from "@/lib/externalAccess";

type RouteContext = { params: Promise<{ boardId: string }> };

async function requireAdmin(boardId: string) {
  const { userId } = await auth();
  if (!userId || !(await isBoardAdmin(userId, boardId))) return null;
  return db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  if (!(await requireAdmin(boardId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tokens = await db.externalAccessToken.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      environments: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json(tokens);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { boardId } = await params;
  const user = await requireAdmin(boardId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const requestedEnvironments: string[] = Array.isArray(body?.environments)
    ? body.environments
        .filter(
          (value: unknown): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value: string) => value.trim())
    : ["*"];
  const environments: string[] = [...new Set(requestedEnvironments)];
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Name must contain 1 to 80 characters" }, { status: 400 });
  }
  if (!environments.length || (environments.includes("*") && environments.length > 1)) {
    return NextResponse.json(
      { error: "Use either all environments (*) or an explicit environment list" },
      { status: 400 },
    );
  }
  if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date())) {
    return NextResponse.json({ error: "Expiration must be a future date" }, { status: 400 });
  }

  if (!environments.includes("*")) {
    const environmentField = await db.customField.findUnique({
      where: { boardId_defaultKey: { boardId, defaultKey: "environment" } },
      select: { options: true },
    });
    const configured = Array.isArray(environmentField?.options)
      ? environmentField.options.filter((value): value is string => typeof value === "string")
      : [];
    const invalid = environments.filter((environment) => !configured.includes(environment));
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
      environments,
      expiresAt,
      boardId,
      createdById: user.id,
    },
    select: {
      id: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      environments: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // The plaintext token is intentionally returned once and is never stored.
  return NextResponse.json({ ...created, token: generated.token }, { status: 201 });
}
