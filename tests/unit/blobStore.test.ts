import { afterEach, describe, expect, it, vi } from "vitest";
import { BlobUnavailableError, createR2BlobStore, isBlobUrl, readR2Config } from "@/lib/blobStore";

afterEach(() => {
  vi.unstubAllGlobals();
});

const r2Config = {
  accountId: "acct123",
  accessKeyId: "ak_test",
  secretAccessKey: "sk_test",
  bucket: "kiki-attachments",
};

describe("Cloudflare R2 blob store", () => {
  it("validates and normalizes R2 environment configuration", () => {
    expect(readR2Config({
      R2_ACCOUNT_ID: " ACCT123 ",
      R2_ACCESS_KEY_ID: " ak_test ",
      R2_SECRET_ACCESS_KEY: " sk_test ",
      R2_BUCKET_NAME: " kiki-attachments ",
    })).toEqual(r2Config);
    expect(readR2Config({})).toBeNull();
    expect(readR2Config({
      R2_ACCOUNT_ID: "bad/acct",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_BUCKET_NAME: "kiki-attachments",
    })).toBeNull();
    expect(readR2Config({
      R2_ACCOUNT_ID: "acct123",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_BUCKET_NAME: "BadBucket",
    })).toBeNull();
  });

  it("only trusts R2 object addresses", () => {
    expect(isBlobUrl("https://acct123.r2.cloudflarestorage.com/kiki-attachments/a/b.png")).toBe(true);
    for (const url of [
      "http://acct123.r2.cloudflarestorage.com/kiki-attachments/a",
      "https://evil.test/kiki-attachments/a",
      "https://r2.cloudflarestorage.com.evil.test/kiki-attachments/a",
      "https://acct123.r2.cloudflarestorage.com/kiki-attachments",
      "https://acct123.r2.cloudflarestorage.com/kiki-attachments/a?x=1",
      "https://user:pass@acct123.r2.cloudflarestorage.com/kiki-attachments/a",
      "not a url",
    ]) {
      expect(isBlobUrl(url)).toBe(false);
    }
  });

  it("fails on use, not on creation, when R2 is not configured", async () => {
    const store = createR2BlobStore(null);
    await expect(store.put("a", Buffer.from("x"), { contentType: "text/plain" })).rejects.toBeInstanceOf(BlobUnavailableError);
    await expect(store.del("https://acct123.r2.cloudflarestorage.com/kiki-attachments/x")).rejects.toBeInstanceOf(BlobUnavailableError);
    await expect(store.read("https://acct123.r2.cloudflarestorage.com/kiki-attachments/x")).rejects.toBeInstanceOf(BlobUnavailableError);
  });

  it("does not sign or send credentials to a foreign host, account, or bucket", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const store = createR2BlobStore(r2Config);
    await expect(store.read("https://evil.test/kiki-attachments/x")).rejects.toThrow("not an R2 address");
    await expect(store.read("https://other.r2.cloudflarestorage.com/kiki-attachments/x")).rejects.toThrow("R2 account");
    await expect(store.read("https://acct123.r2.cloudflarestorage.com/other-bucket/x")).rejects.toThrow("R2 bucket");
    await expect(store.del("https://acct123.r2.cloudflarestorage.com/other-bucket/x")).rejects.toThrow("R2 bucket");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("signs PUT, GET, and DELETE requests with AWS SigV4 against the configured R2 bucket", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response("hello", { status: 200, headers: { "content-type": "text/plain" } }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const store = createR2BlobStore(r2Config);
    const putResult = await store.put("attachments/t1/my file (1).txt", Buffer.from("hello"), { contentType: "text/plain" });
    expect(putResult.url).toMatch(/^https:\/\/acct123\.r2\.cloudflarestorage\.com\/kiki-attachments\/attachments\/t1\/my%20file%20%281%29-[0-9a-f]{16}\.txt$/);

    const putCall = fetchMock.mock.calls[0]!;
    const putInit = putCall[1]!;
    const putHeaders = putInit.headers as Record<string, string>;
    expect(putInit.method).toBe("PUT");
    expect(putInit.redirect).toBe("error");
    expect(putHeaders.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=ak_test\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    expect(putHeaders["content-type"]).toBe("text/plain");
    expect(putHeaders["x-amz-content-sha256"]).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");

    const file = await store.read(putResult.url);
    expect(file?.contentType).toBe("text/plain");
    expect(await new Response(file?.body).text()).toBe("hello");
    expect((fetchMock.mock.calls[1]![1]!.headers as Record<string, string>).Authorization).toContain("SignedHeaders=host;x-amz-content-sha256;x-amz-date");

    expect(await store.read(putResult.url)).toBeNull();
    await store.del(putResult.url);
    await store.del(putResult.url);
    expect(fetchMock.mock.calls[3]![1]!.method).toBe("DELETE");
  });

  it("normalizes unencoded RFC 3986 path characters on wire URLs and keeps trailing-dot suffixes clean", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const store = createR2BlobStore(r2Config);
    const putResult = await store.put("attachments/t1/report.", Buffer.from("ok"), { contentType: "text/plain" });
    expect(putResult.url).toMatch(/\/report\.-[0-9a-f]{16}$/);

    await store.read("https://acct123.r2.cloudflarestorage.com/kiki-attachments/attachments/t1/a(1)!.txt");
    const wireUrl = String(fetchMock.mock.calls[1]![0]);
    expect(wireUrl).toBe("https://acct123.r2.cloudflarestorage.com/kiki-attachments/attachments/t1/a%281%29%21.txt");
  });
});
