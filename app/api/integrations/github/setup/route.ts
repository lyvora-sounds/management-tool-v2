import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { githubActor, githubResultCookie } from "@/lib/integrations/githubConnection";
import { handleGithubSetup } from "@/lib/integrations/githubSetup";
import { readGithubAppConfig } from "@/lib/integrations/githubApp";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionUserId = await githubActor((await auth()).userId);
  const result = await handleGithubSetup({
    state: url.searchParams.get("state"),
    installationId: url.searchParams.get("installation_id"),
    setupAction: url.searchParams.get("setup_action"),
    code: url.searchParams.get("code"),
    oauthError: url.searchParams.get("error"),
    sessionUserId: sessionUserId?.id ?? null,
  }, readGithubAppConfig());

  if (result.kind === "sign-in") return NextResponse.redirect(appUrl(request, "/sign-in"));
  if (result.kind === "external") {
    const destination = new URL(result.url);
    if (destination.origin !== "https://github.com") return organizationsRedirect(request, null);
    return NextResponse.redirect(destination);
  }
  return organizationsRedirect(request, result.resultToken);
}

function organizationsRedirect(request: Request, resultToken: string | null) {
  const destination = appUrl(request, "/dashboard/organizations");
  const response = NextResponse.redirect(destination);
  if (resultToken) {
    const cookie = githubResultCookie(resultToken);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

function appUrl(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  try {
    const url = new URL(configured);
    if (url.protocol === "https:" || url.protocol === "http:") return new URL(path, url.origin);
  } catch {
    // Fall through to the request origin when the app URL is unset.
  }
  return new URL(path, new URL(request.url).origin);
}
