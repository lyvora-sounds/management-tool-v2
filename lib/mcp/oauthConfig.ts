import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_SCOPE = "tickets:read";
export const OAUTH_WRITE_SCOPE = "tickets:write";
export const ACCESS_TOKEN_SECONDS = 3600;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 3600;

// Explicit configuration avoids trusting request Host headers or arbitrary callbacks.
export function oauthServerConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("MCP OAuth is not configured");
  const url = new URL(appUrl);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("MCP OAuth requires HTTPS");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("Invalid MCP OAuth app URL");
  return { issuer: url.origin, resource: `${url.origin}/api/mcp` };
}

// Optional compatibility for installations with an existing deployment client.
export function oauthConfig() {
  const server = oauthServerConfig();
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  const redirects = process.env.MCP_OAUTH_REDIRECT_URIS?.split(",").map((uri) => uri.trim()).filter(Boolean);
  if (!clientId || !clientSecret || !redirects?.length) throw new Error("MCP OAuth is not configured");
  if (clientSecret.length < 32) throw new Error("MCP OAuth client secret must contain at least 32 characters");
  for (const uri of redirects) {
    const callback = new URL(uri);
    if (callback.protocol !== "https:" || callback.username || callback.password || callback.hash) throw new Error("Invalid MCP OAuth callback");
  }
  return { ...server, clientId, clientSecret, redirects };
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

export type OAuthClient = { clientId: string; secretHash: string; redirects: string[]; ownerId?: string; allowWrite?: boolean };

export function legacyOAuthClient(): OAuthClient {
  const config = oauthConfig();
  return { clientId: config.clientId, secretHash: oauthHash(config.clientSecret), redirects: config.redirects, allowWrite: true };
}

export function oauthClientId(request: Request, params: URLSearchParams) {
  const header = request.headers.get("authorization");
  if (!header) return params.get("client_id") ?? "";
  if (!header.startsWith("Basic ")) return "";
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const split = decoded.indexOf(":");
  return split < 0 ? "" : decodeURIComponent(decoded.slice(0, split));
}

export function authenticateOAuthClient(request: Request, params: URLSearchParams, client = legacyOAuthClient()) {
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
  return id === client.clientId && timingSafeEqual(Buffer.from(oauthHash(secret)), Buffer.from(client.secretHash));
}

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  resource: string;
  state: string;
  challenge: string;
  ownerId?: string;
  writeRequested?: boolean;
};

export function parseAuthorizationRequest(params: URLSearchParams, client = legacyOAuthClient()): AuthorizationRequest {
  const config = oauthServerConfig();
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new Error("Duplicate OAuth parameter");
  }
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const challenge = params.get("code_challenge") ?? "";
  if (params.get("client_id") !== client.clientId || !client.redirects.includes(redirectUri)) throw new Error("Invalid OAuth client or callback");
  if (params.get("response_type") !== "code" || params.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new Error("S256 PKCE is required");
  if (params.get("resource") !== config.resource) throw new Error("Invalid OAuth resource");
  const scopes = (params.get("scope") || (client.allowWrite ? `${OAUTH_SCOPE} ${OAUTH_WRITE_SCOPE}` : OAUTH_SCOPE)).split(/\s+/);
  if (!scopes.includes(OAUTH_SCOPE) || scopes.some((scope) => scope !== OAUTH_SCOPE && scope !== OAUTH_WRITE_SCOPE)) throw new Error("Invalid OAuth scope");
  if (scopes.includes(OAUTH_WRITE_SCOPE) && !client.allowWrite) throw new Error("This OAuth client is read-only");
  if (!state || state.length > 2048) throw new Error("Invalid OAuth state");
  return { clientId: client.clientId, redirectUri, resource: config.resource, state, challenge, ...(client.ownerId ? { ownerId: client.ownerId } : {}), ...(scopes.includes(OAUTH_WRITE_SCOPE) ? { writeRequested: true } : {}) };
}

export function authorizationCallback(request: AuthorizationRequest, result: { code: string } | { error: string }) {
  const callback = new URL(request.redirectUri);
  callback.searchParams.set("state", request.state);
  callback.searchParams.set("iss", oauthServerConfig().issuer);
  for (const [key, value] of Object.entries(result)) callback.searchParams.set(key, value);
  return callback.toString();
}
