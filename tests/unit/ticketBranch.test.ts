import { describe, expect, it } from "vitest";
import {
  boardKeyFromTitle,
  branchesFromMatchingRefs,
  checkoutCommand,
  formatTicketKey,
  nextBoardKey,
  suggestedBranch,
  ticketIdentityFromBranch,
} from "@/lib/integrations/ticketBranch";
import { nextListAfterMerge } from "@/lib/statusTheme";

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

  it("reads a ticket key from a branch and ignores other names", () => {
    expect(ticketIdentityFromBranch("KI-00068-mcp-suggested-branch")).toEqual({ boardKey: "KI", number: 68 });
    expect(ticketIdentityFromBranch("topic/ly-00042")).toEqual({ boardKey: "LY", number: 42 });
    expect(ticketIdentityFromBranch("feat/not-a-ticket")).toBeNull();
  });

  it("advances a merged ticket to the next column", () => {
    const lists = [
      { id: "todo", title: "To do", order: 0 },
      { id: "review", title: "To Review", order: 1 },
      { id: "done", title: "Done", order: 2 },
    ];
    expect(nextListAfterMerge(lists, "todo")).toEqual({ listId: "review", complete: false });
    expect(nextListAfterMerge(lists, "review")).toEqual({ listId: "done", complete: true });
    expect(nextListAfterMerge(lists, "done")).toEqual({ listId: null, complete: true });
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
