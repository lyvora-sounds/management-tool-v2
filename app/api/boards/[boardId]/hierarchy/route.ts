import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getBoardRole } from "@/lib/boardAccess";
import { canReadBoard as roleCanRead } from "@/lib/boardRoles";
import { hierarchySvg, type HierarchyNode } from "@/lib/hierarchyDiagram";
import { parseListValue } from "@/lib/customValueUtils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const role = await getBoardRole(user.id, boardId);
  if (!roleCanRead(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

  const task = await db.task.findFirst({
    where: { id: taskId, list: { boardId } },
    select: { id: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await db.task.findMany({
    where: { list: { boardId } },
    select: {
      id: true,
      title: true,
      archived: true,
      customValues: {
        where: { customField: { defaultKey: { in: ["parent", "child"] }, boardId } },
        select: { value: true, customField: { select: { defaultKey: true } } },
      },
    },
  });

  const nodes: HierarchyNode[] = tasks.map((row) => {
    const parent = row.customValues.find((value) => value.customField.defaultKey === "parent")?.value ?? null;
    const child = row.customValues.find((value) => value.customField.defaultKey === "child")?.value ?? null;
    return {
      id: row.id,
      title: row.title,
      parentId: parent || null,
      childIds: parseListValue(child),
      archived: row.archived,
    };
  });

  const search = new URL(request.url).searchParams;
  const kicker = search.get("kicker")?.slice(0, 40) || undefined;
  const note = search.get("note")?.slice(0, 160) || undefined;
  return NextResponse.json({ svg: hierarchySvg(nodes, { focusId: taskId, kicker, note }) });
}
