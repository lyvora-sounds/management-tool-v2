import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_SCOPE = "tickets:read";
export const ACCESS_TOKEN_SECONDS = 3600;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 3600;

// Explicit configuration avoids trusting request Host headers or arbitrary callbacks.
export function oauthConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  const redirects = process.env.MCP_OAUTH_REDIRECT_URIS?.split(",").map((uri) => uri.trim()).filter(Boolean);
  if (!appUrl || !clientId || !clientSecret || !redirects?.length) throw new Error("MCP OAuth is not configured");
  if (clientSecret.length < 32) throw new Error("MCP OAuth client secret must contain at least 32 characters");
  const url = new URL(appUrl);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("MCP OAuth requires HTTPS");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("Invalid MCP OAuth app URL");
  for (const uri of redirects) {
    const callback = new URL(uri);
    if (callback.protocol !== "https:" || callback.username || callback.password || callback.hash) throw new Error("Invalid MCP OAuth callback");
  }
  return { issuer: url.origin, resource: `${url.origin}/api/mcp`, clientId, clientSecret, redirects };
}

export function oauthHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function oauthToken(prefix: string) {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export function verifyPkce(verifier: string, challenge: string) {
  return /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) &&
    createHash("sha256").update(verifier).digest("base64url") === challenge;
}

export function authenticateOAuthClient(request: Request, params: URLSearchParams) {
  const config = oauthConfig();
  let id = params.get("client_id") ?? "";
  let secret = params.get("client_secret") ?? "";
  const authorization = request.headers.get("authorization");
  if (authorization) {
    if (!authorization.startsWith("Basic ") || secret) return false;
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const split = decoded.indexOf(":");
    if (split < 0) return false;
    const basicId = decodeURIComponent(decoded.slice(0, split));
    if (id && id !== basicId) return false;
    id = basicId;
    secret = decodeURIComponent(decoded.slice(split + 1));
  }
  return id === config.clientId && timingSafeEqual(Buffer.from(oauthHash(secret)), Buffer.from(oauthHash(config.clientSecret)));
}

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  resource: string;
  state: string;
  challenge: string;
};

export function parseAuthorizationRequest(params: URLSearchParams): AuthorizationRequest {
  const config = oauthConfig();
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new Error("Duplicate OAuth parameter");
  }
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const challenge = params.get("code_challenge") ?? "";
  if (params.get("client_id") !== config.clientId || !config.redirects.includes(redirectUri)) throw new Error("Invalid OAuth client or callback");
  if (params.get("response_type") !== "code" || params.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new Error("S256 PKCE is required");
  if (params.get("resource") !== config.resource) throw new Error("Invalid OAuth resource");
  if (params.get("scope") && params.get("scope") !== OAUTH_SCOPE) throw new Error("Invalid OAuth scope");
  if (!state || state.length > 2048) throw new Error("Invalid OAuth state");
  return { clientId: config.clientId, redirectUri, resource: config.resource, state, challenge };
}

export function authorizationCallback(request: AuthorizationRequest, result: { code: string } | { error: string }) {
  const callback = new URL(request.redirectUri);
  callback.searchParams.set("state", request.state);
  callback.searchParams.set("iss", oauthConfig().issuer);
  for (const [key, value] of Object.entries(result)) callback.searchParams.set(key, value);
  return callback.toString();
}
