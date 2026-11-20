import { createHash, createHmac, randomBytes } from "node:crypto";

/** Raised when R2 storage is not configured: uploading and downloading then fail, nothing else does. */
export class BlobUnavailableError extends Error {
  constructor() {
    super("R2 storage is not configured");
  }
}

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export type BlobFile = {
  /** Null when the object answered with no body. */
  body: ReadableStream<Uint8Array> | null;
  contentType: string | null;
};

/** Where attachment files live. */
export interface BlobStore {
  /** Without a `contentType` the store defaults to `application/octet-stream`. */
  put(pathname: string, body: Buffer, options?: { contentType?: string }): Promise<{ url: string }>;
  del(url: string): Promise<void>;
  /** The stored file, or null when the store has no such object. Throws when the store cannot be reached. */
  read(url: string, options?: { signal?: AbortSignal }): Promise<BlobFile | null>;
}

const ACCOUNT_ID_PATTERN = /^[a-z0-9-]+$/;
const BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const R2_HOST_PATTERN = /^[a-z0-9-]+\.r2\.cloudflarestorage\.com$/;
const R2_REGION = "auto";
const R2_SERVICE = "s3";

export function readR2Config(
  env: { [key: string]: string | undefined } = process.env,
): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim().toLowerCase() ?? "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = env.R2_BUCKET_NAME?.trim() ?? "";
  if (!ACCOUNT_ID_PATTERN.test(accountId)) return null;
  if (!accessKeyId || !secretAccessKey || /\s/.test(accessKeyId) || /\s/.test(secretAccessKey)) return null;
  if (!BUCKET_NAME_PATTERN.test(bucket)) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !R2_HOST_PATTERN.test(u.hostname)) return false;
    if (u.username || u.password || u.port || u.search || u.hash) return false;
    const segments = u.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

function assertConfiguredR2Url(url: string, config: R2Config): URL {
  if (!isBlobUrl(url)) throw new Error("attachment url is not an R2 address");
  const u = new URL(url);
  const expectedHost = `${config.accountId}.r2.cloudflarestorage.com`;
  if (u.hostname !== expectedHost) {
    throw new Error("attachment url does not match configured R2 account");
  }
  const segments = u.pathname.slice(1).split("/");
  const bucket = segments[0] ? decodeSegment(segments[0]) : "";
  if (bucket !== config.bucket || segments.slice(1).every((segment) => segment.length === 0)) {
    throw new Error("attachment url does not match configured R2 bucket");
  }
  return u;
}

function addRandomSuffix(pathname: string): string {
  const segments = pathname
    .split(/[\\/]+/)
    .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");
  const last = segments.pop() ?? "file";
  const dot = last.lastIndexOf(".");
  const suffix = randomBytes(8).toString("hex");
  const stamped = dot > 0 && dot < last.length - 1
    ? `${last.slice(0, dot)}-${suffix}${last.slice(dot)}`
    : `${last}-${suffix}`;
  return [...segments, stamped].join("/");
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function signR2Request(
  config: R2Config,
  method: "PUT" | "GET" | "DELETE",
  target: URL,
  payloadHash: string,
  contentType?: string,
  now = new Date(),
): Record<string, string> {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = target.pathname
    .split("/")
    .map((segment) => encodeRfc3986(decodeSegment(segment)))
    .join("/");
  target.pathname = canonicalUri;

  const headerPairs: [string, string][] = [
    ...(contentType ? [["content-type", contentType] as [string, string]] : []),
    ["host", target.host],
    ["x-amz-content-sha256", payloadHash],
    ["x-amz-date", amzDate],
  ];
  headerPairs.sort(([a], [b]) => a.localeCompare(b));

  const canonicalHeaders = headerPairs.map(([k, v]) => `${k}:${v.trim()}\n`).join("");
  const signedHeaders = headerPairs.map(([k]) => k).join(";");
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, R2_REGION);
  const kService = hmacSha256(kRegion, R2_SERVICE);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    ...(contentType ? { "content-type": contentType } : {}),
  };
}

/** Private objects in Cloudflare R2 via S3-compatible API. Created without config, it fails on first use. */
export function createR2BlobStore(config: R2Config | null): BlobStore {
  const need = () => {
    if (!config) throw new BlobUnavailableError();
    return config;
  };
  return {
    async put(pathname, body, options = {}) {
      const cfg = need();
      const key = addRandomSuffix(pathname);
      const encodedPath = `/${encodeRfc3986(cfg.bucket)}/${key.split("/").map(encodeRfc3986).join("/")}`;
      const target = new URL(`https://${cfg.accountId}.r2.cloudflarestorage.com${encodedPath}`);
      const resolvedType = options.contentType || "application/octet-stream";
      const payload = new Uint8Array(body);
      const headers = signR2Request(cfg, "PUT", target, sha256Hex(payload), resolvedType);
      const response = await fetch(target, {
        method: "PUT",
        headers,
        body: payload,
        redirect: "error",
      });
      await response.body?.cancel().catch(() => {});
      if (!response.ok) throw new Error(`R2 answered ${response.status}`);
      return { url: target.toString() };
    },
    async del(url) {
      const cfg = need();
      const target = assertConfiguredR2Url(url, cfg);
      const headers = signR2Request(cfg, "DELETE", target, sha256Hex(""));
      const response = await fetch(target, {
        method: "DELETE",
        headers,
        redirect: "error",
      });
      await response.body?.cancel().catch(() => {});
      if (response.status === 404) return;
      if (!response.ok) throw new Error(`R2 answered ${response.status}`);
    },
    async read(url, options) {
      const cfg = need();
      const target = assertConfiguredR2Url(url, cfg);
      const headers = signR2Request(cfg, "GET", target, sha256Hex(""));
      const response = await fetch(target, {
        method: "GET",
        headers,
        redirect: "error",
        ...(options?.signal ? { signal: options.signal } : {}),
      });
      if (response.status === 404) {
        await response.body?.cancel().catch(() => {});
        return null;
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new Error(`R2 answered ${response.status}`);
      }
      return { body: response.body, contentType: response.headers.get("content-type") };
    },
  };
}

function defaultStore(): BlobStore {
  return createR2BlobStore(readR2Config(process.env));
}

export async function putBlob(
  pathname: string,
  body: Buffer,
  options?: { contentType?: string },
): Promise<{ url: string }> {
  return defaultStore().put(pathname, body, options);
}

export async function delBlob(url: string): Promise<void> {
  return defaultStore().del(url);
}

export async function readBlob(
  url: string,
  options?: { signal?: AbortSignal },
): Promise<BlobFile | null> {
  return defaultStore().read(url, options);
}
