import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readableBoardWhere } from "@/lib/boardAccess";
import { listMatchingBranches, readGithubAppConfig } from "@/lib/integrations/githubApp";
import {
  checkoutCommand,
  formatTicketKey,
  githubTreeUrl,
  isRepositoryName,
  suggestedBranch,
} from "@/lib/integrations/ticketBranch";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await db.task.findFirst({
    where: { id: taskId, list: { board: readableBoardWhere(user.id) } },
    select: {
      title: true,
      number: true,
      list: {
        select: {
          board: {
            select: {
              key: true,
              organization: {
                select: {
                  githubConnection: {
                    select: { installationId: true, repositoryName: true, branch: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = task.list.board;
  const ticketKey = formatTicketKey(board.key, task.number);
  const branchName = suggestedBranch(ticketKey, task.title);
  const connection = board.organization.githubConnection;
  const repositoryName = connection?.repositoryName ?? null;
  const baseBranch = connection?.branch ?? null;
  const command = checkoutCommand(branchName, baseBranch);
  const empty = {
    connected: false,
    ticketKey,
    suggestedBranch: branchName,
    command,
    repositoryName: null,
    baseBranch: null,
    branches: [] as { name: string; url: string }[],
  };

  const config = readGithubAppConfig();
  if (!config || !connection || !repositoryName || !isRepositoryName(repositoryName)) {
    return NextResponse.json(empty);
  }
  let branches: { name: string; url: string }[] = [];
  try {
    const names = await listMatchingBranches(config, connection.installationId, repositoryName, ticketKey);
    branches = names.map((name) => ({ name, url: githubTreeUrl(repositoryName, name) }));
  } catch (error) {
    console.error("Ticket branch lookup failed:", error instanceof Error ? error.message : "unknown");
  }

  return NextResponse.json({
    connected: true,
    ticketKey,
    suggestedBranch: branchName,
    command,
    repositoryName,
    baseBranch,
    branches,
  });
}
