import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { defaultCustomFieldRows } from "@/lib/ensureDefaultCustomFields";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, color, lists } = await req.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const user = await getOrCreateUser(userId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const validLists: string[] = Array.isArray(lists)
    ? lists.filter((l: unknown) => typeof l === "string" && l.trim())
    : [];

  const board = await db.board.create({
    data: {
      title: title.trim(),
      userId: user.id,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      color: typeof color === "string" && color ? color : null,
      list: validLists.length > 0
        ? {
            createMany: {
              data: validLists.map((l, i) => ({
                title: l.trim(),
                order: i,
              })),
            },
          }
        : undefined,
      customFields: {
        createMany: {
          data: defaultCustomFieldRows(),
        },
      },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
