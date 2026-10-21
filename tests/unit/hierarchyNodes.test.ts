import { describe, expect, it } from "vitest";
import { hierarchyNodesFromLists } from "@/app/(routes)/(dashboard)/board/[boardId]/components/TaskHierarchy/hierarchyNodes";

const cv = (defaultKey: string, value: string | null) => ({ value, customField: { defaultKey } });

describe("hierarchyNodesFromLists", () => {
  it("reads the parent and child fields and keeps list, status and archive state", () => {
    const nodes = hierarchyNodesFromLists([
      { title: "To do", tasks: [{ id: "a", title: "A", completed: false, archived: false, customValues: [cv("parent", "root"), cv("child", '["b","c"]')] }] },
      { title: "Done", tasks: [{ id: "b", title: "B", completed: true, archived: true }] },
    ]);
    expect(nodes[0]).toEqual({ id: "a", title: "A", parentId: "root", childIds: ["b", "c"], archived: false, completed: false, listTitle: "To do" });
    expect(nodes[1]).toMatchObject({ id: "b", parentId: null, childIds: [], archived: true, completed: true, listTitle: "Done" });
  });
  it("treats empty relation values as no relation and ignores other custom fields", () => {
    const [node] = hierarchyNodesFromLists([{ title: "L", tasks: [{ id: "a", title: "A", customValues: [cv("parent", ""), cv("child", ""), cv("story_points", "5")] }] }]);
    expect(node.parentId).toBeNull();
    expect(node.childIds).toEqual([]);
  });
});
