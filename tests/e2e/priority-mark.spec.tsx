import { expect, test } from "@playwright/experimental-ct-react";
import { PriorityMarksStory } from "./stories";

test("a priority is told by its bars and by its name, not by colour alone", async ({ mount, page }) => {
  await mount(<PriorityMarksStory />);

  // Urgent fills all four bars, low only one; the name is the accessible label.
  const filled = async (label: string) =>
    page.getByRole("img", { name: label }).locator("span").evaluateAll(
      (bars) => bars.filter((bar) => getComputedStyle(bar).opacity === "1").length,
    );

  expect(await filled("Urgente")).toBe(4);
  expect(await filled("Alta")).toBe(3);
  expect(await filled("Media")).toBe(2);
  expect(await filled("Baja")).toBe(1);
});
