import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearGithubResultCookie, GITHUB_RESULT_COOKIE } from "@/lib/integrations/githubResultCookie";
import { callGithubApi, githubApiBase } from "@/lib/integrations/githubRelay";

// The result rows are the API's; this route only holds the cookie, so it relays the token to consume it once
// and clears the cookie.
export async function POST() {
  const base = githubApiBase();
  const { userId, getToken } = await auth();
  const token = (await cookies()).get(GITHUB_RESULT_COOKIE)?.value ?? "";
  const session = userId ? await getToken() : null;
  if (!base || !session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const answer = token ? await callGithubApi(base, session, "/v1/integrations/github/result", { token }) : null;
  const response = NextResponse.json({ ok: (answer as { ok?: unknown } | null)?.ok === true });
  const cleared = clearGithubResultCookie();
  response.cookies.set(cleared.name, cleared.value, cleared.options);
  return response;
}
