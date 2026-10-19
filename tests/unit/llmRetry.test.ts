import { afterEach, describe, expect, it, vi } from "vitest";
import { isRetryableLlmError, queryLlm } from "@/lib/ai/engine";

const creds = { provider: "openai" as const, apiKey: "k" };
const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 });
const fail = (status: number) => new Response("busy", { status });

afterEach(() => vi.unstubAllGlobals());

describe("isRetryableLlmError", () => {
  it("retries on rate limits and server errors only", () => {
    for (const status of [429, 500, 502, 503, 504]) expect(isRetryableLlmError(new Error(`Error de GEMINI (${status}): x`))).toBe(true);
    for (const status of [400, 401, 404]) expect(isRetryableLlmError(new Error(`Error de GEMINI (${status}): x`))).toBe(false);
    expect(isRetryableLlmError("nope")).toBe(false);
  });
});

describe("queryLlm retries", () => {
  it("recovers after a transient 503", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(fail(503)).mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    await expect(queryLlm("s", "u", creds, [0, 0])).resolves.toBe("{}");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("gives up after the configured retries", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => fail(503));
    vi.stubGlobal("fetch", fetchMock);
    await expect(queryLlm("s", "u", creds, [0, 0])).rejects.toThrow("503");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("does not retry client errors", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => fail(401));
    vi.stubGlobal("fetch", fetchMock);
    await expect(queryLlm("s", "u", creds, [0, 0])).rejects.toThrow("401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
