import { createHash, createHmac, createSign, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000;
const GITHUB_API = "https://api.github.com";
const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN = "https://github.com/login/oauth/access_token";
const PAGE_LIMIT = 100;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

export class GithubAppError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export type GithubAppConfig = {
  appId: string;
  slug: string;
  privateKey: string;
  webhookSecret: string;
  stateSecret: string;
  clientId: string;
  clientSecret: string;
};

export type GithubState = {
  organizationId: string;
  userId: string;
  nonce: string;
};

export type GithubPage<T> = {
  items: T[];
  truncated: boolean;
};

export type GithubAccountType = "Organization" | "User";

export type GithubInstallation = {
  id: string;
  accountLogin: string;
  accountType: GithubAccountType;
  accountId: string;
};

export type GithubRepository = {
  id: string;
  fullName: string;
  defaultBranch: string;
};

export type GithubWebhookEffect =
  | { action: "delete"; installationId: string }
  | { action: "repositories-removed"; installationId: string; repositoryIds: string[] }
  | { action: "ignore" };

export function readGithubAppConfig(
  env: { [key: string]: string | undefined } = process.env,
): GithubAppConfig | null {
  const appId = env.GITHUB_APP_ID?.trim() ?? "";
  const slug = env.GITHUB_APP_SLUG?.trim() ?? "";
  const privateKey = normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY ?? "");
  const webhookSecret = env.GITHUB_APP_WEBHOOK_SECRET?.trim() ?? "";
  const stateSecret = env.GITHUB_APP_STATE_SECRET?.trim() ?? "";
  const clientId = env.GITHUB_APP_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.GITHUB_APP_CLIENT_SECRET?.trim() ?? "";
  if (!/^\d{1,20}$/.test(appId)) return null;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) return null;
  if (webhookSecret.length < 16 || stateSecret.length < 16 || clientSecret.length < 16) return null;
  if (stateSecret === webhookSecret) return null;
  if (!/^[A-Za-z0-9._-]{8,100}$/.test(clientId)) return null;
  return { appId, slug, privateKey, webhookSecret, stateSecret, clientId, clientSecret };
}

export function githubInstallUrl(slug: string, state: string): string {
  const url = new URL(`https://github.com/apps/${slug}/installations/new`);
  url.searchParams.set("state", state);
  return url.toString();
}

export function githubInstallationSettingsUrl(
  accountType: GithubAccountType,
  accountLogin: string,
  installationId: string,
): string {
  if (accountType === "Organization") {
    return `https://github.com/organizations/${encodeURIComponent(accountLogin)}/settings/installations/${encodeURIComponent(installationId)}`;
  }
  return `https://github.com/settings/installations/${encodeURIComponent(installationId)}`;
}

export function signGithubState(
  secret: string,
  input: GithubState,
  now = Date.now(),
): string {
  const payload = Buffer.from(JSON.stringify({
    organizationId: input.organizationId,
    userId: input.userId,
    nonce: input.nonce,
    exp: now + STATE_TTL_MS,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readGithubState(
  secret: string,
  state: string,
  now = Date.now(),
): GithubState | null {
  const separator = state.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = state.slice(0, separator);
  const signature = state.slice(separator + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      organizationId?: unknown;
      userId?: unknown;
      nonce?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.organizationId !== "string" || parsed.organizationId.length === 0) return null;
    if (typeof parsed.userId !== "string" || parsed.userId.length === 0) return null;
    if (typeof parsed.nonce !== "string" || !NONCE_PATTERN.test(parsed.nonce)) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < now) return null;
    return { organizationId: parsed.organizationId, userId: parsed.userId, nonce: parsed.nonce };
  } catch {
    return null;
  }
}

export function createGithubAppJwt(appId: string, privateKey: string, now = Date.now()): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iat: Math.floor(now / 1000) - 60,
    exp: Math.floor(now / 1000) + 9 * 60,
    iss: appId,
  })).toString("base64url");
  const data = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(data);
  return `${data}.${signer.sign(privateKey).toString("base64url")}`;
}

export function githubWebhookSignature(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

export function verifyGithubWebhookSignature(secret: string, body: string, header: string | null): boolean {
  if (!header) return false;
  const expected = Buffer.from(githubWebhookSignature(secret, body));
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function githubWebhookEffect(event: string, payload: unknown): GithubWebhookEffect {
  const action = payload && typeof payload === "object" && "action" in payload
    ? (payload as { action: unknown }).action
    : null;
  const installationId = installationIdFrom(payload);
  if (!installationId || typeof action !== "string") return { action: "ignore" };

  if (event === "installation" && action === "deleted") {
    return { action: "delete", installationId };
  }

  if (event === "installation_repositories" && action === "removed") {
    const removed = (payload as { repositories_removed?: unknown }).repositories_removed;
    if (!Array.isArray(removed)) return { action: "ignore" };
    const repositoryIds = removed.flatMap((item) => {
      if (!item || typeof item !== "object" || !("id" in item)) return [];
      const id = (item as { id: unknown }).id;
      return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? [String(id)] : [];
    });
    if (repositoryIds.length === 0) return { action: "ignore" };
    return { action: "repositories-removed", installationId, repositoryIds };
  }

  return { action: "ignore" };
}

export function parseGithubInstallation(body: unknown): GithubInstallation | null {
  if (!body || typeof body !== "object") return null;
  const record = body as { id?: unknown; account?: unknown };
  if (typeof record.id !== "number" || !Number.isSafeInteger(record.id) || record.id <= 0) return null;
  if (!record.account || typeof record.account !== "object") return null;
  const account = record.account as { id?: unknown; login?: unknown; type?: unknown };
  if (typeof account.id !== "number" || !Number.isSafeInteger(account.id) || account.id <= 0) return null;
  if (typeof account.login !== "string" || !/^[A-Za-z0-9-]+$/.test(account.login)) return null;
  if (account.type !== "Organization" && account.type !== "User") return null;
  return {
    id: String(record.id),
    accountId: String(account.id),
    accountLogin: account.login,
    accountType: account.type,
  };
}

export function parseGithubRepository(body: unknown): GithubRepository | null {
  if (!body || typeof body !== "object") return null;
  const repo = body as { id?: unknown; full_name?: unknown; default_branch?: unknown };
  if (typeof repo.id !== "number" || !Number.isSafeInteger(repo.id) || repo.id <= 0) return null;
  if (typeof repo.full_name !== "string" || !isRepositoryFullName(repo.full_name)) return null;
  return {
    id: String(repo.id),
    fullName: repo.full_name,
    defaultBranch: typeof repo.default_branch === "string" && repo.default_branch.length > 0
      ? repo.default_branch
      : "main",
  };
}

export function parseGithubRepositories(body: unknown): GithubRepository[] {
  const repositories = body && typeof body === "object" && "repositories" in body
    ? (body as { repositories: unknown }).repositories
    : null;
  if (!Array.isArray(repositories)) return [];
  return repositories.flatMap((item) => {
    const repo = parseGithubRepository(item);
    return repo ? [repo] : [];
  });
}

export function parseUserInstallations(body: unknown): GithubInstallation[] {
  const installations = body && typeof body === "object" && "installations" in body
    ? (body as { installations: unknown }).installations
    : null;
  if (!Array.isArray(installations)) return [];
  return installations.flatMap((item) => {
    const installation = parseGithubInstallation(item);
    return installation ? [installation] : [];
  });
}

export function parseGithubBranches(body: unknown): string[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((item) => {
    if (!item || typeof item !== "object" || !("name" in item)) return [];
    const name = (item as { name: unknown }).name;
    return typeof name === "string" && name.length > 0 && name.length <= 255 ? [name] : [];
  });
}

export function githubNextPage(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (!match) continue;
    // A forged Link header must not send the installation token anywhere else.
    if (match[1].startsWith(`${GITHUB_API}/`)) return match[1];
  }
  return null;
}

export async function fetchGithubInstallation(
  config: GithubAppConfig,
  installationId: string,
): Promise<GithubInstallation> {
  const body = await githubJson(
    createGithubAppJwt(config.appId, config.privateKey),
    `${GITHUB_API}/app/installations/${installationPathId(installationId)}`,
  );
  const installation = parseGithubInstallation(body);
  if (!installation) throw new GithubAppError("GitHub returned an unexpected installation", 502);
  return installation;
}

export async function uninstallGithubInstallation(config: GithubAppConfig, installationId: string): Promise<void> {
  const response = await fetch(`${GITHUB_API}/app/installations/${installationPathId(installationId)}`, {
    method: "DELETE",
    headers: githubHeaders(createGithubAppJwt(config.appId, config.privateKey)),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 204 || response.status === 404) return;
  throw new GithubAppError("GitHub rejected the uninstall", response.status);
}

export async function listInstallationRepositories(
  config: GithubAppConfig,
  installationId: string,
): Promise<GithubPage<GithubRepository>> {
  const token = await createInstallationToken(config, installationId);
  return collectPages(
    token,
    `${GITHUB_API}/installation/repositories?per_page=100`,
    parseGithubRepositories,
  );
}

export async function listRepositoryBranches(
  config: GithubAppConfig,
  installationId: string,
  fullName: string,
): Promise<GithubPage<string>> {
  const token = await createInstallationToken(config, installationId);
  const [owner, repo] = repositoryNameParts(fullName);
  return collectPages(
    token,
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`,
    parseGithubBranches,
  );
}

export async function fetchInstallationRepository(
  config: GithubAppConfig,
  installationId: string,
  repositoryId: string,
): Promise<GithubRepository | null> {
  if (!/^\d{1,20}$/.test(repositoryId)) throw new GithubAppError("Invalid repository", 400);
  const token = await createInstallationToken(config, installationId);
  const response = await fetch(`${GITHUB_API}/repositories/${repositoryId}`, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new GithubAppError("GitHub request failed", response.status);
  const repository = parseGithubRepository(await response.json());
  if (!repository || repository.id !== repositoryId) return null;
  return repository;
}

export async function installationHasBranch(
  config: GithubAppConfig,
  installationId: string,
  fullName: string,
  branch: string,
): Promise<boolean> {
  const token = await createInstallationToken(config, installationId);
  const response = await fetch(githubRepositoryBranchUrl(fullName, branch), {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new GithubAppError("GitHub request failed", response.status);
  return true;
}

export function githubCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function githubAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string,
): string {
  const url = new URL(GITHUB_AUTHORIZE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function githubSetupRedirectUri(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}/api/integrations/github/setup`;
  } catch {
    return null;
  }
}

export async function exchangeGithubUserCode(
  config: GithubAppConfig,
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<string> {
  const response = await fetch(GITHUB_ACCESS_TOKEN, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null) as { access_token?: unknown } | null;
  if (!response.ok || !body || typeof body.access_token !== "string" || body.access_token.length === 0) {
    throw new GithubAppError("GitHub rejected the user authorization", 401);
  }
  return body.access_token;
}

export async function listUserInstallations(accessToken: string): Promise<GithubInstallation[]> {
  const page = await collectPages(
    accessToken,
    `${GITHUB_API}/user/installations?per_page=100`,
    parseUserInstallations,
  );
  return page.items;
}

export function githubRepositoryBranchUrl(fullName: string, branch: string): string {
  const [owner, repo] = repositoryNameParts(fullName);
  if (branch.length === 0 || branch.length > 255 || branch === "." || branch === "..") {
    throw new GithubAppError("Invalid branch", 400);
  }
  const prefix = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/`;
  const url = new URL(`${GITHUB_API}${prefix}${encodeURIComponent(branch)}`);
  if (url.origin !== "https://api.github.com" || !url.pathname.startsWith(prefix)) {
    throw new GithubAppError("Invalid branch", 400);
  }
  if (decodeURIComponent(url.pathname.slice(prefix.length)) !== branch) {
    throw new GithubAppError("Invalid branch", 400);
  }
  return url.toString();
}

async function createInstallationToken(config: GithubAppConfig, installationId: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}/app/installations/${installationPathId(installationId)}/access_tokens`, {
    method: "POST",
    headers: {
      ...githubHeaders(createGithubAppJwt(config.appId, config.privateKey)),
      "Content-Type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new GithubAppError("GitHub rejected the installation token", response.status);
  const body = await response.json() as { token?: unknown };
  if (typeof body.token !== "string" || body.token.length === 0) {
    throw new GithubAppError("GitHub returned no installation token", 502);
  }
  return body.token;
}

async function githubJson(token: string, url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new GithubAppError("GitHub request failed", response.status);
  return response.json();
}

async function collectPages<T>(
  token: string,
  firstUrl: string,
  parse: (body: unknown) => T[],
): Promise<GithubPage<T>> {
  const items: T[] = [];
  let url: string | null = firstUrl;
  let truncated = false;
  for (let page = 0; page < PAGE_LIMIT && url; page += 1) {
    const response = await fetch(url, {
      headers: githubHeaders(token),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new GithubAppError("GitHub request failed", response.status);
    items.push(...parse(await response.json()));
    const next = githubNextPage(response.headers.get("link"));
    if (next && page === PAGE_LIMIT - 1) {
      truncated = true;
      url = null;
    } else {
      url = next;
    }
  }
  return { items, truncated };
}

function isRepositoryPart(value: string) {
  return value !== "." && value !== ".." && /^[A-Za-z0-9._-]+$/.test(value);
}

function isRepositoryFullName(fullName: string) {
  const parts = fullName.split("/");
  return parts.length === 2 && isRepositoryPart(parts[0]) && isRepositoryPart(parts[1]);
}

function repositoryNameParts(fullName: string): [string, string] {
  if (!isRepositoryFullName(fullName)) throw new GithubAppError("Invalid repository", 400);
  const [owner, repo] = fullName.split("/");
  return [owner, repo];
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "Kikiboard",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function installationPathId(installationId: string): string {
  if (!/^\d{1,20}$/.test(installationId)) throw new GithubAppError("Invalid installation", 400);
  return installationId;
}

function installationIdFrom(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("installation" in payload)) return null;
  const installation = (payload as { installation: unknown }).installation;
  if (!installation || typeof installation !== "object" || !("id" in installation)) return null;
  const id = (installation as { id: unknown }).id;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return null;
  return String(id);
}

function normalizePrivateKey(value: string): string {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return "";
  const decoded = trimmed.includes("BEGIN")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");
  return decoded.replace(/\\n/g, "\n");
}
