import { defineConfig, devices } from "@playwright/test";

const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = (rawBaseURL || "http://localhost:3000").replace(/\/+$/, "");
const useExternalServer = Boolean(rawBaseURL);

const parsedSlowMo = Number(process.env.SLOWMO);
const slowMo = Number.isFinite(parsedSlowMo) && parsedSlowMo > 0 ? parsedSlowMo : 0;

export default defineConfig({
  testDir: "./tests/e2e-app",
  timeout: slowMo > 0 ? 90_000 : 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: { slowMo },
  },
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: `${baseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
