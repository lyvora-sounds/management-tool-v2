import { expect, test, type Page } from "@playwright/test";

function getSlowMo(): number {
  const parsed = Number(process.env.SLOWMO);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function hold(page: Page) {
  if (getSlowMo() > 0) {
    await page.waitForTimeout(1000);
  }
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context, page, baseURL }) => {
  if (process.env.PLAYWRIGHT_CLERK_DUMMY !== "1") return;
  const originUrl = baseURL ?? "http://localhost:3000";
  await context.addCookies([
    {
      name: "__clerk_db_jwt",
      value: "ci-dummy-dev-browser",
      url: originUrl,
    },
  ]);
  await page.route("https://clerk.example.com/**", (route) => route.abort());
});

test("health endpoint responds with ok and security headers", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });

  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("public and legal pages render with cookie banner acceptance persisting", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const homeResponse = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(homeResponse?.status()).toBe(200);

  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("h2").first()).toBeVisible();
  await hold(page);

  // Wait for cookie banner to hydrate on first visit, dismiss it, and verify persistence
  const cookieBanner = page
    .locator('[role="dialog"], div.fixed')
    .filter({ has: page.locator('a[href="/privacy"]') })
    .first();
  await expect(cookieBanner).toBeVisible();
  const acceptButton = cookieBanner
    .getByRole("button", { name: /accept|aceptar|tanggapin/i })
    .first();
  await acceptButton.click();
  await expect(cookieBanner).toBeHidden();
  await hold(page);

  // Walk through public pages using real navbar links
  const navRoutes = ["/functions", "/how-it-works", "/stats"] as const;
  for (const route of navRoutes) {
    await page.locator(`header nav a[href="${route}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("h1").first()).toBeVisible();
    await hold(page);
  }

  // Verify legal pages render cleanly and banner stays dismissed
  for (const legalRoute of ["/terms", "/privacy", "/cookies"] as const) {
    const response = await page.goto(legalRoute, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status(), `Expected 200 for ${legalRoute}`).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(cookieBanner).toBeHidden();
    await hold(page);
  }

  expect(pageErrors).toEqual([]);
});

test("auth routes render consent gate and dashboard redirects without 500", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const signInResponse = await page.goto("/sign-in", {
    waitUntil: "domcontentloaded",
  });
  expect(signInResponse?.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
  await hold(page);

  const signUpResponse = await page.goto("/sign-up", {
    waitUntil: "domcontentloaded",
  });
  expect(signUpResponse?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(3);
  await hold(page);

  const dashboardResponse = await page.goto("/dashboard", {
    waitUntil: "domcontentloaded",
  });
  expect(dashboardResponse?.status()).toBeLessThan(500);
  await expect(page).toHaveURL(/sign-in/i);
  await hold(page);

  expect(pageErrors).toEqual([]);
});
