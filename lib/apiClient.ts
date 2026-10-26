import { apiPathFor } from "@/lib/apiRoutes";

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

    const apiPath = apiPathFor(init.method ?? "GET", path.split("?")[0] ?? path);
    if (!apiPath) return fetchImpl(path, init);

    const token = await getToken();
    // Clerk has not loaded or nobody is signed in: the route still exists here, with cookie auth.
    if (!token) return fetchImpl(path, init);

    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
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

declare global {
  interface Window {
    Clerk?: { session?: { getToken: () => Promise<string | null> } | null };
  }
}

/** Clerk's browser SDK is loaded by ClerkProvider; outside a React tree it is reachable on window. */
async function clerkToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return (await window.Clerk?.session?.getToken()) ?? null;
}

export const apiFetch = createApiFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: clerkToken,
  fetchImpl: (input, init) => fetch(input, init),
});
