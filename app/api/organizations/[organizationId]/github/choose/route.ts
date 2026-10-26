import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canManageGithub, githubActor, githubConnectionView } from "@/lib/integrations/githubConnection";
import { GithubAppError, readGithubAppConfig } from "@/lib/integrations/githubApp";
import { chooseGithubInstallation } from "@/lib/integrations/githubSetup";

export async function POST(
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

  const body = await request.json().catch(() => null) as { installationId?: unknown } | null;
  const installationId = typeof body?.installationId === "string" ? body.installationId : "";
  try {
    const chosen = await chooseGithubInstallation(config, organizationId, user.id, installationId);
    if (!chosen.ok) return NextResponse.json({ error: "Choose a GitHub account" }, { status: 400 });
  } catch (error) {
    if (error instanceof GithubAppError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      return NextResponse.json({ error: "Reconnect GitHub" }, { status: 409 });
    }
    return NextResponse.json({ error: "GitHub is unavailable" }, { status: 502 });
  }
  return NextResponse.json({
    connection: await githubConnectionView(organizationId, { includeSettingsUrl: true }),
  });
}
