import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = path.resolve(process.cwd());

describe("container image build configuration", () => {
  it("exposes required NEXT_PUBLIC_* build arguments and env vars in Dockerfile", () => {
    const dockerfile = fs.readFileSync(path.join(rootDir, "Dockerfile"), "utf-8");

    for (const variable of [
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_API_URL",
    ]) {
      expect(dockerfile).toContain(`ARG ${variable}`);
      expect(dockerfile).toMatch(new RegExp(`${variable}=\\$${variable}`));
    }
  });

  it("passes NEXT_PUBLIC_API_URL in both CI smoke build and staging deploy build", () => {
    const workflow = fs.readFileSync(
      path.join(rootDir, ".github/workflows/image.yml"),
      "utf-8",
    );

    const apiUrlMatches = workflow.match(/NEXT_PUBLIC_API_URL=/g) ?? [];
    expect(apiUrlMatches.length).toBeGreaterThanOrEqual(2);
    expect(workflow).toContain("NEXT_PUBLIC_APP_URL=");
    expect(workflow).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=");
  });
});
