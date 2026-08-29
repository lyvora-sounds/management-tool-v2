import { describe, it, expect } from "vitest";
import {
  DEFAULT_CUSTOM_FIELDS,
  isChildFieldKey,
  isCustomFieldType,
  isParentFieldKey,
  isTicketRefKey,
} from "@/lib/customFieldsDefaults";
import {
  displayCustomFieldValue,
  parseListValue,
  stringifyListValue,
} from "@/lib/customValueUtils";
import { isDoneList, isTodoList, targetListForCompletion } from "@/lib/statusTheme";

describe("DEFAULT_CUSTOM_FIELDS", () => {
  it("contains the 5 required default custom fields", () => {
    expect(DEFAULT_CUSTOM_FIELDS).toHaveLength(5);

    const keys = DEFAULT_CUSTOM_FIELDS.map((f) => f.defaultKey);
    expect(keys).toEqual([
      "story_points",
      "environment",
      "parent",
      "child",
      "customer",
    ]);
  });

  it("has correct types and options for Story points and Environment", () => {
    const sp = DEFAULT_CUSTOM_FIELDS.find((f) => f.defaultKey === "story_points");
    expect(sp?.type).toBe("SELECT");
    expect(sp?.options).toEqual(["1", "2", "3", "5", "8", "13", "21"]);

    const env = DEFAULT_CUSTOM_FIELDS.find((f) => f.defaultKey === "environment");
    expect(env?.type).toBe("SELECT");
    expect(env?.options).toEqual(["dev", "integration", "uat", "production"]);
  });

  it("identifies ticket-ref fields by defaultKey only", () => {
    expect(isParentFieldKey("parent")).toBe(true);
    expect(isChildFieldKey("child")).toBe(true);
    expect(isTicketRefKey("parent")).toBe(true);
    expect(isTicketRefKey("customer")).toBe(false);
    expect(isTicketRefKey("Parent notes")).toBe(false);
    expect(isCustomFieldType("SELECT")).toBe(true);
    expect(isCustomFieldType("DATE")).toBe(false);
  });
});

describe("custom value list helpers", () => {
  it("parses JSON arrays of ids", () => {
    expect(parseListValue('["a","b"]')).toEqual(["a", "b"]);
  });

  it("stringifies unique trimmed ids", () => {
    expect(stringifyListValue([" a ", "b", "a"])).toBe('["a","b"]');
  });

  it("guarda una lista vacía como cadena vacía, no como \"[]\"", () => {
    // "[]" es truthy y colaba los filtros `value &&`, dejando chips vacíos
    // en las tarjetas al quitar el último hijo.
    expect(stringifyListValue([])).toBe("");
    expect(stringifyListValue(["  ", ""])).toBe("");
  });

  it("mantiene la ida y vuelta con la lista vacía", () => {
    expect(parseListValue(stringifyListValue([]))).toEqual([]);
  });

  it("resolves parent/child ids to titles when a lookup is provided", () => {
    const titles = new Map([
      ["t1", "Login"],
      ["t2", "Signup"],
    ]);
    expect(displayCustomFieldValue("t1", "parent", titles)).toBe("Login");
    expect(displayCustomFieldValue('["t1","t2"]', "child", titles)).toBe(
      "Login, Signup",
    );
  });
});

describe("status list helpers", () => {
  it("detects done and todo lists from titles", () => {
    expect(isDoneList("Hecho")).toBe(true);
    expect(isDoneList("Done")).toBe(true);
    expect(isTodoList("Por hacer")).toBe(true);
    expect(isTodoList("Backlog")).toBe(true);
    expect(isDoneList("En progreso")).toBe(false);
  });

  it("picks the target list when completing a task", () => {
    const lists = [
      { id: "todo", title: "Por hacer" },
      { id: "doing", title: "En progreso" },
      { id: "done", title: "Hecho" },
    ];
    expect(targetListForCompletion(lists, "todo", true)?.id).toBe("done");
    expect(targetListForCompletion(lists, "done", false)?.id).toBe("todo");
    expect(targetListForCompletion(lists, "done", true)).toBeNull();
  });
});
