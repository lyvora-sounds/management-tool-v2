import { describe, expect, it } from "vitest";
import { hierarchyRanks, hierarchySteps, hierarchySvg, type HierarchyNode } from "@/lib/hierarchyDiagram";

function node(
  id: string,
  title: string,
  parentId: string | null,
  childIds: string[] = [],
  archived = false,
): HierarchyNode {
  return { id, title, parentId, childIds, archived };
}

function ids(svg: string) {
  return [...svg.matchAll(/data-id="([^"]+)"/g)].map((match) => match[1]);
}

function steps(svg: string) {
  return [...svg.matchAll(/data-id="([^"]+)" data-step="(\d+)"/g)].map((match) => [match[1], match[2]]);
}

describe("hierarchySvg", () => {
  it("draws a chain as numbered steps under the root title", () => {
    const svg = hierarchySvg(
      [
        node("a", "Skeleton", null, ["b"]),
        node("b", "Network", "a", ["c"]),
        node("c", "Ansible", "b"),
      ],
      { focusId: "c" },
    );
    expect(svg).toContain("Skeleton");
    expect(steps(svg!)).toEqual([
      ["b", "1"],
      ["c", "2"],
    ]);
    expect(ids(svg!)).not.toContain("a");
  });

  it("keeps siblings on one step in the parent's child list order", () => {
    const svg = hierarchySvg(
      [
        node("root", "Hosting", null, ["storage", "network", "postgres"]),
        node("network", "Network", "root"),
        node("postgres", "Postgres", "root"),
        node("storage", "Storage", "root"),
      ],
      { focusId: "root" },
    );
    expect(steps(svg!)).toEqual([
      ["storage", "1"],
      ["network", "1"],
      ["postgres", "1"],
    ]);
  });

  it("returns null when the ticket has no parent and no children", () => {
    expect(hierarchySvg([node("solo", "Alone", null)], { focusId: "solo" })).toBeNull();
    expect(hierarchySvg([], { focusId: "missing" })).toBeNull();
  });

  it("stops a cycle instead of repeating a ticket", () => {
    const svg = hierarchySvg(
      [
        node("a", "Alpha", "b", ["b"]),
        node("b", "Beta", "a", ["a"]),
      ],
      { focusId: "a" },
    );
    expect(svg).not.toBeNull();
    const seen = ids(svg!);
    expect(seen.filter((id) => id === "a")).toHaveLength(1);
    expect(seen.filter((id) => id === "b")).toHaveLength(1);
  });

  it("shortens a step title that would overlap the next step and keeps the full title", () => {
    const long = "Stand up Kikiboard hosting in kiki-infra";
    const svg = hierarchySvg(
      [
        node("root", "Hosting", null, ["a", "b"]),
        node("a", long, "root"),
        node("b", "Network", "root"),
      ],
      { focusId: "root" },
    );
    expect(svg).toContain(`<title>${long}</title>`);
    expect(svg).toContain(">Stand up Kikiboa…</text>");
    expect(svg).not.toContain(`>${long}</text>`);
    expect(svg).toContain(">Network<");
  });

  it("shortens a root title that would run past the diagram", () => {
    const long = "Stand up Kikiboard hosting before the first Terraform commit lands";
    const svg = hierarchySvg(
      [
        node("root", long, null, ["a"]),
        node("a", "Network", "root"),
      ],
      { focusId: "a" },
    );
    expect(svg).toContain(`<title id="hierarchy-title">${long}</title>`);
    expect(svg).not.toContain(`>${long}</text>`);
  });

  it("keeps an archived ancestor as the title and mutes an archived step", () => {
    const svg = hierarchySvg(
      [
        node("root", "Archived root", null, ["mid"], true),
        node("mid", "Old step", "root", ["child"], true),
        node("child", "Active", "mid"),
      ],
      { focusId: "child" },
    );
    expect(svg).toContain('fill="#5E7695">Archived root</text>');
    expect(svg).toContain('fill="#5E7695">Old step</text>');
    expect(svg).toContain('fill="#13233C">Active</text>');
    expect(steps(svg!)).toEqual([
      ["mid", "1"],
      ["child", "2"],
    ]);
  });

  it("escapes titles that contain markup", () => {
    const svg = hierarchySvg(
      [
        node("root", "A < B & C", null, ["child"]),
        node("child", "D > E", "root"),
      ],
      { focusId: "root" },
    );
    expect(svg).toContain("A &lt; B &amp; C");
    expect(svg).toContain("D &gt; E");
    expect(svg).not.toContain("A < B");
  });
});

describe("hierarchySteps and hierarchyRanks", () => {
  const n = (id: string, parentId: string | null, childIds: string[] = []) => ({ id, title: id, parentId, childIds });
  const chain = [n("root", null, ["a"]), n("a", "root", ["b"]), n("b", "a", ["c"]), n("c", "b"), n("alone", null)];

  it("numbers every ticket of a chain from 1 and leaves the root and loose tickets unnumbered", () => {
    const steps = hierarchySteps(chain);
    expect([...steps.keys()].sort()).toEqual(["a", "b", "c"]);
    expect(steps.get("a")).toEqual({ step: 1, total: 3, rootId: "root" });
    expect(steps.get("c")).toEqual({ step: 3, total: 3, rootId: "root" });
  });
  it("gives siblings the same step", () => {
    const steps = hierarchySteps([n("root", null, ["x", "y"]), n("x", "root", ["z"]), n("y", "root"), n("z", "x")]);
    expect(steps.get("x")?.step).toBe(1);
    expect(steps.get("y")?.step).toBe(1);
    expect(steps.get("z")).toEqual({ step: 2, total: 2, rootId: "root" });
  });
  it("matches the steps used by the ticket's path", () => {
    const layout = hierarchyRanks(chain, "b")!;
    const steps = hierarchySteps(chain);
    layout.ranks.forEach((rank, index) => rank.forEach((node) => expect(steps.get(node.id)?.step).toBe(index + 1)));
    expect(layout.root.id).toBe("root");
  });
  it("ignores cycles instead of looping and returns nothing for an unknown ticket", () => {
    expect(hierarchySteps([n("p", "q", ["q"]), n("q", "p", ["p"])]).size).toBe(0);
    expect(hierarchyRanks(chain, "missing")).toBeNull();
  });
  it("converges parallel tasks onto a single downstream step when all blockers finish", () => {
    const dag: HierarchyNode[] = [
      { id: "root", title: "kiki-infra-migration", parentId: null, childIds: ["t1"] },
      { id: "t1", title: "Terraform skeleton", parentId: "root", childIds: ["t2", "t3", "t4"] },
      { id: "t2", title: "Network", parentId: "t1", childIds: ["t5"] },
      { id: "t3", title: "Dockerfile", parentId: "t1", childIds: ["t5"] },
      { id: "t4", title: "Secrets", parentId: "t1", childIds: ["t5"] },
      { id: "t5", title: "Release path", parentId: "t2", parentIds: ["t2", "t3", "t4"], childIds: ["t6"] },
      { id: "t6", title: "Managed Postgres", parentId: "t5", childIds: [] },
    ];
    const layout = hierarchyRanks(dag, "t5")!;
    expect(layout.root.id).toBe("root");
    expect(layout.ranks.map((rank) => rank.map((item) => item.id))).toEqual([
      ["t1"],
      ["t2", "t3", "t4"],
      ["t5"],
      ["t6"],
    ]);
    const steps = hierarchySteps(dag);
    expect(steps.get("t1")?.step).toBe(1);
    expect(steps.get("t2")?.step).toBe(2);
    expect(steps.get("t3")?.step).toBe(2);
    expect(steps.get("t4")?.step).toBe(2);
    expect(steps.get("t5")?.step).toBe(3);
    expect(steps.get("t6")?.step).toBe(4);
  });
  it("places a converging task after the longest blocking parallel branch", () => {
    const dag: HierarchyNode[] = [
      { id: "root", title: "Origin", parentId: null, childIds: ["a", "b"] },
      { id: "a", title: "Branch A1", parentId: "root", childIds: ["a2"] },
      { id: "b", title: "Branch B1", parentId: "root", childIds: ["join"] },
      { id: "a2", title: "Branch A2", parentId: "a", childIds: ["join"] },
      { id: "join", title: "Join", parentId: "a2", parentIds: ["a2", "b"], childIds: [] },
    ];
    const layout = hierarchyRanks(dag, "join")!;
    expect(layout.ranks.map((rank) => rank.map((item) => item.id))).toEqual([
      ["a", "b"],
      ["a2"],
      ["join"],
    ]);
  });
});
