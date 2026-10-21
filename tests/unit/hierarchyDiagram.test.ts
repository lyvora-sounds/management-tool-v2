import { describe, expect, it } from "vitest";
import { hierarchySvg, type HierarchyNode } from "@/lib/hierarchyDiagram";

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
