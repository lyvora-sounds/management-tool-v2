import db from "@/lib/db";
import { isBoardAdmin } from "@/lib/boardAccess";
import { requireOrganizationManager } from "@/lib/organizations";
import { createExternalAccessToken } from "@/lib/externalAccess";
import {
  ACCESS_TOKEN_SECONDS, REFRESH_TOKEN_SECONDS, OAUTH_SCOPE,
  oauthConfig, oauthHash, oauthToken, verifyPkce, type AuthorizationRequest,
} from "./oauthConfig";

export async function issueAuthorizationCode(userId: string, request: AuthorizationRequest, selection: string) {
  let organizationId: string;
  let boardId: string | null = null;
  if (selection.startsWith("board:")) {
    boardId = selection.slice(6);
    if (!(await isBoardAdmin(userId, boardId))) throw new Error("Not authorized to connect this board");
    const board = await db.board.findUnique({ where: { id: boardId }, select: { organizationId: true } });
    if (!board) throw new Error("Board not found");
    organizationId = board.organizationId;
  } else if (selection.startsWith("organization:")) {
    organizationId = selection.slice(13);
    if (!(await requireOrganizationManager(userId, organizationId))) throw new Error("Not authorized to connect this organization");
  } else {
    throw new Error("Select an organization or board");
  }
  const code = oauthToken("code_");
  const credential = createExternalAccessToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000);
  await db.externalAccessToken.create({
    data: {
      name: "ChatGPT", tokenHash: credential.hash, tokenPrefix: "OAuth",
      scopes: [OAUTH_SCOPE], organizationId, boardId, createdById: userId, expiresAt,
      oauthGrant: { create: {
        clientId: request.clientId, redirectUri: request.redirectUri, resource: request.resource,
        codeHash: oauthHash(code), codeChallenge: request.challenge,
        codeExpiresAt: new Date(Date.now() + 5 * 60 * 1000), refreshExpiresAt: expiresAt,
      } },
    },
  });
  return code;
}

export async function exchangeOAuthToken(params: URLSearchParams) {
  const config = oauthConfig();
  const grantType = params.get("grant_type");
  const isCode = grantType === "authorization_code";
  if (!isCode && grantType !== "refresh_token") return null;
  const rawToken = params.get(isCode ? "code" : "refresh_token");
  if (!rawToken || rawToken.length > 512 || params.get("resource") !== config.resource) return null;
  if (params.get("scope") && params.get("scope") !== OAUTH_SCOPE) return null;
  const hash = oauthHash(rawToken);
  const now = new Date();
  const accessToken = oauthToken("kiki_oauth_");
  const refreshToken = oauthToken("refresh_");
  // The conditional update consumes the code/refresh token exactly once, even
  // when concurrent requests both read the same grant.
  const updated = await db.$transaction(async (tx) => {
    const grant = await tx.mcpOAuthGrant.findUnique({
      where: isCode ? { codeHash: hash } : { refreshTokenHash: hash },
      include: { externalAccessToken: { include: { board: { select: { organizationId: true } } } } },
    });
    if (!grant || grant.clientId !== config.clientId || grant.resource !== config.resource || grant.refreshExpiresAt <= now) return false;
    const credential = grant.externalAccessToken;
    if (credential.revokedAt || (credential.expiresAt && credential.expiresAt <= now) || !credential.scopes.includes(OAUTH_SCOPE)) return false;
    if (credential.boardId && credential.board?.organizationId !== credential.organizationId) return false;
    if (isCode && (grant.codeExpiresAt <= now || params.get("redirect_uri") !== grant.redirectUri || !verifyPkce(params.get("code_verifier") ?? "", grant.codeChallenge))) return false;
    const accessExpiresAt = new Date(Math.min(now.getTime() + ACCESS_TOKEN_SECONDS * 1000, grant.refreshExpiresAt.getTime()));
    const result = await tx.mcpOAuthGrant.updateMany({
      where: { id: grant.id, ...(isCode ? { codeHash: hash } : { refreshTokenHash: hash }) },
      data: {
        codeHash: null, accessTokenHash: oauthHash(accessToken),
        accessExpiresAt,
        refreshTokenHash: oauthHash(refreshToken),
      },
    });
    return result.count === 1 ? Math.floor((accessExpiresAt.getTime() - now.getTime()) / 1000) : false;
  });
  if (!updated) return null;
  return { access_token: accessToken, token_type: "Bearer", expires_in: updated, refresh_token: refreshToken, scope: OAUTH_SCOPE };
}
