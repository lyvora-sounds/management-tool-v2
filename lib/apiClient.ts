import { apiPathFor } from "@/lib/apiRoutes";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type Options = {
  /** Where kiki-api lives. */
  baseUrl: string | undefined;
  /** The signed-in user's Clerk session token, or null when there is none yet. */
  getToken: () => Promise<string | null>;
  fetchImpl: FetchLike;
};

/**
 * fetch for kiki-api. The app's components still name their calls by the old `/api/...` paths; lib/apiRoutes.ts
 * turns each into its `/v1/...` route, and the call goes to `NEXT_PUBLIC_API_URL` with the Clerk session token as
 * a bearer. There is no other backend: an unset address or a path with no route is a bug and throws, and a
 * failed call is answered as the API answered it. Nothing is retried, so a write is never repeated.
 */
export function createApiFetch({ baseUrl, getToken, fetchImpl }: Options) {
  const base = baseUrl?.replace(/\/+$/, "");

  return async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set: every call goes to kiki-api");

    const route = path.split("?")[0] ?? path;
    const method = init.method ?? "GET";
    const apiPath = apiPathFor(method, route);
    if (!apiPath) throw new Error(`There is no kiki-api route for ${method.toUpperCase()} ${route}`);

    // Nobody is signed in (a visitor behind an invitation link): the call goes without a token, and the API
    // answers 401 for whatever needs a session.
    const token = await getToken();
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetchImpl(`${base}${apiPath}${query}`, { ...init, headers });
  };
}

type ClerkLike = { loaded?: boolean; session?: { getToken: () => Promise<string | null> } | null };

declare global {
  interface Window {
    Clerk?: ClerkLike;
  }
}

type WaitOptions = { timeoutMs?: number; pollMs?: number };

/**
 * Clerk's browser SDK is loaded by ClerkProvider, a moment after the page. A call made in that gap (the
 * notification bell asks as soon as it mounts) would find no session and go without a token. So the
 * first call waits, briefly, for Clerk to finish loading. Later calls do not wait again: a page that never
 * loads Clerk pays the delay once, not on every request.
 */
export function createClerkTokenSource(getClerk: () => ClerkLike | undefined, { timeoutMs = 3000, pollMs = 50 }: WaitOptions = {}) {
  let waited: Promise<void> | null = null;

  const waitUntilLoaded = () => {
    waited ??= (async () => {
      const deadline = Date.now() + timeoutMs;
      while (!getClerk()?.loaded && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, pollMs));
      }
    })();
    return waited;
  };

  return async function getToken(): Promise<string | null> {
    await waitUntilLoaded();
    return (await getClerk()?.session?.getToken()) ?? null;
  };
}

const clerkToken = createClerkTokenSource(() => (typeof window === "undefined" ? undefined : window.Clerk));

export const apiFetch = createApiFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: clerkToken,
  fetchImpl: (input, init) => fetch(input, init),
});
