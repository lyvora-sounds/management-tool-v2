import { expect, test } from "@playwright/experimental-ct-react";
import { TaskCommentsStory } from "./stories";

const comments = [
  { id: "c1", content: "First", createdAt: "2026-11-20T10:00:00.000Z", user: { name: "Ana", email: "ana@example.com" } },
  { id: "c2", content: "Second", createdAt: "2026-11-20T11:00:00.000Z", user: { name: "Luis", email: "luis@example.com" } },
];

async function mockComments(page: import("@playwright/experimental-ct-react").Page, body: unknown) {
  await page.route("https://api.test/v1/tasks/task-1/comments", (route) =>
    route.fulfill({ json: body, headers: { "access-control-allow-origin": "*" } }),
  );
}

test("the AI shortcuts are one menu next to Send, not three chips above the text box", async ({ mount, page }) => {
  await mockComments(page, []);
  await mount(<TaskCommentsStory />);

  await expect(page.getByRole("button", { name: "Summarize" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ask Kiki" }).click();
  await expect(page.getByRole("menuitem", { name: "Summarize" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Suggest priority" })).toBeVisible();

  await page.getByRole("menuitem", { name: "Summarize" }).click();
  await expect(page.getByRole("combobox")).toHaveValue(/^@Kiki .*2 sentences/);
  expect(await page.getByRole("combobox").evaluate((el) => document.activeElement === el)).toBe(true);
});

test("tells its owner how many comments there are once they are loaded", async ({ mount, page }) => {
  await mockComments(page, comments);
  const counts: number[] = [];
  await mount(<TaskCommentsStory onCount={(count) => counts.push(count)} />);

  await expect(page.getByText("Second")).toBeVisible();
  expect(counts).toContain(2);
  expect(counts).not.toContain(0); // nothing is reported while the first fetch is still running

});
