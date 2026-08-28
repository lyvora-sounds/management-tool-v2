import { describe, it, expect } from "vitest";
import { DEFAULT_CUSTOM_FIELDS } from "@/lib/customFieldsDefaults";

describe("DEFAULT_CUSTOM_FIELDS", () => {
  it("should contain the 5 required default custom fields", () => {
    expect(DEFAULT_CUSTOM_FIELDS).toHaveLength(5);

    const keys = DEFAULT_CUSTOM_FIELDS.map((f) => f.defaultKey);
    expect(keys).toContain("story_points");
    expect(keys).toContain("environment");
    expect(keys).toContain("parent");
    expect(keys).toContain("child");
    expect(keys).toContain("customer");
  });

  it("should have correct types and options for Story points and Environment", () => {
    const sp = DEFAULT_CUSTOM_FIELDS.find((f) => f.defaultKey === "story_points");
    expect(sp).toBeDefined();
    expect(sp?.type).toBe("SELECT");
    expect(sp?.options).toEqual(["1", "2", "3", "5", "8", "13", "21"]);

    const env = DEFAULT_CUSTOM_FIELDS.find((f) => f.defaultKey === "environment");
    expect(env).toBeDefined();
    expect(env?.type).toBe("SELECT");
    expect(env?.options).toEqual(["dev", "integration", "uat", "production"]);
  });
});
