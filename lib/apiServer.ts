import { auth } from "@clerk/nextjs/server";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type Options = {
  baseUrl: string | undefined;
  getToken: () => Promise<string | null>;
  fetchImpl: FetchLike;
  timeoutMs?: number;
};

/** A key that holds a moment in time. The API sends them as ISO strings; the components were written for Date. */
const DATE_KEY = /(At|Date)$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function reviveDates(_key: string, value: unknown) {
  return typeof value === "string" && DATE_KEY.test(_key) && ISO.test(value) ? new Date(value) : value;
}

/** The type of a response once `reviveDates` has run: every `…At` and `…Date` string is a Date. */
export type Revived<T> = T extends readonly (infer U)[]
  ? Revived<U>[]
  : T extends object
    ? { [K in keyof T]: K extends `${string}At` | `${string}Date` ? (T[K] extends string ? Date : T[K] extends string | null | undefined ? Exclude<T[K], string> | Date : Revived<T[K]>) : Revived<T[K]> }
    : T;

export type ApiRead<T> = { ok: true; data: Revived<T> } | { ok: false; status: number };

/**
 * GET from kiki-api on behalf of the signed-in person, from a server-rendered page. The page used to query the
 * database; this is how it asks the API instead. A 4xx is an answer the page decides on (`status`); the API
 * being unreachable or failing is not, and throws so the page's error boundary shows it.
 */
export function createApiServerGet({ baseUrl, getToken, fetchImpl, timeoutMs = 15000 }: Options) {
  const base = baseUrl?.replace(/\/+$/, "");

  return async function apiServerGet<T>(path: string, { auth: needsSession = true }: { auth?: boolean } = {}): Promise<ApiRead<T>> {
    if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set: the pages read from kiki-api");

    const headers = new Headers({ accept: "application/json" });
    if (needsSession) {
      const token = await getToken();
      if (!token) return { ok: false, status: 401 };
      headers.set("authorization", `Bearer ${token}`);
    }

    const response = await fetchImpl(`${base}${path}`, { headers, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
    if (response.status >= 500) throw new Error(`kiki-api answered ${response.status} for GET ${path.split("?")[0]}`);
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, data: JSON.parse(await response.text(), reviveDates) as Revived<T> };
  };
}

export const apiServerGet = createApiServerGet({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getToken: async () => (await auth()).getToken(),
  fetchImpl: (input, init) => fetch(input, init),
});
