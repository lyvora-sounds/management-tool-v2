import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ getToken: async () => "tok" }) }));

const { createApiServerGet, reviveDates } = await import("@/lib/apiServer");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function setup(opts: { baseUrl?: string | undefined; token?: string | null; answer?: Response } = {}) {
  const fetchImpl = vi.fn(async () => opts.answer ?? json({}));
  const get = createApiServerGet({
    baseUrl: "baseUrl" in opts ? opts.baseUrl : "https://api.example.com/",
    getToken: async () => (opts.token === undefined ? "tok" : opts.token),
    fetchImpl,
  });
  return { get, fetchImpl };
}

describe("apiServerGet", () => {
  it("asks the API for the path with the session token and no caching", async () => {
    const { get, fetchImpl } = setup();
    await get("/v1/me/boards?x=1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/me/boards?x=1");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer tok");
    expect(init.cache).toBe("no-store");
  });

  it("turns the moments in the answer into Dates and leaves text that merely looks like one", async () => {
    const { get } = setup({
      answer: json({ updatedAt: "2026-11-22T10:00:00.000Z", dueDate: null, title: "2026-11-22T10:00:00.000Z", list: [{ createdAt: "2026-01-02T03:04:05Z" }] }),
    });
    const res = await get<{ updatedAt: string; dueDate: string | null; title: string; list: { createdAt: string }[] }>("/v1/x");
    expect(res.ok && res.data.updatedAt).toEqual(new Date("2026-11-22T10:00:00.000Z"));
    expect(res.ok && res.data.dueDate).toBeNull();
    expect(res.ok && res.data.title).toBe("2026-11-22T10:00:00.000Z");
    expect(res.ok && res.data.list[0]!.createdAt).toEqual(new Date("2026-01-02T03:04:05Z"));
  });

  it("hands a 4xx to the page as a status", async () => {
    expect(await setup({ answer: json({ error: "not_found" }, 404) }).get("/v1/x")).toEqual({ ok: false, status: 404 });
  });

  it("answers 401 without calling the API when there is no session", async () => {
    const { get, fetchImpl } = setup({ token: null });
    expect(await get("/v1/x")).toEqual({ ok: false, status: 401 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends no token for a public route", async () => {
    const { get, fetchImpl } = setup({ token: null });
    await get("/v1/shared/tasks/abc", { auth: false });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("throws when the API fails, so the page shows its error instead of an empty screen", async () => {
    await expect(setup({ answer: json({}, 503) }).get("/v1/me/boards")).rejects.toThrow(/503 for GET \/v1\/me\/boards/);
  });

  it("throws when the API address is not configured", async () => {
    await expect(setup({ baseUrl: undefined }).get("/v1/x")).rejects.toThrow(/NEXT_PUBLIC_API_URL/);
  });
});

describe("reviveDates", () => {
  it("only revives keys that hold a moment", () => {
    expect(reviveDates("note", "2026-11-22T10:00:00.000Z")).toBe("2026-11-22T10:00:00.000Z");
    expect(reviveDates("completedAt", "not a date")).toBe("not a date");
  });
});
