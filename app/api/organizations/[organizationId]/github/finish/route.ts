import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canManageGithub, githubActor } from "@/lib/integrations/githubConnection";
import { readGithubAppConfig } from "@/lib/integrations/githubApp";
import { startGithubFinish } from "@/lib/integrations/githubSetup";

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

  const url = await startGithubFinish(config, organizationId, user.id);
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const destination = new URL(url);
  if (destination.origin !== "https://github.com") {
    return NextResponse.json({ error: "GitHub is unavailable" }, { status: 502 });
  }
  return NextResponse.redirect(destination);
}
