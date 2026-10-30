import { describe, expect, it } from "vitest";
import {
  boardKeyFromTitle,
  branchesFromMatchingRefs,
  checkoutCommand,
  formatTicketKey,
  nextBoardKey,
  suggestedBranch,
} from "@/lib/integrations/ticketBranch";

describe("ticket branch names", () => {
  it("pads the ticket number to five digits", () => {
    expect(formatTicketKey("ly", 42)).toBe("LY-00042");
    expect(formatTicketKey("LS", 1)).toBe("LS-00001");
  });

  it("takes two letters from the board title", () => {
    expect(boardKeyFromTitle("Lyvora sounds")).toBe("LS");
    expect(boardKeyFromTitle("Backend")).toBe("BA");
    expect(boardKeyFromTitle("UI")).toBe("UI");
    expect(boardKeyFromTitle("A")).toBe("AX");
    expect(boardKeyFromTitle("")).toBe("BD");
  });

  it("keeps the key when the title changes", () => {
    const first = suggestedBranch("LY-00042", "CA/CD Cost Optimisation");
    const renamed = suggestedBranch("LY-00042", "A completely different title");
    expect(first).toBe("LY-00042-ca-cd-cost-optimisation");
    expect(renamed.startsWith("LY-00042-")).toBe(true);
    expect(renamed).not.toBe(first);
  });

  it("builds a checkout command with or without the saved base branch", () => {
    expect(checkoutCommand("LY-00042-ca-cd-cost-optimisation", null)).toBe(
      "git checkout -b LY-00042-ca-cd-cost-optimisation",
    );
    expect(checkoutCommand("LY-00042-ca-cd-cost-optimisation", "dev")).toBe(
      "git checkout -b LY-00042-ca-cd-cost-optimisation origin/dev",
    );
    expect(checkoutCommand("LY-00042-ca-cd-cost-optimisation", "dev;touch")).toBe(
      "git checkout -b LY-00042-ca-cd-cost-optimisation",
    );
  });

  it("walks to the next free board key", () => {
    expect(nextBoardKey("LS", ["LS", "LT"])).toBe("LU");
  });

  it("parses matching refs and ignores accidental prefixes", () => {
    expect(branchesFromMatchingRefs([
      { ref: "refs/heads/LY-00042-ca-cd-cost-optimisation" },
      { ref: "refs/heads/LY-00042" },
      { ref: "refs/heads/LY-00042/spike" },
      { ref: "refs/heads/LY-000421-other" },
      { ref: "refs/heads/LY-00043-no" },
      { ref: "refs/tags/LY-00042" },
      { ref: "not-a-ref" },
    ], "LY-00042")).toEqual([
      "LY-00042-ca-cd-cost-optimisation",
      "LY-00042",
      "LY-00042/spike",
    ]);
    expect(branchesFromMatchingRefs({ message: "Not Found" }, "LY-00042")).toEqual([]);
  });
});
