import { describe, expect, it } from "vitest";
import { labelFromApi } from "@/lib/api/labels";
import type { ApiLabel } from "@/lib/api/types";

describe("labelFromApi", () => {
  it("turns the wire label into the model the board screens use", () => {
    const wire: ApiLabel = {
      id: "l1",
      title: "Bug",
      color: "#ef4444",
      boardId: "b1",
      createdAt: "2026-10-26T11:24:51.117Z",
      updatedAt: "2026-10-26T11:30:00.000Z",
    };
    const model = labelFromApi(wire);
    expect(model).toMatchObject({ id: "l1", title: "Bug", color: "#ef4444", boardId: "b1" });
    expect(model.createdAt).toEqual(new Date("2026-10-26T11:24:51.117Z"));
    expect(model.updatedAt).toBeInstanceOf(Date);
  });
});
