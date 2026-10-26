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
    expect(apiPathFor("POST", "/api/labels/board_1")).toBeNull();
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
});
