import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  createGithubAppJwt,
  githubInstallUrl,
  githubNextPage,
  githubRepositoryBranchUrl,
  githubWebhookEffect,
  githubWebhookSignature,
  listInstallationRepositories,
  parseGithubBranches,
  parseGithubInstallation,
  parseGithubRepositories,
  parseUserInstallations,
  readGithubAppConfig,
  readGithubState,
  signGithubState,
  verifyGithubWebhookSignature,
} from "@/lib/integrations/githubApp";

const SECRET = "webhook-secret-16";

describe("readGithubAppConfig", () => {
  it("accepts a PEM with escaped newlines and rejects a short webhook secret", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const config = readGithubAppConfig({
      GITHUB_APP_ID: "12345",
      GITHUB_APP_SLUG: "kikiboard",
      GITHUB_APP_PRIVATE_KEY: pem.replace(/\n/g, "\\n"),
      GITHUB_APP_WEBHOOK_SECRET: SECRET,
      GITHUB_APP_CLIENT_ID: "Iv1.clientid",
      GITHUB_APP_CLIENT_SECRET: SECRET,
    });
    expect(config?.appId).toBe("12345");
    expect(config?.privateKey).toContain("BEGIN PRIVATE KEY");
    expect(readGithubAppConfig({
      GITHUB_APP_ID: "12345",
      GITHUB_APP_SLUG: "kikiboard",
      GITHUB_APP_PRIVATE_KEY: pem,
      GITHUB_APP_WEBHOOK_SECRET: "short",
      GITHUB_APP_CLIENT_ID: "Iv1.clientid",
      GITHUB_APP_CLIENT_SECRET: SECRET,
    })).toBeNull();
    expect(readGithubAppConfig({
      GITHUB_APP_ID: "12345",
      GITHUB_APP_SLUG: "kikiboard",
      GITHUB_APP_PRIVATE_KEY: pem,
      GITHUB_APP_WEBHOOK_SECRET: SECRET,
      GITHUB_APP_CLIENT_ID: "Iv1.clientid",
      GITHUB_APP_CLIENT_SECRET: "short",
    })).toBeNull();
    expect(readGithubAppConfig({
      GITHUB_APP_ID: "12345",
      GITHUB_APP_SLUG: "../evil",
      GITHUB_APP_PRIVATE_KEY: pem,
      GITHUB_APP_WEBHOOK_SECRET: SECRET,
      GITHUB_APP_CLIENT_ID: "Iv1.clientid",
      GITHUB_APP_CLIENT_SECRET: SECRET,
    })).toBeNull();
  });
});

describe("GitHub install state", () => {
  it("round-trips the organization and user, and rejects tampering and expiry", () => {
    const now = 1_700_000_000_000;
    const nonce = "n".repeat(32);
    const state = signGithubState(SECRET, { organizationId: "org_1", userId: "user_1", nonce }, now);
    expect(readGithubState(SECRET, state, now + 1_000)).toEqual({ organizationId: "org_1", userId: "user_1", nonce });
    expect(readGithubState(SECRET, state, now + 11 * 60 * 1000)).toBeNull();
    expect(readGithubState("other-webhook-secret", state, now)).toBeNull();
    expect(readGithubState(SECRET, `${state}x`, now)).toBeNull();
    expect(githubInstallUrl("kikiboard", state)).toBe(
      `https://github.com/apps/kikiboard/installations/new?state=${encodeURIComponent(state)}`,
    );
  });
});

describe("GitHub App JWT", () => {
  it("signs an RS256 token whose issuer is the app id", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const token = createGithubAppJwt("99", pem, 1_700_000_000_000);
    const [header, payload, signature] = token.split(".");
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    expect(verifier.verify(publicKey, signature, "base64url")).toBe(true);
    expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).iss).toBe("99");
  });
});

describe("GitHub webhook", () => {
  it("accepts the matching signature and ignores unrelated events", () => {
    const body = JSON.stringify({ action: "deleted", installation: { id: 7 } });
    const signature = githubWebhookSignature(SECRET, body);
    expect(verifyGithubWebhookSignature(SECRET, body, signature)).toBe(true);
    expect(verifyGithubWebhookSignature(SECRET, body, "sha256=nope")).toBe(false);
    expect(githubWebhookEffect("installation", JSON.parse(body))).toEqual({
      action: "delete",
      installationId: "7",
    });
    expect(githubWebhookEffect("installation_repositories", {
      action: "removed",
      installation: { id: 7 },
      repositories_removed: [{ id: 42 }, { id: 0 }, { name: "skip" }],
    })).toEqual({
      action: "repositories-removed",
      installationId: "7",
      repositoryIds: ["42"],
    });
    expect(githubWebhookEffect("ping", { zen: "ok" })).toEqual({ action: "ignore" });
    expect(githubWebhookEffect("installation", { action: "suspend", installation: { id: 7 } })).toEqual({
      action: "ignore",
    });
    expect(githubWebhookEffect("installation", { action: "created", installation: { id: 7 } })).toEqual({
      action: "ignore",
    });
  });
});

describe("GitHub payload parsers", () => {
  it("keeps valid installations, repositories, branches, and next links", () => {
    expect(parseGithubInstallation({
      id: 5,
      account: { id: 9, login: "acme", type: "Organization" },
    })).toEqual({
      id: "5",
      accountId: "9",
      accountLogin: "acme",
      accountType: "Organization",
    });
    expect(parseGithubInstallation({ id: 5, account: { id: 9, login: "a/b", type: "User" } })).toBeNull();
    expect(parseGithubRepositories({
      repositories: [
        { id: 3, full_name: "acme/app", default_branch: "develop" },
        { id: 4, full_name: "not a repo" },
      ],
    })).toEqual([{ id: "3", fullName: "acme/app", defaultBranch: "develop" }]);
    expect(parseGithubBranches([{ name: "main" }, { name: "" }, { other: true }])).toEqual(["main"]);
    expect(githubNextPage('<https://api.github.com/installation/repositories?page=2>; rel="next"')).toBe(
      "https://api.github.com/installation/repositories?page=2",
    );
    expect(githubNextPage('<https://evil.example/steal>; rel="next"')).toBeNull();
    expect(parseUserInstallations({
      installations: [{ id: 8, account: { id: 2, login: "octocat", type: "User" } }, { id: 0 }],
    })).toEqual([{
      id: "8",
      accountId: "2",
      accountLogin: "octocat",
      accountType: "User",
    }]);
    expect(githubRepositoryBranchUrl("acme/app", "feature/login")).toBe(
      "https://api.github.com/repos/acme/app/branches/feature%2Flogin",
    );
    expect(() => githubRepositoryBranchUrl("acme/app", "..")).toThrow(/Invalid branch/);
  });

  it("follows every GitHub page until the next link ends", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    let page = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/access_tokens")) {
        return Response.json({ token: "ghs_test" });
      }
      page += 1;
      const next = page < 2
        ? `<https://api.github.com/installation/repositories?page=${page + 1}>; rel="next"`
        : "";
      return new Response(JSON.stringify({
        repositories: [{ id: page, full_name: `acme/repo-${page}`, default_branch: "main" }],
      }), { status: 200, headers: next ? { link: next } : {} });
    }));
    const listed = await listInstallationRepositories({
      appId: "12345",
      slug: "kikiboard",
      privateKey: pem,
      webhookSecret: SECRET,
      clientId: "Iv1.clientid",
      clientSecret: SECRET,
    }, "15");
    expect(listed.items.map((item) => item.fullName)).toEqual(["acme/repo-1", "acme/repo-2"]);
    expect(listed.truncated).toBe(false);
    vi.unstubAllGlobals();
  });
});
