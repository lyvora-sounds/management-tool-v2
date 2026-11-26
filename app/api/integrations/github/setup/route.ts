import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { githubResultCookie } from "@/lib/integrations/githubResultCookie";
import { callGithubApi, githubApiBase, parseRelayedSetup } from "@/lib/integrations/githubRelay";

// GitHub redirects the browser here (this address is registered in each GitHub App), so the page stays in this
// app, where the Clerk cookie and the result cookie live. It only relays the query to kiki-api with the person's
// token, which does the setup, and sets the cookie that carries the result.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = {
    state: url.searchParams.get("state"),
    installationId: url.searchParams.get("installation_id"),
    setupAction: url.searchParams.get("setup_action"),
    code: url.searchParams.get("code"),
    error: url.searchParams.get("error"),
  };

  const base = githubApiBase();
  // Without the API address there is nothing to relay to: the person lands back with no result to show.
  if (!base) return organizationsRedirect(request, null);
  const { userId, getToken } = await auth();
  const token = userId ? await getToken() : null;
  if (!token) return NextResponse.redirect(appUrl(request, "/sign-in"));
  const result = parseRelayedSetup(await callGithubApi(base, token, "/v1/integrations/github/setup", query));
  // The API did not answer: the person lands back on the organizations page with no result to show.
  if (!result) return organizationsRedirect(request, null);

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
