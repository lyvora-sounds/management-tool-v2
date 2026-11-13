import { describe, expect, it } from "vitest";
import { boardTaskHref } from "@/lib/boardTaskUrl";

describe("boardTaskHref", () => {
  it("sets taskId while preserving other query params", () => {
    expect(boardTaskHref("/board/b1", "view=list&q=x", "t1")).toBe(
      "/board/b1?view=list&q=x&taskId=t1",
    );
  });

  it("clears taskId and drops empty query", () => {
    expect(boardTaskHref("/board/b1", "taskId=t1", null)).toBe("/board/b1");
  });

  it("replaces an existing taskId", () => {
    expect(boardTaskHref("/board/b1", "taskId=old", "new")).toBe(
      "/board/b1?taskId=new",
    );
  });
});
