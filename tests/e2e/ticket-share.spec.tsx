import { expect, test, type Page } from "@playwright/experimental-ct-react";
import { AccessDeniedStory, ShareStory } from "./stories";

const publicUrl = "https://kikiboard.xyz/share/task/public-token";

async function hold(page: Page) {
  if (process.env.SLOWMO) await page.waitForTimeout(1200);
}

test.describe.configure({ mode: "serial" });

test("the private link is always ready to copy, and the public link is created separately", async ({ mount, page }) => {
  let publicLink: string | null = null;
  await page.route("**/api/tasks/task-1/share", async (route) => {
    const method = route.request().method();
    if (method === "POST") publicLink = publicUrl;
    if (method === "DELETE") publicLink = null;
    await route.fulfill({ json: { shareUrl: publicLink } });
  });

  await mount(<ShareStory />);

  const dialog = page.getByRole("dialog");
  const privateHint = "Only people who can open this board can view the ticket. This link is always available.";
  await expect(dialog.getByRole("heading", { name: "Share ticket" })).toBeVisible();
  await expect(dialog.getByText("Private link")).toBeVisible();
  await expect(dialog.getByRole("tooltip", { name: privateHint })).toBeHidden();
  await dialog.getByRole("button", { name: privateHint }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(dialog.getByRole("tooltip", { name: privateHint })).toBeVisible();
  await expect(dialog.getByRole("textbox").first()).toHaveValue(/\/board\/board-1\?taskId=task-1$/);
  await expect(dialog.getByText("No public link yet. Generate one to let anyone view this ticket without signing in.")).toBeHidden();
  await expect(dialog.getByRole("button", { name: "Generate public link" })).toBeVisible();
  await hold(page);

  const generated = page.waitForResponse((response) => response.url().includes("/api/tasks/task-1/share") && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "Generate public link" }).evaluate((button: HTMLButtonElement) => button.click());
  await generated;
  await expect(dialog.getByRole("textbox").nth(1)).toHaveValue(publicUrl);
  await expect(dialog.getByText("Link active")).toBeVisible();
  await expect(dialog.getByRole("textbox").first()).toHaveValue(/\/board\/board-1\?taskId=task-1$/);
  await hold(page);

  const revoked = page.waitForResponse((response) => response.url().includes("/api/tasks/task-1/share") && response.request().method() === "DELETE");
  await dialog.getByRole("button", { name: "Revoke link" }).evaluate((button: HTMLButtonElement) => button.click());
  await revoked;
  await expect(dialog.getByRole("button", { name: "Generate public link" })).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(1);
  await hold(page);
});

test("opening a private link without access shows a warning on the dashboard", async ({ mount, page }) => {
  const replaced = page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        window.addEventListener("app:replace", (event) => resolve((event as CustomEvent<string>).detail), { once: true });
      }),
  );

  await mount(<AccessDeniedStory />);

  const alert = page.getByRole("alert");
  await expect(alert.getByText("You don't have access to this content")).toBeVisible();
  await expect(alert.getByText("The link you opened is private. Ask someone who can open that board to grant you access.")).toBeVisible();
  await hold(page);
  await alert.getByRole("button", { name: "Close" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(replaced).resolves.toBe("/dashboard");
});
