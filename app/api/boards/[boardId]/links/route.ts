import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canReadBoard } from "@/lib/boardAccess";

export interface BoardLink {
  id: string;
  label: string;
  url: string;
}

type Params = { params: Promise<{ boardId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canReadBoard(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await db.board.findUnique({ where: { id: boardId }, select: { links: true } });
  return NextResponse.json((board?.links ?? []) as unknown as BoardLink[]);
}

const MAX_LINKS = 50;
const MAX_LABEL = 100;
const MAX_URL = 2048;

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeLinks(input: unknown): BoardLink[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_LINKS) return null;
  const result: BoardLink[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const { id, label, url } = item as Record<string, unknown>;
    if (
      typeof id !== "string" ||
      typeof label !== "string" ||
      typeof url !== "string"
    ) return null;
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    if (!id || !trimmedLabel || !trimmedUrl) return null;
    if (trimmedLabel.length > MAX_LABEL || trimmedUrl.length > MAX_URL) return null;
    if (!isValidUrl(trimmedUrl)) return null;
    result.push({ id, label: trimmedLabel, url: trimmedUrl });
  }
  return result;
}

export async function PUT(req: Request, { params }: Params) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = await req.json();
  const links = sanitizeLinks(payload);
  if (!links) {
    return NextResponse.json({ error: "Invalid links payload" }, { status: 400 });
  }

  const updated = await db.board.update({
    where: { id: boardId },
    data: { links: links as unknown as object[] },
    select: { links: true },
  });

  return NextResponse.json(updated.links);
}
