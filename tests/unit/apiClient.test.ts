import { describe, expect, it, vi } from "vitest";
import { createApiFetch } from "@/lib/apiClient";
import { apiPathFor } from "@/lib/apiRoutes";

function setup(opts: { baseUrl?: string; token?: string | null }) {
  const fetchImpl = vi.fn(async () => new Response("{}"));
  const apiFetch = createApiFetch({
    baseUrl: opts.baseUrl,
    getToken: async () => (opts.token === undefined ? "tok" : opts.token),
    fetchImpl,
  });
  return { apiFetch, fetchImpl };
}

describe("apiPathFor", () => {
  it("maps a migrated route to its kiki-api path", () => {
    expect(apiPathFor("GET", "/api/labels/board_1")).toBe("/v1/labels/board_1");
  });

  it("leaves other methods and other routes on this app", () => {
    expect(apiPathFor("PUT", "/api/labels/board_1")).toBeNull();
    expect(apiPathFor("GET", "/api/labels/label/l1")).toBeNull();
    expect(apiPathFor("GET", "/api/boards")).toBeNull();
  });
});

describe("apiFetch", () => {
  it("is the plain same-origin fetch while NEXT_PUBLIC_API_URL is unset", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: undefined });
    await apiFetch("/api/labels/board_1");
    expect(fetchImpl).toHaveBeenCalledWith("/api/labels/board_1", {});
  });

  it("sends a migrated route to the API with the session token", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: "https://api.example.com/" });
    await apiFetch("/api/labels/board_1?x=1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/labels/board_1?x=1");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
  });

  it("keeps a route that has not moved on this app, with no token", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: "https://api.example.com" });
    await apiFetch("/api/boards");
    expect(fetchImpl).toHaveBeenCalledWith("/api/boards", {});
  });

  it("keeps the same-origin call when there is no session token yet", async () => {
    const { apiFetch, fetchImpl } = setup({ baseUrl: "https://api.example.com", token: null });
    await apiFetch("/api/labels/board_1");
    expect(fetchImpl).toHaveBeenCalledWith("/api/labels/board_1", {});
  });

  describe("when the API cannot serve a read", () => {
    const apiUrl = "https://api.example.com/v1/labels/board_1";

    function withApi(respond: () => Promise<Response>) {
      const fetchImpl = vi.fn(async (url: string) =>
        url.startsWith("https://api.example.com") ? respond() : new Response("[]", { status: 200 }),
      );
      const apiFetch = createApiFetch({ baseUrl: "https://api.example.com", getToken: async () => "tok", fetchImpl });
      return { apiFetch, fetchImpl };
    }

    it("falls back to this app when the API is unreachable", async () => {
      const { apiFetch, fetchImpl } = withApi(async () => {
        throw new TypeError("Failed to fetch");
      });
      const res = await apiFetch("/api/labels/board_1");
      expect(res.status).toBe(200);
      expect(fetchImpl.mock.calls.map((c) => c[0])).toEqual([apiUrl, "/api/labels/board_1"]);
    });

    it("falls back when the API rejects the token", async () => {
      const { apiFetch, fetchImpl } = withApi(async () => new Response("{}", { status: 401 }));
      await apiFetch("/api/labels/board_1");
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("falls back on a server error", async () => {
      const { apiFetch, fetchImpl } = withApi(async () => new Response("{}", { status: 503 }));
      await apiFetch("/api/labels/board_1");
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("keeps a 404 from the API: it is a real answer", async () => {
      const { apiFetch, fetchImpl } = withApi(async () => new Response("{}", { status: 404 }));
      const res = await apiFetch("/api/labels/board_1");
      expect(res.status).toBe(404);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
  });
});

describe("apiFetch with a write and a query", () => {
  it("sends a migrated write to the API with the token and does not repeat it when the API fails", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 503 }));
    const apiFetch = createApiFetch({ baseUrl: "https://api.example.com", getToken: async () => "tok", fetchImpl });
    const res = await apiFetch("/api/lists/updateList/li1", { method: "PATCH", body: "{}" });
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/lists/li1");
    expect(init.method).toBe("PATCH");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
  });

  it("keeps the query string of a migrated read", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}"));
    const apiFetch = createApiFetch({ baseUrl: "https://api.example.com", getToken: async () => "tok", fetchImpl });
    await apiFetch("/api/search?q=plan%20b");
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe("https://api.example.com/v1/search?q=plan%20b");
  });

  it("sends a write to this app when there is no session token yet", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}"));
    const apiFetch = createApiFetch({ baseUrl: "https://api.example.com", getToken: async () => null, fetchImpl });
    await apiFetch("/api/lists/createList", { method: "POST", body: "{}" });
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe("/api/lists/createList");
  });
});
