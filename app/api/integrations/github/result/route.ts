import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearGithubResultCookie, consumeGithubResult, githubActor, GITHUB_RESULT_COOKIE } from "@/lib/integrations/githubConnection";

export async function POST() {
  const user = await githubActor((await auth()).userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const token = (await cookies()).get(GITHUB_RESULT_COOKIE)?.value ?? "";
  const result = token ? await consumeGithubResult(token, user.id) : null;
  const response = NextResponse.json({ ok: Boolean(result) });
  const cleared = clearGithubResultCookie();
  response.cookies.set(cleared.name, cleared.value, cleared.options);
  return response;
}
