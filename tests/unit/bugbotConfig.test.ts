import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = path.resolve(process.cwd());
const bugbotYamlPath = path.join(rootDir, ".cursor/config/bugbot.yaml");
const bugbotMdPath = path.join(rootDir, ".cursor/BUGBOT.md");

describe("Bugbot repository config", () => {
  it("declares oncePerPr reviews, skips drafts, and keeps autofix disabled", () => {
    const yaml = fs.readFileSync(bugbotYamlPath, "utf-8");

    expect(yaml).toMatch(/^version:\s*1\b/m);
    expect(yaml).toMatch(/^\s*drafts:\s*false\b/m);
    expect(yaml).toMatch(/^\s*frequency:\s*oncePerPr\b/m);
    expect(yaml).toMatch(/^\s*incremental:\s*true\b/m);
    expect(yaml).toMatch(/^\s*effort:\s*default\b/m);
    expect(yaml).toMatch(/^\s*mode:\s*comment\b/m);
    expect(yaml).toMatch(/^\s*riskScore:\s*true\b/m);
    expect(yaml).toMatch(/^\s*mode:\s*disabled\b/m);
  });

  it("steers reviews toward API ownership, auth, locales, and no client secrets", () => {
    const md = fs.readFileSync(bugbotMdPath, "utf-8");

    expect(md.length).toBeGreaterThan(100);
    expect(md).toMatch(/kiki-api/i);
    expect(md).toMatch(/app\/api/i);
    expect(md).toMatch(/locale|i18n|messages\//i);
    expect(md).toMatch(/secret|credential|API key/i);
    expect(md).toMatch(/canManage|authorization|board access/i);
  });
});
