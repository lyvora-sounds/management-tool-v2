import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canManageGithub, githubActor, githubInstallationForOrganization } from "@/lib/integrations/githubConnection";
import { GithubAppError, listInstallationRepositories, readGithubAppConfig } from "@/lib/integrations/githubApp";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params;
  const user = await githubActor((await auth()).userId);
  if (!user || !(await canManageGithub(user.id, organizationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const config = readGithubAppConfig();
  if (!config) return NextResponse.json({ error: "GitHub App is not configured" }, { status: 503 });
  const connection = await githubInstallationForOrganization(organizationId);
  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const page = await listInstallationRepositories(config, connection.installationId);
    return NextResponse.json({ repositories: page.items, truncated: page.truncated });
  } catch (error) {
    if (error instanceof GithubAppError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      return NextResponse.json({ error: "Reconnect GitHub" }, { status: 409 });
    }
    return NextResponse.json({ error: "GitHub is unavailable" }, { status: 502 });
  }
}
