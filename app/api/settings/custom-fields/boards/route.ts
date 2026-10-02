import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readableBoardWhere, resolveBoardRole } from "@/lib/boardAccess";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await db.board.findMany({
    where: readableBoardWhere(user.id),
    select: {
      id: true,
      title: true,
      color: true,
      userId: true,
      accessMode: true,
      defaultRole: true,
      members: { where: { userId: user.id }, select: { role: true }, take: 1 },
      organization: {
        select: { members: { where: { userId: user.id }, select: { role: true }, take: 1 } },
      },
      teamAccess: {
        where: { team: { members: { some: { userId: user.id } } } },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = boards.map((board) => {
    const isOwner = board.userId === user.id;
    const effectiveRole = resolveBoardRole(user.id, {
      ownerId: board.userId,
      accessMode: board.accessMode,
      defaultRole: board.defaultRole,
      directRole: board.members[0]?.role ?? null,
      organizationRole: board.organization?.members[0]?.role ?? null,
      teamRoles: board.teamAccess.map((grant) => grant.role),
    });
    const isAdmin = effectiveRole === "owner" || effectiveRole === "admin";

    return {
      id: board.id,
      title: board.title,
      color: board.color,
      isOwner,
      isAdmin,
    };
  });

  return NextResponse.json(formatted);
}
