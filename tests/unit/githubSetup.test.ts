import { generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Attempt = {
  id: string;
  nonce: string;
  organizationId: string;
  userId: string;
  status: string;
  candidateInstallationId: string | null;
  codeVerifier: string | null;
  choices: unknown;
  expiresAt: Date;
  createdAt: Date;
};

type Connection = {
  id: string;
  organizationId: string;
  installationId: string;
  accountLogin: string;
  accountType: string;
  accountId: string;
  connectedById: string | null;
  repositoryId: string | null;
  repositoryName: string | null;
  branch: string | null;
};

const { rows, order } = vi.hoisted(() => ({
  rows: {
    attempts: [] as Attempt[],
    connections: [] as Connection[],
    retired: [] as string[],
    results: [] as { token: string; userId: string; organizationId: string | null; outcome: string; expiresAt: Date; consumedAt: Date | null }[],
    managers: new Set<string>(),
    seq: 0,
  },
  order: [] as string[],
}));

function matchesAttempt(attempt: Attempt, where: {
  organizationId?: string;
  userId?: string;
  status?: string | { in: string[] };
  expiresAt?: { gt: Date };
  nonce?: string;
  id?: string;
}) {
  if (where.id && attempt.id !== where.id) return false;
  if (where.nonce && attempt.nonce !== where.nonce) return false;
  if (where.organizationId && attempt.organizationId !== where.organizationId) return false;
  if (where.userId && attempt.userId !== where.userId) return false;
  if (typeof where.status === "string" && attempt.status !== where.status) return false;
  if (where.status && typeof where.status === "object" && !where.status.in.includes(attempt.status)) return false;
  if (where.expiresAt?.gt && attempt.expiresAt <= where.expiresAt.gt) return false;
  return true;
}

function applyAttemptUpdate(attempt: Attempt, data: Record<string, unknown>) {
  const next = { ...data };
  if ("choices" in next && !Array.isArray(next.choices)) next.choices = null;
  Object.assign(attempt, next);
}

type AttemptStore = {
  retiredGithubInstallation: {
    upsert: (args: { where: { installationId: string } }) => Promise<unknown>;
  };
  organizationGithubConnection: {
    upsert: (args: {
      where: { organizationId: string };
      create: Omit<Connection, "id" | "repositoryId" | "repositoryName" | "branch">;
      update: Partial<Connection>;
    }) => Promise<unknown>;
  };
};

const db: {
  organizationGithubInstallAttempt: {
    create: (args: { data: Omit<Attempt, "id" | "createdAt"> }) => Promise<Attempt>;
    findUnique: (args: { where: { nonce?: string; id?: string } }) => Promise<Attempt | null>;
    findFirst: (args: { where: Parameters<typeof matchesAttempt>[1]; orderBy?: { createdAt: "desc" } }) => Promise<Attempt | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Attempt>;
    updateMany: (args: { where: Parameters<typeof matchesAttempt>[1]; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  organizationGithubConnection: AttemptStore["organizationGithubConnection"] & {
    findUnique: (args: { where: { installationId?: string; organizationId?: string } }) => Promise<Connection | null>;
    findMany: (args: { where: { installationId: { in: string[] } } }) => Promise<Connection[]>;
    update: (args: { where: { organizationId: string }; data: Partial<Connection> }) => Promise<Connection>;
    deleteMany: (args: { where: { organizationId: string } }) => Promise<{ count: number }>;
  };
  retiredGithubInstallation: AttemptStore["retiredGithubInstallation"] & {
    findUnique: (args: { where: { installationId: string } }) => Promise<{ installationId: string } | null>;
    findMany: (args: { where: { installationId: { in: string[] } } }) => Promise<{ installationId: string }[]>;
  };
  organizationGithubSetupResult: {
    create: (args: { data: { token: string; userId: string; organizationId: string | null; outcome: string; expiresAt: Date } }) => Promise<unknown>;
    findUnique: (args: { where: { token: string } }) => Promise<(typeof rows.results)[number] | null>;
    updateMany: (args: { where: { token: string; userId: string; consumedAt: null; expiresAt: { gt: Date } }; data: { consumedAt: Date } }) => Promise<{ count: number }>;
  };
  organizationMember: {
    findUnique: (args: { where: { organizationId_userId: { organizationId: string; userId: string } } }) => Promise<{ role: string } | null>;
  };
  $transaction: (input: ((tx: AttemptStore) => Promise<unknown>) | Promise<unknown>[]) => Promise<unknown>;
} = {
  organizationGithubInstallAttempt: {
    create: async ({ data }: { data: Omit<Attempt, "id" | "createdAt" | "candidateInstallationId" | "choices"> & Partial<Attempt> }) => {
      const row: Attempt = {
        id: `attempt-${rows.seq += 1}`,
        createdAt: new Date(),
        candidateInstallationId: null,
        choices: null,
        ...data,
      };
      rows.attempts.push(row);
      return row;
    },
    findUnique: async ({ where }: { where: { nonce?: string; id?: string } }) => (
      rows.attempts.find((attempt) => matchesAttempt(attempt, where)) ?? null
    ),
    findFirst: async ({ where, orderBy }: { where: Parameters<typeof matchesAttempt>[1]; orderBy?: { createdAt: "desc" } }) => {
      const found = rows.attempts.filter((attempt) => matchesAttempt(attempt, where));
      if (orderBy?.createdAt === "desc") found.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return found[0] ?? null;
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const attempt = rows.attempts.find((item) => item.id === where.id);
      if (!attempt) throw new Error("missing attempt");
      applyAttemptUpdate(attempt, data);
      return attempt;
    },
    updateMany: async ({ where, data }: { where: Parameters<typeof matchesAttempt>[1]; data: Record<string, unknown> }) => {
      let count = 0;
      for (const attempt of rows.attempts) {
        if (!matchesAttempt(attempt, where)) continue;
        applyAttemptUpdate(attempt, data);
        count += 1;
      }
      return { count };
    },
  },
  organizationGithubConnection: {
    findUnique: async ({ where }: { where: { installationId?: string; organizationId?: string } }) => (
      rows.connections.find((connection) => (
        where.installationId ? connection.installationId === where.installationId : connection.organizationId === where.organizationId
      )) ?? null
    ),
    findMany: async ({ where }: { where: { installationId: { in: string[] } } }) => (
      rows.connections.filter((connection) => where.installationId.in.includes(connection.installationId))
    ),
    update: async ({ where, data }: { where: { organizationId: string }; data: Record<string, unknown> }) => {
      const connection = rows.connections.find((item) => item.organizationId === where.organizationId);
      if (!connection) throw new Error("missing connection");
      Object.assign(connection, data);
      return connection;
    },
    upsert: async ({ where, create, update }: {
      where: { organizationId: string };
      create: Omit<Connection, "id" | "repositoryId" | "repositoryName" | "branch">;
      update: Partial<Connection>;
    }) => {
      order.push("upsert-connection");
      const existing = rows.connections.find((item) => item.organizationId === where.organizationId);
      if (!existing) {
        const row: Connection = {
          repositoryId: null,
          repositoryName: null,
          branch: null,
          ...create,
          id: `connection-${rows.seq += 1}`,
        };
        rows.connections.push(row);
        return row;
      }
      Object.assign(existing, update);
      return existing;
    },
    deleteMany: async ({ where }: { where: { organizationId: string } }) => {
      const before = rows.connections.length;
      rows.connections = rows.connections.filter((item) => item.organizationId !== where.organizationId);
      return { count: before - rows.connections.length };
    },
  },
  retiredGithubInstallation: {
    findUnique: async ({ where }: { where: { installationId: string } }) => (
      rows.retired.includes(where.installationId) ? { installationId: where.installationId } : null
    ),
    findMany: async ({ where }: { where: { installationId: { in: string[] } } }) => (
      rows.retired.filter((id) => where.installationId.in.includes(id)).map((installationId) => ({ installationId }))
    ),
    upsert: async ({ where }: { where: { installationId: string } }) => {
      order.push(`retire:${where.installationId}`);
      if (!rows.retired.includes(where.installationId)) rows.retired.push(where.installationId);
      return { installationId: where.installationId };
    },
  },
  organizationGithubSetupResult: {
    create: async ({ data }: { data: { token: string; userId: string; organizationId: string | null; outcome: string; expiresAt: Date } }) => {
      const row = { ...data, consumedAt: null };
      rows.results.push(row);
      return row;
    },
    findUnique: async ({ where }: { where: { token: string } }) => rows.results.find((item) => item.token === where.token) ?? null,
    updateMany: async ({ where, data }: { where: { token: string; userId: string; consumedAt: null; expiresAt: { gt: Date } }; data: { consumedAt: Date } }) => {
      const row = rows.results.find((item) => (
        item.token === where.token
        && item.userId === where.userId
        && item.consumedAt === null
        && item.expiresAt > where.expiresAt.gt
      ));
      if (!row) return { count: 0 };
      row.consumedAt = data.consumedAt;
      return { count: 1 };
    },
  },
  organizationMember: {
    findUnique: async ({ where }: { where: { organizationId_userId: { organizationId: string; userId: string } } }) => (
      rows.managers.has(`${where.organizationId_userId.organizationId}:${where.organizationId_userId.userId}`)
        ? { role: "owner" }
        : null
    ),
  },
  $transaction: async (input: ((tx: AttemptStore) => Promise<unknown>) | Promise<unknown>[]) => {
    if (typeof input === "function") {
      order.push("transaction-start");
      const result = await input(db);
      order.push("transaction-end");
      return result;
    }
    return Promise.all(input);
  },
};

vi.mock("@/lib/db", () => ({ default: db }));

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const config = {
  appId: "12345",
  slug: "kikiboard",
  privateKey: pem,
  webhookSecret: "webhook-secret-16",
  clientId: "Iv1.clientid",
  clientSecret: "client-secret-16",
};

const {
  chooseGithubInstallation,
  handleGithubSetup,
  startGithubInstall,
} = await import("@/lib/integrations/githubSetup");
const {
  clearGithubConnection,
  githubConnectionView,
  installationClaimBlock,
  readGithubResult,
  saveGithubInstallation,
} = await import("@/lib/integrations/githubConnection");
const { readGithubState } = await import("@/lib/integrations/githubApp");

let userInstallations: { id: number; account: { id: number; login: string; type: string } }[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  rows.attempts = [];
  rows.connections = [];
  rows.retired = [];
  rows.results = [];
  rows.managers = new Set(["org_1:user_1"]);
  rows.seq = 0;
  order.length = 0;
  userInstallations = [];
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://kikiboard.test");
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const method = init?.method ?? "GET";
    order.push(`${method} ${href}`);
    if (href.includes("/login/oauth/access_token")) return json({ access_token: "ghu_test" });
    if (href.includes("/user/installations")) return json({ installations: userInstallations });
    if (method === "DELETE") return new Response(null, { status: 204 });
    const installationId = href.split("/").pop();
    return json({
      id: Number(installationId),
      account: { id: 9, login: "acme", type: "Organization" },
    });
  }));
});

async function authorize(installationId: string) {
  const state = await startGithubInstall(config, "org_1", "user_1");
  const started = await handleGithubSetup({
    state,
    installationId,
    setupAction: "install",
    code: null,
    oauthError: null,
    sessionUserId: "user_1",
  }, config);
  expect(started.kind).toBe("external");
  if (started.kind !== "external") throw new Error("expected GitHub authorization");
  expect(new URL(started.url).origin).toBe("https://github.com");
  expect(rows.connections).toHaveLength(0);
  const nextState = new URL(started.url).searchParams.get("state") ?? "";
  return { state: nextState, started };
}

describe("installation claim rules", () => {
  it("rejects an installation the GitHub user cannot see, a retired id, and one linked elsewhere", () => {
    expect(installationClaimBlock({
      installationId: "9",
      userInstallationIds: ["4"],
      retired: false,
      takenOrganizationId: null,
      organizationId: "org_1",
    })).toBe("unproven");
    expect(installationClaimBlock({
      installationId: "9",
      userInstallationIds: ["9"],
      retired: true,
      takenOrganizationId: null,
      organizationId: "org_1",
    })).toBe("retired");
    expect(installationClaimBlock({
      installationId: "9",
      userInstallationIds: ["9"],
      retired: false,
      takenOrganizationId: "org_2",
      organizationId: "org_1",
    })).toBe("taken");
  });
});

describe("GitHub setup", () => {
  it("does not link an installation id that the authorizing GitHub user cannot access", async () => {
    const { state } = await authorize("111");
    userInstallations = [{ id: 222, account: { id: 3, login: "attacker", type: "User" } }];
    const finished = await handleGithubSetup({
      state,
      installationId: "222",
      setupAction: "install",
      code: "oauth-code",
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(finished).toMatchObject({ kind: "redirect", outcome: "error" });
    expect(rows.connections).toHaveLength(0);
  });

  it("links the stored installation when the GitHub user can access it", async () => {
    const { state } = await authorize("111");
    userInstallations = [{ id: 111, account: { id: 9, login: "acme", type: "Organization" } }];
    const finished = await handleGithubSetup({
      state,
      installationId: "999999",
      setupAction: null,
      code: "oauth-code",
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(finished).toMatchObject({ kind: "redirect", outcome: "connected", organizationId: "org_1" });
    expect(rows.connections.map((connection) => connection.installationId)).toEqual(["111"]);
  });

  it("rejects a different signed-in user and leaves the attempt open", async () => {
    const state = await startGithubInstall(config, "org_1", "user_1");
    const finished = await handleGithubSetup({
      state,
      installationId: "111",
      setupAction: "install",
      code: "oauth-code",
      oauthError: null,
      sessionUserId: "user_2",
    }, config);
    expect(finished).toMatchObject({ kind: "redirect", outcome: "error" });
    expect(order.some((entry) => entry.includes("/login/oauth/access_token"))).toBe(false);
    expect(rows.attempts.map((attempt) => attempt.status)).toEqual(["open"]);
    expect(rows.connections).toHaveLength(0);
  });

  it("records an approval request without storing an installation", async () => {
    const state = await startGithubInstall(config, "org_1", "user_1");
    const finished = await handleGithubSetup({
      state,
      installationId: null,
      setupAction: "request",
      code: null,
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(finished).toMatchObject({ kind: "redirect", outcome: "requested", organizationId: "org_1" });
    expect(rows.attempts.map((attempt) => attempt.status)).toEqual(["requested"]);
    expect(rows.connections).toHaveLength(0);
  });

  it("refreshes an installation the manager already owns and does not claim a new one", async () => {
    rows.connections.push({
      id: "connection-existing",
      organizationId: "org_1",
      installationId: "50",
      accountLogin: "old",
      accountType: "Organization",
      accountId: "1",
      connectedById: "user_1",
      repositoryId: "3",
      repositoryName: "acme/app",
      branch: "main",
    });
    const owned = await handleGithubSetup({
      state: null,
      installationId: "50",
      setupAction: "update",
      code: null,
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(owned).toMatchObject({ kind: "redirect", outcome: "updated", organizationId: "org_1" });
    expect(rows.connections).toMatchObject([{
      installationId: "50",
      accountLogin: "acme",
      repositoryName: "acme/app",
      branch: "main",
    }]);

    const unowned = await handleGithubSetup({
      state: null,
      installationId: "77",
      setupAction: "update",
      code: null,
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(unowned).toMatchObject({ kind: "redirect", outcome: "error" });
    expect(rows.connections.map((connection) => connection.installationId)).toEqual(["50"]);
  });

  it("does not link a retired installation", async () => {
    rows.retired.push("111");
    const { state } = await authorize("111");
    userInstallations = [{ id: 111, account: { id: 9, login: "acme", type: "Organization" } }];
    const finished = await handleGithubSetup({
      state,
      installationId: "111",
      setupAction: null,
      code: "oauth-code",
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    expect(finished).toMatchObject({ outcome: "error" });
    expect(rows.connections).toHaveLength(0);
  });

  it("retires the previous installation before uninstalling it", async () => {
    rows.connections.push({
      id: "connection-existing",
      organizationId: "org_1",
      installationId: "50",
      accountLogin: "old",
      accountType: "Organization",
      accountId: "1",
      connectedById: "user_1",
      repositoryId: null,
      repositoryName: null,
      branch: null,
    });
    order.length = 0;
    const saved = await saveGithubInstallation({
      organizationId: "org_1",
      userId: "user_1",
      installation: { id: "60", accountLogin: "acme", accountType: "Organization", accountId: "9" },
    }, config);
    expect(saved.ok).toBe(true);
    expect(rows.retired).toContain("50");
    expect(rows.connections.map((connection) => connection.installationId)).toEqual(["60"]);
    const retireAt = order.indexOf("retire:50");
    const committedAt = order.indexOf("transaction-end");
    const uninstallAt = order.findIndex((entry) => entry.startsWith("DELETE "));
    expect(retireAt).toBeGreaterThan(order.indexOf("transaction-start"));
    expect(retireAt).toBeLessThan(committedAt);
    expect(uninstallAt).toBeGreaterThan(committedAt);
  });

  it("refuses to delete the connection when the app secrets are missing", async () => {
    rows.connections.push({
      id: "connection-existing",
      organizationId: "org_1",
      installationId: "50",
      accountLogin: "old",
      accountType: "Organization",
      accountId: "1",
      connectedById: "user_1",
      repositoryId: null,
      repositoryName: null,
      branch: null,
    });
    await expect(clearGithubConnection("org_1", null)).rejects.toThrow(/not configured/);
    expect(rows.connections).toHaveLength(1);
  });

  it("hides the installation settings URL from members and shows a result only once", async () => {
    rows.connections.push({
      id: "connection-existing",
      organizationId: "org_1",
      installationId: "50",
      accountLogin: "acme",
      accountType: "Organization",
      accountId: "9",
      connectedById: "user_1",
      repositoryId: null,
      repositoryName: null,
      branch: null,
    });
    const memberView = await githubConnectionView("org_1");
    const managerView = await githubConnectionView("org_1", { includeSettingsUrl: true });
    expect(memberView?.settingsUrl).toBeUndefined();
    expect(managerView?.settingsUrl).toContain("/installations/50");

    const state = await startGithubInstall(config, "org_1", "user_1");
    const parsed = readGithubState(config.webhookSecret, state);
    expect(parsed?.nonce).toBeTruthy();
    const requested = await handleGithubSetup({
      state,
      installationId: null,
      setupAction: "request",
      code: null,
      oauthError: null,
      sessionUserId: "user_1",
    }, config);
    if (requested.kind !== "redirect" || !requested.resultToken) throw new Error("expected a result token");
    expect(await readGithubResult(requested.resultToken, "user_2")).toBeNull();
    expect(await readGithubResult(requested.resultToken, "user_1")).toMatchObject({ outcome: "requested" });
  });

  it("chooses only an installation that was returned for this user", async () => {
    const attempt = rows.attempts[0];
    expect(attempt).toBeUndefined();
    rows.attempts.push({
      id: "attempt-choose",
      nonce: "n".repeat(32),
      organizationId: "org_1",
      userId: "user_1",
      status: "choosing",
      candidateInstallationId: null,
      codeVerifier: null,
      choices: [{ installationId: "111", accountLogin: "acme", accountType: "Organization" }],
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    expect(await chooseGithubInstallation(config, "org_1", "user_1", "222")).toEqual({ ok: false });
    expect(rows.connections).toHaveLength(0);
    expect(await chooseGithubInstallation(config, "org_1", "user_1", "111")).toEqual({ ok: true });
    expect(rows.connections.map((connection) => connection.installationId)).toEqual(["111"]);
  });
});
