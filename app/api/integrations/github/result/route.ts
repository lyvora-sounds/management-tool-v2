import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearGithubResultCookie, consumeGithubResult, githubActor, GITHUB_RESULT_COOKIE } from "@/lib/integrations/githubConnection";
import { callGithubApi, githubApiBase } from "@/lib/integrations/githubRelay";

export async function POST() {
  const base = githubApiBase();
  const { userId, getToken } = await auth();
  const token = (await cookies()).get(GITHUB_RESULT_COOKIE)?.value ?? "";
  let result: unknown = null;
  if (base) {
    // The result rows are the API's now; this route only holds the cookie, so it relays the token to consume it.
    const session = userId ? await getToken() : null;
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const answer = token ? await callGithubApi(base, session, "/v1/integrations/github/result", { token }) : null;
    result = (answer as { ok?: unknown } | null)?.ok === true ? true : null;
  } else {
    const user = await githubActor(userId);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    result = token ? await consumeGithubResult(token, user.id) : null;
  }
  const response = NextResponse.json({ ok: Boolean(result) });
  const cleared = clearGithubResultCookie();
  response.cookies.set(cleared.name, cleared.value, cleared.options);
  return response;
}
