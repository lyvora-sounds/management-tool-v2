import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { consumeGithubResult, githubActor } from "@/lib/integrations/githubConnection";

export async function POST(request: Request) {
  const user = await githubActor((await auth()).userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const result = await consumeGithubResult(token, user.id);
  return NextResponse.json({ ok: Boolean(result) });
}
