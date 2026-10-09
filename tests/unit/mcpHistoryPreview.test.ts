import { describe, expect, it } from "vitest";
import { changedHistoryFields, formatHistoryValue, historyRelationImpact, historyUserIds, type HistorySnapshot } from "@/lib/mcp/historyPreview";

const names = { listNames: { list: "Draft" }, userNames: { mario: "Mario Ruby" }, customFieldNames: { env: "Environment" }, labelNames: { bug: "Bug" }, epicNames: { epic: "Release" } };
const t = (key: string) => key;
const before: HistorySnapshot = { id: "ticket", title: "Ticket to test", updatedAt: "old", assigneeId: null, qaId: null, epicId: null, quarter: null, order: 0, shareToken: null, completedAt: null, completedById: null, archivedAt: null, collaborators: [], labels: [], customValues: [], subtasks: [], comments: [], attachments: [] };

describe("MCP revert previews", () => {
  it("includes every supported scalar and nested change while excluding the revision", () => {
    const after: HistorySnapshot = { ...before, updatedAt: "new", assigneeId: "mario", qaId: "mario", epicId: "epic", quarter: "2026-Q4", order: 1, shareToken: "public-link", completedAt: "today", completedById: "mario", archivedAt: "today", collaborators: [{ userId: "mario" }], labels: [{ labelId: "bug" }], customValues: [{ customFieldId: "env", value: "production" }], subtasks: [{ id: "subtask", title: "Verify", order: 0, completed: false }], comments: [{ id: "comment", userId: "mario", content: "QA ready" }], attachments: [{ id: "attachment", filename: "test.txt", size: 5 }] };
    expect(changedHistoryFields(before, after)).toEqual(Object.keys(before).filter(key => !["id", "title", "updatedAt"].includes(key)));
    expect(changedHistoryFields(before, { ...before, customValues: [{ customFieldId: "env", value: "production" }] })).toEqual(["customValues"]);
    expect(changedHistoryFields(before, { ...before, attachments: after.attachments })).toEqual(["attachments"]);
    expect(changedHistoryFields(before, { ...before, comments: after.comments })).toEqual(["comments"]);
  });
  it("compares JSON objects by value rather than property order or object identity", () => {
    const original = { ...before, customValues: [{ customFieldId: "env", value: "production" }] };
    expect(changedHistoryFields(original, { ...original, customValues: [{ value: "production", customFieldId: "env" }] })).toEqual([]);
  });
  it("preserves scalar-only previews for legacy journals", () => {
    expect(changedHistoryFields({ id: "ticket", title: "Original" }, { ...before, title: "Renamed" })).toEqual(["title"]);
  });
  it("formats nested content and names without showing join objects or storage URLs", () => {
    expect(formatHistoryValue("qaId", "mario", names, t)).toBe("Mario Ruby");
    expect(formatHistoryValue("customValues", [{ customFieldId: "env", value: "production" }], names, t)).toBe("Environment: production");
    expect(formatHistoryValue("collaborators", [{ userId: "mario" }], names, t)).toBe("Mario Ruby");
    expect(formatHistoryValue("labels", [{ labelId: "bug" }], names, t)).toBe("Bug");
    expect(formatHistoryValue("epicId", "epic", names, t)).toBe("Release");
    expect(formatHistoryValue("subtasks", [{ title: "Verify", order: 1, completed: true }], names, t)).toBe("2. ☑ Verify");
    expect(formatHistoryValue("comments", [{ userId: "mario", content: "QA ready" }], names, t)).toBe("Mario Ruby: QA ready");
    expect(formatHistoryValue("attachments", [{ filename: "test.txt", size: 5, url: "private-storage-url" }], names, t)).toBe("test.txt (5 bytes)");
    expect(formatHistoryValue("shareToken", "secret-public-token", names, t)).toBe("sharingEnabled");
    expect(formatHistoryValue("shareToken", null, names, t)).toBe("sharingDisabled");
  });
  it("makes additions, removals and replacements explicit even with matching filenames", () => {
    expect(historyRelationImpact("attachments", [{ id: "old-file", filename: "test.txt", size: 5 }], [{ id: "new-file", filename: "test.txt", size: 5 }])).toEqual({ removed: 1, restored: 1, changed: 0 });
    expect(historyRelationImpact("comments", [{ id: "comment", content: "Before" }], [{ id: "comment", content: "After" }])).toEqual({ removed: 0, restored: 0, changed: 1 });
    expect(historyRelationImpact("customValues", [], [{ customFieldId: "env", value: "production" }])).toEqual({ removed: 1, restored: 0, changed: 0 });
  });
  it("only resolves users referenced by the authorized journal", () => {
    expect(historyUserIds([{ ...before, qaId: "mario", completedById: "mario", collaborators: [{ userId: "watcher" }], comments: [{ userId: "author", content: "text" }] }])).toEqual(["mario", "watcher", "author"]);
  });
});
