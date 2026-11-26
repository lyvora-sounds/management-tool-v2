import { expect, test } from "@playwright/experimental-ct-react";
import { CookieConsentStory, SignUpConsentStory } from "./stories";

test.describe.configure({ mode: "serial" });

test("CookieBanner enforces prior opt-in, Escape handling, clears optional storage on reject, and saves custom consent", async ({
  mount,
  page,
}) => {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem("recent_boards", '["board-1"]');
    window.localStorage.setItem("kiki.hierarchy.open", "1");
    document.cookie = "sidebar_state=true; path=/; samesite=lax";
  });

  await mount(<CookieConsentStory />);

  const banner = page.getByRole("dialog", { name: "Cookie preferences" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("KikiBoard");

  // Confirm seeded optional keys exist before rejection
  const beforeReject = await page.evaluate(() => ({
    recentBoards: window.localStorage.getItem("recent_boards"),
    hierarchyOpen: window.localStorage.getItem("kiki.hierarchy.open"),
    cookies: document.cookie,
  }));
  expect(beforeReject.recentBoards).toBe('["board-1"]');
  expect(beforeReject.hierarchyOpen).toBe("1");
  expect(beforeReject.cookies).toContain("sidebar_state=true");

  // Open Customize modal -> functional checkbox must be unchecked by default
  await banner.getByRole("button", { name: "Customize" }).click();
  const modal = page.getByRole("dialog", { name: "Cookie & storage preferences" });
  await expect(modal).toBeVisible();
  const functionalCheckbox = modal.getByRole("checkbox");
  await expect(functionalCheckbox).not.toBeChecked();

  // Pressing Escape without saving returns to banner because no consent exists yet
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(banner).toBeVisible();

  // Rejecting non-essential storage saves choice and clears optional localStorage/cookies
  await banner.getByRole("button", { name: "Reject non-essential" }).click();
  await expect(banner).toBeHidden();

  const afterReject = await page.evaluate(() => ({
    consent: JSON.parse(window.localStorage.getItem("cookie_consent_v2") ?? "null"),
    recentBoards: window.localStorage.getItem("recent_boards"),
    hierarchyOpen: window.localStorage.getItem("kiki.hierarchy.open"),
    cookies: document.cookie,
  }));
  expect(afterReject.consent?.necessary).toBe(true);
  expect(afterReject.consent?.functional).toBe(false);
  expect(afterReject.consent?.analytics).toBe(false);
  expect(afterReject.consent?.marketing).toBe(false);
  expect(afterReject.recentBoards).toBeNull();
  expect(afterReject.hierarchyOpen).toBeNull();
  expect(afterReject.cookies).not.toContain("sidebar_state=true");

  // Reopen via footer Cookie settings, enable functional storage, and save
  await page.getByRole("button", { name: "Cookie settings" }).click();
  await expect(modal).toBeVisible();
  await modal.getByRole("checkbox").check();
  await modal.getByRole("button", { name: "Save preferences" }).click();
  await expect(modal).toBeHidden();

  const afterSave = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("cookie_consent_v2") ?? "null"),
  );
  expect(afterSave?.functional).toBe(true);
});

test("CookieBanner automatically honors Global Privacy Control (GPC) signal", async ({
  mount,
  page,
}) => {
  await page.evaluate(() => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "globalPrivacyControl", {
      value: true,
      configurable: true,
    });
  });

  await mount(<CookieConsentStory />);

  await expect
    .poll(async () =>
      page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("cookie_consent_v2") ?? "null"),
      ),
    )
    .toMatchObject({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      gpcApplied: true,
    });

  await expect(page.getByRole("dialog", { name: "Cookie preferences" })).toBeHidden();

  await page.getByRole("button", { name: "Cookie settings" }).click();
  const modal = page.getByRole("dialog", { name: "Cookie & storage preferences" });
  await expect(modal).toBeVisible();
  await expect(
    modal.getByText("Global Privacy Control (GPC) signal detected and honored."),
  ).toBeVisible();
});

test("SignUpConsentGate requires separate Terms & Privacy acceptance and stores pending consent proof", async ({
  mount,
  page,
}) => {
  await page.evaluate(() => {
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/sign-up");
  });

  await mount(<SignUpConsentStory />);

  const clerkWidget = page.getByTestId("clerk-signup-widget");
  await expect(clerkWidget).toBeHidden();

  // Submitting with unchecked boxes shows separate validation errors
  await page.getByRole("button", { name: "Continue to sign up" }).click();
  await expect(
    page.getByText("You must accept the Terms of Service to create an account."),
  ).toBeVisible();
  await expect(
    page.getByText("You must accept the Privacy Policy to create an account."),
  ).toBeVisible();
  await expect(clerkWidget).toBeHidden();

  // Accepting required Terms + Privacy (with optional marketing unchecked) reveals Clerk widget
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await expect(checkboxes.nth(2)).not.toBeChecked();

  await page.getByRole("button", { name: "Continue to sign up" }).click();
  await expect(clerkWidget).toBeVisible();

  const savedConsent = await page.evaluate(() =>
    JSON.parse(window.sessionStorage.getItem("kiki_pending_signup_consent") ?? "null"),
  );
  expect(savedConsent?.terms?.accepted).toBe(true);
  expect(savedConsent?.privacy?.accepted).toBe(true);
  expect(savedConsent?.marketingEmail?.accepted).toBe(false);
  expect(savedConsent?.marketingEmail?.checkboxText).toContain("KikiBoard");
});

test("SignUpConsentGate passes allowlisted Clerk callback routes straight through", async ({
  mount,
  page,
}) => {
  await page.evaluate(() => {
    window.history.pushState({}, "", "/sign-up/sso-callback");
  });
  await mount(<SignUpConsentStory />);
  await expect(page.getByTestId("clerk-signup-widget")).toBeVisible();
});

test("SignUpConsentGate blocks non-allowlisted /sign-up sub-routes behind the consent form", async ({
  mount,
  page,
}) => {
  await page.evaluate(() => {
    window.history.pushState({}, "", "/sign-up/anything");
  });
  await mount(<SignUpConsentStory />);
  await expect(page.getByTestId("clerk-signup-widget")).toBeHidden();
  await expect(page.getByRole("button", { name: "Continue to sign up" })).toBeVisible();
});
