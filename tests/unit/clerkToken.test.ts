import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClerkTokenSource } from "@/lib/apiClient";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const session = (token: string | null) => ({ getToken: vi.fn(async () => token) });

describe("createClerkTokenSource", () => {
  it("answers at once when Clerk is already loaded", async () => {
    const s = session("tok");
    const getToken = createClerkTokenSource(() => ({ loaded: true, session: s }));
    await expect(getToken()).resolves.toBe("tok");
    expect(s.getToken).toHaveBeenCalledTimes(1);
  });

  it("waits for Clerk to finish loading instead of answering with no token", async () => {
    const clerk: { loaded?: boolean; session?: ReturnType<typeof session> | null } = {};
    const getToken = createClerkTokenSource(() => clerk);
    const pending = getToken();

    await vi.advanceTimersByTimeAsync(300);
    clerk.loaded = true;
    clerk.session = session("late-token");
    await vi.advanceTimersByTimeAsync(100);

    await expect(pending).resolves.toBe("late-token");
  });

  it("gives up after the timeout and answers null, so the caller can fall back", async () => {
    const getToken = createClerkTokenSource(() => undefined, { timeoutMs: 1000 });
    const pending = getToken();
    await vi.advanceTimersByTimeAsync(1100);
    await expect(pending).resolves.toBeNull();
  });

  it("waits only once: a page without Clerk is not slowed on every request", async () => {
    const getToken = createClerkTokenSource(() => undefined, { timeoutMs: 1000 });
    const first = getToken();
    await vi.advanceTimersByTimeAsync(1100);
    await first;

    let done = false;
    getToken().then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });

  it("uses Clerk if it loads after the first wait gave up", async () => {
    const clerk: { loaded?: boolean; session?: ReturnType<typeof session> | null } = {};
    const getToken = createClerkTokenSource(() => clerk, { timeoutMs: 500 });
    const first = getToken();
    await vi.advanceTimersByTimeAsync(600);
    await expect(first).resolves.toBeNull();

    clerk.loaded = true;
    clerk.session = session("tok2");
    await expect(getToken()).resolves.toBe("tok2");
  });

  it("is null for a signed-out visitor once Clerk has loaded", async () => {
    const getToken = createClerkTokenSource(() => ({ loaded: true, session: null }));
    await expect(getToken()).resolves.toBeNull();
  });
});
