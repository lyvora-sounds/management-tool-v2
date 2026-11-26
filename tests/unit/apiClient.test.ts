import { describe, expect, it, vi } from "vitest";
import { createApiFetch } from "@/lib/apiClient";
import { apiPathFor } from "@/lib/apiRoutes";

function setup(opts: { baseUrl?: string; token?: string | null; respond?: () => Promise<Response> }) {
  const fetchImpl = vi.fn(opts.respond ?? (async () => new Response("{}")));
  const apiFetch = createApiFetch({
    baseUrl: opts.baseUrl,
    getToken: async () => (opts.token === undefined ? "tok" : opts.token),
    fetchImpl,
  });
  return { apiFetch, fetchImpl };
}

describe("apiPathFor", () => {
  it("maps a route to its kiki-api path", () => {
    expect(apiPathFor("GET", "/api/labels/board_1")).toBe("/v1/labels/board_1");
  });

  it("knows no route for another method or another path", () => {
    expect(apiPathFor("PUT", "/api/labels/board_1")).toBeNull();
    expect(apiPathFor("GET", "/api/labels/label/l1")).toBeNull();
    expect(apiPathFor("GET", "/api/boards")).toBeNull();
  });
});

describe("apiFetch", () => {
  const API = "https://api.example.com";

  it("sends the call to the API with the session token", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: `${API}/` });
    await apiFetch("/api/labels/board_1?x=1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/v1/labels/board_1?x=1`);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
  });

  it("keeps the method, the body and the query of a write", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: API });
    await apiFetch("/api/lists/updateList/li1", { method: "PATCH", body: "{}" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/v1/lists/li1`);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe("{}");
  });

  it("keeps the query string of a read", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: API });
    await apiFetch("/api/search?q=plan%20b");
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe(`${API}/v1/search?q=plan%20b`);
  });

  it("goes without a token when nobody is signed in, and lets the API decide", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: API, token: null });
    await apiFetch("/api/invite/tok_1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/v1/invitations/tok_1`);
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("answers what the API answered and never repeats a call", async () => {
    for (const status of [401, 404, 503]) {
      const { apiFetch, fetchImpl } = setup({ baseUrl: API, respond: async () => new Response("{}", { status }) });
      expect((await apiFetch("/api/labels/board_1")).status).toBe(status);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
    const { apiFetch, fetchImpl } = setup({ baseUrl: API, respond: async () => { throw new TypeError("Failed to fetch"); } });
    await expect(apiFetch("/api/labels/board_1")).rejects.toThrow("Failed to fetch");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws when the API address is not set, or a path has no route", async () => {
    const unset = setup({ baseUrl: undefined });
    await expect(unset.apiFetch("/api/labels/board_1")).rejects.toThrow("NEXT_PUBLIC_API_URL is not set");
    const { apiFetch, fetchImpl } = setup({ baseUrl: API });
    await expect(apiFetch("/api/boards")).rejects.toThrow("no kiki-api route for GET /api/boards");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
