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

export function isValidRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    if (origin === oauthServerConfig().issuer) return true;
  } catch {}

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) return true;
    } catch {}
  }

  return false;
}

const MCP_SCOPE_ID = /^[a-z0-9_]{20,40}$/;

export type McpAudience =
  | { kind: "canonical" }
  | { kind: "organization"; organizationId: string }
  | { kind: "board"; boardId: string };

export function isMcpScopeId(value: string) {
  return MCP_SCOPE_ID.test(value);
}

export function parseMcpResource(resource: string): McpAudience | null {
  let url: URL;
  try { url = new URL(resource); } catch { return null; }
  let origin: string;
  try { origin = oauthServerConfig().issuer; } catch { return null; }
  if (url.origin !== origin || url.username || url.password || url.search || url.hash) return null;
  if (url.pathname === "/api/mcp") return { kind: "canonical" };
  const org = /^\/api\/mcp\/org\/([a-z0-9_]{20,40})$/.exec(url.pathname);
  if (org) return { kind: "organization", organizationId: org[1] };
  const board = /^\/api\/mcp\/board\/([a-z0-9_]{20,40})$/.exec(url.pathname);
  if (board) return { kind: "board", boardId: board[1] };
  return null;
}

export function mcpResourceUrl(audience: McpAudience) {
  const { issuer, resource } = oauthServerConfig();
  if (audience.kind === "canonical") return resource;
  if (audience.kind === "organization") return `${issuer}/api/mcp/org/${audience.organizationId}`;
  return `${issuer}/api/mcp/board/${audience.boardId}`;
}

export function mcpResourceMetadataUrl(audience: McpAudience) {
  const { issuer } = oauthServerConfig();
  if (audience.kind === "canonical") return `${issuer}/.well-known/oauth-protected-resource`;
  return `${issuer}/.well-known/oauth-protected-resource${new URL(mcpResourceUrl(audience)).pathname}`;
}

export function audienceFromMetadataPath(path: string[]): McpAudience | null {
  if (path.length !== 4 || path[0] !== "api" || path[1] !== "mcp" || !isMcpScopeId(path[3] ?? "")) return null;
  if (path[2] === "org") return { kind: "organization", organizationId: path[3] };
  if (path[2] === "board") return { kind: "board", boardId: path[3] };
  return null;
}

export function mcpProtectedResourceDocument(audience: McpAudience) {
  const config = oauthServerConfig();
  return {
    resource: mcpResourceUrl(audience),
    authorization_servers: [config.issuer],
    scopes_supported: [OAUTH_SCOPE, OAUTH_WRITE_SCOPE],
    bearer_methods_supported: ["header"],
  };
}

export function credentialMatchesAudience(
  credential: { organizationId: string; boardId: string | null },
  audience: McpAudience,
) {
  if (audience.kind === "canonical") return true;
  if (audience.kind === "organization") return credential.organizationId === audience.organizationId && credential.boardId == null;
  return credential.boardId === audience.boardId;
}

export function selectionMatchesAudience(selection: string, audience: McpAudience) {
  if (audience.kind === "organization") return selection === `organization:${audience.organizationId}`;
  if (audience.kind === "board") return selection === `board:${audience.boardId}`;
  return selection.startsWith("organization:") || selection.startsWith("board:");
}

export function filterConsentScopes<TOrg extends { id: string }, TBoard extends { id: string }>(
  audience: McpAudience,
  organizations: TOrg[],
  boards: TBoard[],
) {
  if (audience.kind === "organization") {
    return { organizations: organizations.filter((item) => item.id === audience.organizationId), boards: [] as TBoard[] };
  }
  if (audience.kind === "board") {
    return { organizations: [] as TOrg[], boards: boards.filter((item) => item.id === audience.boardId) };
  }
  return { organizations, boards };
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

// Claude (claude.ai y claude.com) siempre vuelve a estas dos URL. Son fijas, así que no se
// piden al usuario: el cliente de Claude se crea con ellas y el resto sigue
// rechazándose por coincidencia exacta (parseAuthorizationRequest).
export const CLAUDE_CALLBACKS = ["https://claude.ai/api/mcp/auth_callback", "https://claude.com/api/mcp/auth_callback"] as const;
export const oauthClientName = (redirectUri: string) => (CLAUDE_CALLBACKS as readonly string[]).includes(redirectUri) ? "Claude" : "ChatGPT";

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
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new Error("Duplicate OAuth parameter");
  }
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const challenge = params.get("code_challenge") ?? "";
  if (params.get("client_id") !== client.clientId || !client.redirects.includes(redirectUri)) throw new Error("Invalid OAuth client or callback");
  if (params.get("response_type") !== "code" || params.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new Error("S256 PKCE is required");
  const audience = parseMcpResource(params.get("resource") ?? "");
  if (!audience) throw new Error("Invalid OAuth resource");
  const resource = mcpResourceUrl(audience);
  // Claude sigue el `scope` del desafío 401 (solo tickets:read) y nunca pide escritura por su cuenta.
  // Solo para sus clientes, si quien los creó activó la escritura, se ofrece igualmente la casilla de
  // la pantalla de consentimiento: la escritura sigue necesitando ese «sí» explícito en cada conexión.
  // Con ChatGPT y el cliente de despliegue se mantiene la regla estricta: solo si lo piden.
  const scopes = (params.get("scope") || (client.allowWrite ? `${OAUTH_SCOPE} ${OAUTH_WRITE_SCOPE}` : OAUTH_SCOPE)).split(/\s+/);
  if (!scopes.includes(OAUTH_SCOPE) || scopes.some((scope) => scope !== OAUTH_SCOPE && scope !== OAUTH_WRITE_SCOPE)) throw new Error("Invalid OAuth scope");
  if (scopes.includes(OAUTH_WRITE_SCOPE) && !client.allowWrite) throw new Error("This OAuth client is read-only");
  if (!state || state.length > 2048) throw new Error("Invalid OAuth state");
  return { clientId: client.clientId, redirectUri, resource, state, challenge, ...(client.ownerId ? { ownerId: client.ownerId } : {}), ...(scopes.includes(OAUTH_WRITE_SCOPE) || (client.allowWrite && oauthClientName(redirectUri) === "Claude") ? { writeRequested: true } : {}) };
}

export function authorizationCallback(request: AuthorizationRequest, result: { code: string } | { error: string }) {
  const callback = new URL(request.redirectUri);
  callback.searchParams.set("state", request.state);
  callback.searchParams.set("iss", oauthServerConfig().issuer);
  for (const [key, value] of Object.entries(result)) callback.searchParams.set(key, value);
  return callback.toString();
}
