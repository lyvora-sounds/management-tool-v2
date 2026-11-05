import { describe, expect, it, vi } from "vitest";
import { callGithubApi, githubApiBase, parseRelayedSetup } from "@/lib/integrations/githubRelay";

describe("githubApiBase", () => {
  it("is the API address without a trailing slash, and null while it is unset", () => {
    expect(githubApiBase({ NEXT_PUBLIC_API_URL: "https://api.kikiboard.xyz/" })).toBe("https://api.kikiboard.xyz");
    expect(githubApiBase({ NEXT_PUBLIC_API_URL: "  " })).toBeNull();
    expect(githubApiBase({})).toBeNull();
  });
});

describe("parseRelayedSetup", () => {
  it("accepts the three answers the API gives", () => {
    expect(parseRelayedSetup({ kind: "sign-in" })).toEqual({ kind: "sign-in" });
    expect(parseRelayedSetup({ kind: "external", url: "https://github.com/login/oauth/authorize?x=1" })).toEqual({
      kind: "external",
      url: "https://github.com/login/oauth/authorize?x=1",
    });
    expect(parseRelayedSetup({ kind: "redirect", outcome: "connected", organizationId: "o1", resultToken: "tok" })).toEqual({
      kind: "redirect",
      outcome: "connected",
      organizationId: "o1",
      resultToken: "tok",
    });
    expect(parseRelayedSetup({ kind: "redirect", outcome: "error", organizationId: null, resultToken: null })).toMatchObject({ resultToken: null });
  });

  it("rejects anything else, so an odd answer never decides where the browser goes", () => {
    for (const bad of [null, "x", 1, {}, { kind: "external" }, { kind: "external", url: 3 }, { kind: "redirect", outcome: "hacked" }, { kind: "other" }]) {
      expect(parseRelayedSetup(bad)).toBeNull();
    }
  });
});

describe("callGithubApi", () => {
  it("posts the body with the person's token and returns the answer", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    expect(await callGithubApi("https://api.example.com", "tok", "/v1/integrations/github/result", { token: "t" }, fetchMock as never)).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/integrations/github/result");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(init.body).toBe(JSON.stringify({ token: "t" }));
  });

  it("is null for a refusal, a server error or a network failure, and does not retry", async () => {
    const refused = vi.fn(async () => new Response("{}", { status: 401 }));
    expect(await callGithubApi("https://a", "t", "/p", {}, refused as never)).toBeNull();
    const broken = vi.fn(async () => {
      throw new Error("down");
    });
    expect(await callGithubApi("https://a", "t", "/p", {}, broken as never)).toBeNull();
    expect(refused).toHaveBeenCalledTimes(1);
    expect(broken).toHaveBeenCalledTimes(1);
  });
});
