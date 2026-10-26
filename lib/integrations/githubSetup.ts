import { randomBytes } from "node:crypto";
import db from "@/lib/db";
import {
  type GithubAppConfig,
  type GithubInstallation,
  exchangeGithubUserCode,
  fetchGithubInstallation,
  githubAuthorizeUrl,
  githubCodeChallenge,
  githubSetupRedirectUri,
  listUserInstallations,
  readGithubState,
  signGithubState,
} from "@/lib/integrations/githubApp";
import {
  type GithubSetupOutcome,
  consumeGithubAttempt,
  createGithubAttempt,
  installationClaimBlock,
  markGithubAttemptAuthorizing,
  markGithubAttemptChoosing,
  markGithubAttemptRequested,
  readGithubChoices,
  rememberGithubResult,
  refreshOwnedGithubInstallation,
  saveGithubInstallation,
  supersedeGithubAttempts,
} from "@/lib/integrations/githubConnection";

const INSTALLATION_ID = /^\d{1,20}$/;

export type GithubSetupResponse =
  | { kind: "sign-in" }
  | { kind: "external"; url: string }
  | {
    kind: "redirect";
    outcome: GithubSetupOutcome;
    organizationId: string | null;
    resultToken: string | null;
  };

type Attempt = NonNullable<Awaited<ReturnType<typeof findAttempt>>>;

export async function startGithubInstall(config: GithubAppConfig, organizationId: string, userId: string) {
  await supersedeGithubAttempts(organizationId);
  const attempt = await createGithubAttempt({ organizationId, userId, status: "open" });
  return signGithubState(config.webhookSecret, {
    organizationId,
    userId,
    nonce: attempt.nonce,
  });
}

export async function startGithubFinish(config: GithubAppConfig, organizationId: string, userId: string) {
  const pending = await db.organizationGithubInstallAttempt.findFirst({
    where: { organizationId, status: "requested", expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  const redirectUri = githubSetupRedirectUri();
  if (!pending || !redirectUri) return null;
  await supersedeGithubAttempts(organizationId);
  const codeVerifier = randomBytes(32).toString("base64url");
  const attempt = await createGithubAttempt({
    organizationId,
    userId,
    status: "authorizing",
    codeVerifier,
  });
  return authorizeUrl(config, redirectUri, attempt.organizationId, attempt.userId, attempt.nonce, codeVerifier);
}

export async function chooseGithubInstallation(
  config: GithubAppConfig,
  organizationId: string,
  userId: string,
  installationId: string,
) {
  if (!INSTALLATION_ID.test(installationId)) return { ok: false as const };
  const attempt = await db.organizationGithubInstallAttempt.findFirst({
    where: { organizationId, userId, status: "choosing", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  const choices = readGithubChoices(attempt?.choices);
  if (!attempt || !choices.some((choice) => choice.installationId === installationId)) {
    return { ok: false as const };
  }
  const allowed = await assertClaimable(installationId, choices.map((choice) => choice.installationId), organizationId);
  if (!allowed) return { ok: false as const };
  const installation = await fetchGithubInstallation(config, installationId);
  const saved = await saveGithubInstallation({
    organizationId,
    userId,
    installation,
  }, config);
  if (!saved.ok) return { ok: false as const };
  await consumeGithubAttempt(attempt.id);
  return { ok: true as const };
}

export async function handleGithubSetup(
  input: {
    state: string | null;
    installationId: string | null;
    setupAction: string | null;
    code: string | null;
    oauthError: string | null;
    sessionUserId: string | null;
  },
  config: GithubAppConfig | null,
): Promise<GithubSetupResponse> {
  if (!config) return redirect("error", null, null);
  if (!input.sessionUserId) return { kind: "sign-in" };
  const sessionUserId = input.sessionUserId;

  if (input.setupAction === "update" && !input.code) {
    return refreshUpdate(input.installationId, sessionUserId, config);
  }

  const attempt = await findAttempt(config, input.state, sessionUserId);
  if (!attempt) return result(sessionUserId, null, "error");

  if (input.code || input.oauthError) {
    return finishAuthorization(input, attempt, sessionUserId, config);
  }
  if (input.setupAction === "request") {
    if (attempt.status !== "open") return result(sessionUserId, attempt.organizationId, "error");
    await markGithubAttemptRequested(attempt.id);
    return result(sessionUserId, attempt.organizationId, "requested");
  }
  if (attempt.status === "requested") {
    return result(sessionUserId, attempt.organizationId, "requested");
  }
  if (attempt.status !== "open") return result(sessionUserId, attempt.organizationId, "error");

  const installationId = input.installationId ?? "";
  if (!INSTALLATION_ID.test(installationId)) return result(sessionUserId, attempt.organizationId, "error");
  const redirectUri = githubSetupRedirectUri();
  if (!redirectUri) return result(sessionUserId, attempt.organizationId, "error");
  const codeVerifier = randomBytes(32).toString("base64url");
  await markGithubAttemptAuthorizing(attempt.id, installationId, codeVerifier);
  return {
    kind: "external",
    url: authorizeUrl(config, redirectUri, attempt.organizationId, attempt.userId, attempt.nonce, codeVerifier),
  };
}

async function refreshUpdate(
  installationId: string | null,
  sessionUserId: string,
  config: GithubAppConfig,
): Promise<GithubSetupResponse> {
  if (!installationId || !INSTALLATION_ID.test(installationId)) return result(sessionUserId, null, "error");
  try {
    const refreshed = await refreshOwnedGithubInstallation(config, installationId, sessionUserId);
    if (!refreshed.ok) return result(sessionUserId, null, "error");
    return result(sessionUserId, refreshed.organizationId, "updated");
  } catch {
    return result(sessionUserId, null, "error");
  }
}

async function finishAuthorization(
  input: { code: string | null; oauthError: string | null },
  attempt: Attempt,
  sessionUserId: string,
  config: GithubAppConfig,
): Promise<GithubSetupResponse> {
  if (attempt.status !== "authorizing" || !attempt.codeVerifier) {
    return result(sessionUserId, attempt.organizationId, "error");
  }
  if (input.oauthError || !input.code) {
    await consumeGithubAttempt(attempt.id);
    return result(sessionUserId, attempt.organizationId, "error");
  }
  const redirectUri = githubSetupRedirectUri();
  if (!redirectUri) {
    await consumeGithubAttempt(attempt.id);
    return result(sessionUserId, attempt.organizationId, "error");
  }
  try {
    const accessToken = await exchangeGithubUserCode(config, input.code, redirectUri, attempt.codeVerifier);
    const installations = await listUserInstallations(accessToken);
    await db.organizationGithubInstallAttempt.update({
      where: { id: attempt.id },
      data: { codeVerifier: null },
    });
    if (attempt.candidateInstallationId) {
      return claimCandidate(attempt, installations, sessionUserId, config);
    }
    return claimVisibleInstallations(attempt, installations, sessionUserId, config);
  } catch {
    await consumeGithubAttempt(attempt.id);
    return result(sessionUserId, attempt.organizationId, "error");
  }
}

async function claimCandidate(
  attempt: Attempt,
  installations: GithubInstallation[],
  sessionUserId: string,
  config: GithubAppConfig,
): Promise<GithubSetupResponse> {
  const installationId = attempt.candidateInstallationId ?? "";
  const allowed = await assertClaimable(
    installationId,
    installations.map((item) => item.id),
    attempt.organizationId,
  );
  if (!allowed) {
    await consumeGithubAttempt(attempt.id);
    return result(sessionUserId, attempt.organizationId, "error");
  }
  const saved = await saveFetchedInstallation(config, attempt.organizationId, sessionUserId, installationId);
  await consumeGithubAttempt(attempt.id);
  return result(sessionUserId, attempt.organizationId, saved ? "connected" : "error");
}

async function claimVisibleInstallations(
  attempt: Attempt,
  installations: GithubInstallation[],
  sessionUserId: string,
  config: GithubAppConfig,
): Promise<GithubSetupResponse> {
  const ids = installations.map((item) => item.id);
  const [taken, retired] = ids.length === 0 ? [[], []] : await Promise.all([
    db.organizationGithubConnection.findMany({
      where: { installationId: { in: ids } },
      select: { installationId: true, organizationId: true },
    }),
    db.retiredGithubInstallation.findMany({
      where: { installationId: { in: ids } },
      select: { installationId: true },
    }),
  ]);
  const takenBy = new Map(taken.map((row) => [row.installationId, row.organizationId]));
  const retiredIds = new Set(retired.map((row) => row.installationId));
  const claimable = installations.filter((installation) => installationClaimBlock({
    installationId: installation.id,
    userInstallationIds: ids,
    retired: retiredIds.has(installation.id),
    takenOrganizationId: takenBy.get(installation.id) ?? null,
    organizationId: attempt.organizationId,
  }) === "ok");

  if (claimable.length === 0) {
    await consumeGithubAttempt(attempt.id);
    return result(sessionUserId, attempt.organizationId, "waiting");
  }
  if (claimable.length > 1) {
    await markGithubAttemptChoosing(attempt.id, claimable.map((installation) => ({
      installationId: installation.id,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
    })));
    return result(sessionUserId, attempt.organizationId, "choose");
  }
  const saved = await saveFetchedInstallation(
    config,
    attempt.organizationId,
    sessionUserId,
    claimable[0].id,
  );
  await consumeGithubAttempt(attempt.id);
  return result(sessionUserId, attempt.organizationId, saved ? "connected" : "error");
}

async function saveFetchedInstallation(
  config: GithubAppConfig,
  organizationId: string,
  userId: string,
  installationId: string,
) {
  const installation = await fetchGithubInstallation(config, installationId);
  if (installation.id !== installationId) return false;
  const saved = await saveGithubInstallation({ organizationId, userId, installation }, config);
  return saved.ok;
}

async function assertClaimable(installationId: string, userInstallationIds: string[], organizationId: string) {
  const [taken, retired] = await Promise.all([
    db.organizationGithubConnection.findUnique({ where: { installationId } }),
    db.retiredGithubInstallation.findUnique({ where: { installationId } }),
  ]);
  return installationClaimBlock({
    installationId,
    userInstallationIds,
    retired: Boolean(retired),
    takenOrganizationId: taken?.organizationId ?? null,
    organizationId,
  }) === "ok";
}

async function findAttempt(config: GithubAppConfig, state: string | null, sessionUserId: string) {
  if (!state) return null;
  const parsed = readGithubState(config.webhookSecret, state);
  if (!parsed || parsed.userId !== sessionUserId) return null;
  const attempt = await db.organizationGithubInstallAttempt.findUnique({ where: { nonce: parsed.nonce } });
  if (!attempt || attempt.status === "consumed" || attempt.expiresAt.getTime() <= Date.now()) return null;
  if (attempt.organizationId !== parsed.organizationId || attempt.userId !== parsed.userId) return null;
  return attempt;
}

function authorizeUrl(
  config: GithubAppConfig,
  redirectUri: string,
  organizationId: string,
  userId: string,
  nonce: string,
  codeVerifier: string,
) {
  const state = signGithubState(config.webhookSecret, { organizationId, userId, nonce });
  return githubAuthorizeUrl(config.clientId, redirectUri, state, githubCodeChallenge(codeVerifier));
}

async function result(
  userId: string,
  organizationId: string | null,
  outcome: GithubSetupOutcome,
): Promise<GithubSetupResponse> {
  const resultToken = await rememberGithubResult(userId, organizationId, outcome);
  return { kind: "redirect", outcome, organizationId, resultToken };
}

function redirect(
  outcome: GithubSetupOutcome,
  organizationId: string | null,
  resultToken: string | null,
): GithubSetupResponse {
  return { kind: "redirect", outcome, organizationId, resultToken };
}
