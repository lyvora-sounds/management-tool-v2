import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canManageGithub, githubActor } from "@/lib/integrations/githubConnection";
import { githubInstallUrl, readGithubAppConfig } from "@/lib/integrations/githubApp";
import { startGithubInstall } from "@/lib/integrations/githubSetup";

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

  const state = await startGithubInstall(config, organizationId, user.id);
  return NextResponse.redirect(githubInstallUrl(config.slug, state));
}
