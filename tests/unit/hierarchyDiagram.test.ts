import { describe, expect, it } from "vitest";
import { hierarchySvg, type HierarchyNode } from "@/lib/hierarchyDiagram";

function node(
  id: string,
  title: string,
  parentId: string | null,
  childIds: string[] = [],
): HierarchyNode {
  return { id, title, parentId, childIds };
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
