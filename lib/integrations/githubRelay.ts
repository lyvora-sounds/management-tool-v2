import { GITHUB_SETUP_OUTCOMES, type GithubSetupOutcome } from "@/lib/integrations/githubConnection";

/** Where kiki-api lives, or null while this app still does GitHub's setup itself (local development, old previews). */
export function githubApiBase(env: { [key: string]: string | undefined } = process.env): string | null {
  const raw = env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";
  return raw || null;
}

export type RelayedSetup =
  | { kind: "sign-in" }
  | { kind: "external"; url: string }
  | { kind: "redirect"; outcome: GithubSetupOutcome; organizationId: string | null; resultToken: string | null };

/** What kiki-api answers for the setup of an install, checked: it decides where the browser goes next. */
export function parseRelayedSetup(body: unknown): RelayedSetup | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (record.kind === "sign-in") return { kind: "sign-in" };
  if (record.kind === "external") return typeof record.url === "string" ? { kind: "external", url: record.url } : null;
  if (record.kind !== "redirect") return null;
  const outcome = (GITHUB_SETUP_OUTCOMES as readonly string[]).find((item) => item === record.outcome);
  if (!outcome) return null;
  const organizationId = typeof record.organizationId === "string" ? record.organizationId : null;
  const resultToken = typeof record.resultToken === "string" ? record.resultToken : null;
  return { kind: "redirect", outcome: outcome as GithubSetupOutcome, organizationId, resultToken };
}

/**
 * Calls kiki-api on behalf of the signed-in person, from the server: GitHub redirects the browser to this app (the
 * Clerk cookie and the cookie that carries the result live here), so the browser cannot make these calls itself.
 * Null when the API did not answer with success; nothing is retried, because the call changes state.
 */
export async function callGithubApi(
  base: string,
  token: string,
  path: string,
  body: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown | null> {
  try {
    const response = await fetchImpl(`${base}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}
