import { expect, test } from "@playwright/experimental-ct-react";
import { AppearanceSettingsStory, TwoFactorSettingsStory } from "./stories";

test("TwoFactorSettings hides helper text inside accessible info bubbles", async ({ mount, page }) => {
  await page.route("https://api.test/v1/settings/security", async (route) => {
    await route.fulfill({
      json: {
        email: "user@example.com",
        emailEnabled: false,
        phone: null,
        phoneEnabled: false,
        totpEnabled: false,
      },
      headers: { "access-control-allow-origin": "*" },
    });
  });

  await mount(<TwoFactorSettingsStory />);

  const mfaDesc = "Add an email code, a phone number, or an authenticator app.";
  const emailDesc = "We send a code to user@example.com.";

  await expect(page.getByRole("heading", { name: "Two-factor authentication" })).toBeVisible();
  await expect(page.getByText(mfaDesc)).toBeHidden();
  await expect(page.getByText(emailDesc)).toBeHidden();

  const trigger = page.getByRole("button", { name: mfaDesc });
  await trigger.click();
  const bubble = page.getByText(mfaDesc);
  await expect(bubble).toBeVisible();

  // Portaled popover must not be clipped by the card's overflow-hidden container.
  const box = await bubble.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(10);

  await page.keyboard.press("Escape");
  await expect(bubble).toBeHidden();
});

test("AppearanceSettings hides helper descriptions in info bubbles and reveals them on hover or click", async ({ mount, page }) => {
  await mount(<AppearanceSettingsStory />);

  const accentDesc =
    "Applies to buttons, links, selection and avatars. Every color is tuned for both light and dark.";
  const themeDesc = "Choose how the app looks.";

  await expect(page.getByRole("heading", { name: "Accent color" })).toBeVisible();
  await expect(page.getByText(accentDesc)).toBeHidden();
  await expect(page.getByText(themeDesc)).toBeHidden();

  await page.getByRole("button", { name: accentDesc }).hover();
  await expect(page.getByText(accentDesc)).toBeVisible();

  await page.getByRole("button", { name: themeDesc }).click();
  await expect(page.getByText(themeDesc)).toBeVisible();
});
