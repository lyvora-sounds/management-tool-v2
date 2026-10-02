import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
      },
    });
  }

  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Invitation already used" }, { status: 409 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }
  if (invitation.email !== user.email) {
    return NextResponse.json({ error: "This invitation is for a different email" }, { status: 403 });
  }

  // Check not already member
  const board = await db.board.findUnique({
    where: { id: invitation.boardId },
    select: { id: true, userId: true, organizationId: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  if (board.userId === user.id) {
    return NextResponse.json({ error: "You are the owner" }, { status: 409 });
  }

  await db.$transaction([
    db.boardMember.upsert({
      where: { boardId_userId: { boardId: invitation.boardId, userId: user.id } },
      create: { boardId: invitation.boardId, userId: user.id },
      update: {},
    }),
    // Joining a board also joins its organization. Organization-mode boards
    // are open to organization members, so this is the grant for those boards.
    db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: board.organizationId, userId: user.id } },
      create: { organizationId: board.organizationId, userId: user.id, role: "member" },
      update: {},
    }),
    db.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    }),
  ]);

  return NextResponse.json({ boardId: invitation.boardId });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { board: { select: { title: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  return NextResponse.json({
    email: invitation.email,
    boardTitle: invitation.board.title,
    status: invitation.status,
    expired: invitation.expiresAt < new Date(),
  });
}
