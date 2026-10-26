import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canManageGithub, canReadGithub, clearGithubConnection, githubActor, githubConnectionView, githubInstallProgress, githubInstallationForOrganization, saveGithubSelection } from "@/lib/integrations/githubConnection";
import { GithubAppError, fetchInstallationRepository, installationHasBranch, readGithubAppConfig } from "@/lib/integrations/githubApp";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const user = await githubActor((await auth()).userId);
  if (!user || !(await canReadGithub(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const manager = await canManageGithub(user.id, organizationId);
  const progress = manager
    ? await githubInstallProgress(organizationId, user.id)
    : { pendingApproval: false, choices: [] };
  return NextResponse.json({
    configured: readGithubAppConfig() !== null,
    connection: await githubConnectionView(organizationId, { includeSettingsUrl: manager }),
    pendingApproval: progress.pendingApproval,
    choices: manager ? progress.choices : [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const user = await githubActor((await auth()).userId);
  if (!user || !(await canManageGithub(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const config = readGithubAppConfig();
  if (!config) return NextResponse.json({ error: "GitHub App is not configured" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const repositoryId = typeof body?.repositoryId === "string" ? body.repositoryId : "";
  const branch = typeof body?.branch === "string" ? body.branch : "";
  if (!/^\d{1,20}$/.test(repositoryId) || branch.length === 0 || branch.length > 255) {
    return NextResponse.json({ error: "Choose a repository and branch" }, { status: 400 });
  }

  const connection = await githubInstallationForOrganization(organizationId);
  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const repository = await fetchInstallationRepository(config, connection.installationId, repositoryId);
    if (!repository) return NextResponse.json({ error: "Choose a repository and branch" }, { status: 400 });
    const branchExists = await installationHasBranch(config, connection.installationId, repository.fullName, branch);
    if (!branchExists) return NextResponse.json({ error: "Choose a repository and branch" }, { status: 400 });
    await saveGithubSelection(organizationId, {
      repositoryId: repository.id,
      repositoryName: repository.fullName,
      branch,
    });
  } catch (error) {
    return githubFailure(error);
  }

  return NextResponse.json({ connection: await githubConnectionView(organizationId) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const user = await githubActor((await auth()).userId);
  if (!user || !(await canManageGithub(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await clearGithubConnection(organizationId, readGithubAppConfig());
  } catch (error) {
    if (error instanceof GithubAppError && error.status === 503) {
      return NextResponse.json({ error: "GitHub App is not configured" }, { status: 503 });
    }
    return githubFailure(error);
  }
  return NextResponse.json({ connection: null });
}

function githubFailure(error: unknown) {
  if (error instanceof GithubAppError && (error.status === 401 || error.status === 403 || error.status === 404)) {
    return NextResponse.json({ error: "Reconnect GitHub" }, { status: 409 });
  }
  return NextResponse.json({ error: "GitHub is unavailable" }, { status: 502 });
}
