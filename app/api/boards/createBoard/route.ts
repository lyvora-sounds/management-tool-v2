import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { defaultCustomFieldRows } from "@/lib/ensureDefaultCustomFields";
import { ensureOrganizationForBoard } from "@/lib/organizations";
import { allocateBoardKey } from "@/lib/integrations/ticketBranch";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, color, lists, organizationId: requestedOrganizationId } = await req.json();

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const user = await getOrCreateUser(userId);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await ensureOrganizationForBoard(
    user.id,
    typeof requestedOrganizationId === "string" ? requestedOrganizationId : null,
  );
  if (!organizationId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const validLists: string[] = Array.isArray(lists)
    ? lists.filter((l: unknown) => typeof l === "string" && l.trim())
    : [];

  const trimmedTitle = title.trim();
  const boardData = {
    title: trimmedTitle,
    userId: user.id,
    organizationId,
    accessMode: "organization" as const,
    defaultRole: "member" as const,
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
  };

  const createBoard = () => db.$transaction(async (tx) => {
    const key = await allocateBoardKey(tx, organizationId, trimmedTitle);
    return tx.board.create({ data: { ...boardData, key } });
  });

  let board;
  try {
    board = await createBoard();
  } catch (error) {
    const uniqueConflict = Boolean(error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002");
    if (!uniqueConflict) throw error;
    board = await createBoard();
  }

  return NextResponse.json(board, { status: 201 });
}
