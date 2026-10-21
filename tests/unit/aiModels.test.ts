import { describe, expect, it } from "vitest";
import { PROVIDER_DEFAULT_MODELS, RETIRED_MODELS, usableModel } from "@/lib/ai/types";

describe("usableModel", () => {
  it("keeps a model the user chose", () => {
    expect(usableModel("gemini-3.8-flash")).toBe("gemini-3.8-flash");
    expect(usableModel("  gpt-4o-mini ")).toBe("gpt-4o-mini");
  });
  it("ignores empty values so the app default applies", () => {
    for (const value of [null, undefined, "", "   "]) expect(usableModel(value)).toBeUndefined();
  });
  it("ignores retired models that older settings saved by mistake", () => {
    for (const model of RETIRED_MODELS) expect(usableModel(model)).toBeUndefined();
  });
  it("never defaults to a retired model", () => {
    for (const model of Object.values(PROVIDER_DEFAULT_MODELS)) expect(RETIRED_MODELS.has(model)).toBe(false);
  });
});
