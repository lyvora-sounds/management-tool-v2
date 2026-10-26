import { describe, expect, it } from "vitest";
import { ACCESS_DENIED_HREF, isAccessDeniedAccess, privateTicketUrl } from "@/lib/ticketShare";

describe("private ticket link", () => {
  it("is the board URL for that ticket and does not need to be created", () => {
    expect(privateTicketUrl("https://kikiboard.xyz", "board-1", "task-1")).toBe(
      "https://kikiboard.xyz/board/board-1?taskId=task-1",
    );
  });

  it("keeps the ticket id in the query so the private link opens that ticket", () => {
    const url = new URL(privateTicketUrl("http://localhost:3001", "board 1", "task/2"));
    expect(url.pathname).toBe("/board/board%201");
    expect(url.searchParams.get("taskId")).toBe("task/2");
    expect(url.pathname).not.toContain("/share/task/");
  });
});

describe("no access warning", () => {
  it("sends a person who cannot read the board to the dashboard warning", () => {
    expect(ACCESS_DENIED_HREF).toBe("/dashboard?access=denied");
    expect(isAccessDeniedAccess("denied")).toBe(true);
  });

  it("does not show the warning for any other dashboard visit", () => {
    expect(isAccessDeniedAccess(undefined)).toBe(false);
    expect(isAccessDeniedAccess("")).toBe(false);
    expect(isAccessDeniedAccess("granted")).toBe(false);
    expect(isAccessDeniedAccess(["denied"])).toBe(false);
  });
});
