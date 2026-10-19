import { describe, expect, it } from "vitest";
import { buildPatch, hasKikiMention, parseReply, parseTriage } from "@/lib/agent/parse";

const ref = {
  lists: [{ id: "l1" }, { id: "l2" }],
  labels: [{ id: "b1" }],
  members: [{ id: "u1" }],
  task: { subtasks: [{ id: "s1", title: "Uno", completed: true, order: 0 }] },
};

describe("hasKikiMention", () => {
  it("detects @Kiki as a standalone mention", () => {
    expect(hasKikiMention("@Kiki resume esto")).toBe(true);
    expect(hasKikiMention("hola @kiki, ¿puedes ayudar?")).toBe(true);
    expect(hasKikiMention("(@KIKI) mira")).toBe(true);
  });
  it("ignores look-alikes", () => {
    expect(hasKikiMention("correo a pepe@kiki.com")).toBe(false);
    expect(hasKikiMention("@kikiboard team")).toBe(false);
    expect(hasKikiMention("sin mención")).toBe(false);
  });
});

describe("parseReply", () => {
  it("reads a well-formed answer", () => {
    const out = parseReply('{"reply":"Hecho","summary":"Prioridad","changes":{"priority":"high"}}');
    expect(out).toEqual({ reply: "Hecho", summary: "Prioridad", changes: { priority: "high" } });
  });
  it("accepts code fences and treats empty changes as none", () => {
    const out = parseReply('```json\n{"reply":"ok","changes":{}}\n```');
    expect(out.changes).toBeNull();
  });
  it("falls back to plain text without changes", () => {
    expect(parseReply("Claro, te cuento…")).toEqual({ reply: "Claro, te cuento…", summary: "", changes: null });
  });
});

describe("buildPatch", () => {
  it("keeps only whitelisted fields", () => {
    const patch = buildPatch({ priority: "low", archived: true, shared: true, attachments: [{}] }, ref);
    expect(patch).toEqual({ priority: "low" });
  });
  it("rejects ids that were not offered to the model", () => {
    expect(() => buildPatch({ listId: "x" }, ref)).toThrow();
    expect(() => buildPatch({ assigneeId: "x" }, ref)).toThrow();
    expect(() => buildPatch({ labelIds: ["b1", "x"] }, ref)).toThrow();
  });
  it("allows unassigning and known ids", () => {
    expect(buildPatch({ assigneeId: null, listId: "l2", labelIds: ["b1", "b1"] }, ref)).toEqual({ assigneeId: null, listId: "l2", labelIds: ["b1"] });
  });
  it("appends subtasks without dropping existing ones", () => {
    const patch = buildPatch({ addSubtasks: ["Dos", " ", 3] }, ref) as { subtasks: { id?: string; title: string; order: number }[] };
    expect(patch.subtasks.map((s) => [s.id, s.title, s.order])).toEqual([["s1", "Uno", 0], [undefined, "Dos", 1]]);
  });
  it("returns null when nothing changes", () => {
    expect(buildPatch({ foo: 1 }, ref)).toBeNull();
  });
});

describe("parseTriage", () => {
  const triageRef = { labels: [{ id: "b1" }, { id: "b2" }], members: [{ id: "u1" }], candidates: [{ id: "t1" }], currentPriority: null as string | null, hasAssignee: false };
  const answer = (extra: Record<string, unknown>) => JSON.stringify({ reply: "Sugiero…", priority: null, labelIds: [], assigneeId: null, duplicateOf: [], ...extra });

  it("keeps valid suggestions", () => {
    const out = parseTriage(answer({ priority: "high", labelIds: ["b1"], assigneeId: "u1", duplicateOf: ["t1"] }), triageRef);
    expect(out).toEqual({ reply: "Sugiero…", changes: { priority: "high", labelIds: ["b1"], assigneeId: "u1" }, duplicates: ["t1"] });
  });
  it("drops ids that were not offered and invalid priorities", () => {
    const out = parseTriage(answer({ priority: "critical", labelIds: ["b1", "zzz"], assigneeId: "zzz", duplicateOf: ["zzz"] }), triageRef);
    expect(out?.changes).toEqual({ labelIds: ["b1"] });
    expect(out?.duplicates).toEqual([]);
  });
  it("does not overwrite an existing priority or assignee", () => {
    const out = parseTriage(answer({ priority: "low", assigneeId: "u1", labelIds: ["b2"] }), { ...triageRef, currentPriority: "high", hasAssignee: true });
    expect(out?.changes).toEqual({ labelIds: ["b2"] });
  });
  it("stays silent when there is nothing useful or the output is broken", () => {
    expect(parseTriage(answer({}), triageRef)).toBeNull();
    expect(parseTriage(answer({ reply: "", priority: "high" }), triageRef)).toBeNull();
    expect(parseTriage("not json", triageRef)).toBeNull();
  });
  it("reports duplicates even without field changes", () => {
    const out = parseTriage(answer({ duplicateOf: ["t1"] }), triageRef);
    expect(out?.changes).toBeNull();
    expect(out?.duplicates).toEqual(["t1"]);
  });
});
