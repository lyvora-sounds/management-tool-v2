import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/experimental-ct-react";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    ctPort: 3100,
    launchOptions: { slowMo: Number(process.env.SLOWMO || 0) },
    ctViteConfig: {
      resolve: {
        mainFields: ["module", "jsnext:main", "jsnext", "browser", "main"],
        conditions: ["import", "development", "browser", "module", "default"],
        alias: {
          "@": root,
          "next/navigation": path.join(root, "tests/e2e/next-navigation.ts"),
          "@hugeicons/core-free-icons": path.join(root, "node_modules/@hugeicons/core-free-icons/dist/esm/index.js"),
        },
      },
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
