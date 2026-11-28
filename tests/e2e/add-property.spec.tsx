import { expect, test } from "@playwright/experimental-ct-react";
import { AddPropertyStory } from "./stories";

test("the menu lists what the ticket lacks and reports the chosen property", async ({ mount, page }) => {
  const chosen: string[] = [];
  await mount(<AddPropertyStory onSelect={(key) => chosen.push(key)} />);

  await page.getByRole("button", { name: "Add property" }).click();
  await expect(page.getByRole("menuitem", { name: "Labels" })).toBeVisible();
  await expect(page.getByText("Custom fields")).toBeVisible();

  await page.getByRole("menuitem", { name: "Story points" }).click();
  expect(chosen).toEqual(["cf:1"]);
});

test("nothing is drawn when there is nothing to add (a viewer, or a full ticket)", async ({ mount, page }) => {
  await mount(<AddPropertyStory items={false} />);
  await expect(page.getByRole("button", { name: "Add property" })).toHaveCount(0);
});
