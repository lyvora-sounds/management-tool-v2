import { apiPathFor, isPublicRoute } from "@/lib/apiRoutes";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type Options = {
  /** Where kiki-api lives. Unset means every call stays on this app's own /api routes. */
  baseUrl: string | undefined;
  /** The signed-in user's Clerk session token, or null when there is none yet. */
  getToken: () => Promise<string | null>;
  fetchImpl: FetchLike;
};

/**
 * fetch for this app's API. A route that kiki-api serves (lib/apiRoutes.ts) is sent there with the Clerk
 * session token as a bearer; anything else, or any call while NEXT_PUBLIC_API_URL is unset, is exactly the
 * plain same-origin fetch it was before. That keeps local development and Vercel previews unchanged.
 */
export function createApiFetch({ baseUrl, getToken, fetchImpl }: Options) {
  const base = baseUrl?.replace(/\/+$/, "");

  return async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!base) return fetchImpl(path, init);

    const route = path.split("?")[0] ?? path;
    const apiPath = apiPathFor(init.method ?? "GET", route);
    if (!apiPath) return fetchImpl(path, init);

    const token = await getToken();
    // Clerk has not loaded or nobody is signed in: the route still exists here, with cookie auth. A public
    // route (the page behind an invitation link) goes to the API anyway, without a token.
    if (!token && !isPublicRoute(init.method ?? "GET", route)) return fetchImpl(path, init);

    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const toApi = () => fetchImpl(`${base}${apiPath}${query}`, { ...init, headers });

    // A write is never repeated: if the API answered badly we cannot know whether it applied. A read can be,
    // so while routes are moving over, a read that the API cannot serve (unreachable, blocked by CORS, a token
    // it rejects, a server error) is answered by the route this app still has. A 404 is a real answer and stays.
    if ((init.method ?? "GET").toUpperCase() !== "GET") return toApi();
    try {
      const response = await toApi();
      if (response.status !== 401 && response.status < 500) return response;
    } catch {
      // Network or CORS failure: fall through to the same-origin route.
    }
    return fetchImpl(path, init);
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
 * notification bell asks as soon as it mounts) would find no session and go to this app's own route. So the
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
