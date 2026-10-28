import openapiTS, { astToString } from "openapi-typescript";
import { describe, expect, it } from "vitest";
import { compareTypes, isSubsequence, parseBlocks } from "../../scripts/apiTypesDiff.mjs";

type Schema = Record<string, unknown>;

/** A tiny OpenAPI document, turned into types by the same generator the app uses. */
async function types(opts: { routes: Record<string, string>; schemas: Record<string, Schema> }) {
  const paths = Object.fromEntries(
    Object.entries(opts.routes).map(([path, schema]) => [
      path,
      { get: { responses: { "200": { description: "ok", content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } } } } },
    ]),
  );
  const doc = { openapi: "3.1.0", info: { title: "t", version: "1" }, paths, components: { schemas: opts.schemas } };
  return astToString(await openapiTS(doc as never));
}

const obj = (props: Record<string, Schema>, required = Object.keys(props)) => ({ type: "object", properties: props, required });
const str = { type: "string" };

const base = () => types({ routes: { "/a": "A", "/b": "B" }, schemas: { A: obj({ id: str, name: str }), B: obj({ ok: { type: "boolean" } }) } });

describe("parseBlocks", () => {
  it("finds every route and every schema", async () => {
    const { paths, schemas } = parseBlocks(await base());
    expect([...paths.keys()].sort()).toEqual(["/a", "/b"]);
    expect([...schemas.keys()].sort()).toEqual(["A", "B"]);
  });
});

describe("isSubsequence", () => {
  it("accepts a block that only gained lines and refuses one that lost or changed a line", () => {
    expect(isSubsequence(["a", "c"], ["a", "b", "c"])).toBe(true);
    expect(isSubsequence(["a", "b", "c"], ["a", "c"])).toBe(false);
    expect(isSubsequence(["a", "b"], ["a", "x"])).toBe(false);
    expect(isSubsequence(["b", "a"], ["a", "b"])).toBe(false);
  });
});

describe("compareTypes", () => {
  it("is quiet when nothing changed", async () => {
    const t = await base();
    expect(compareTypes(t, t)).toEqual({ breaking: [], additive: [], added: { paths: [], schemas: [] } });
  });

  it("does not care about the order of routes and schemas", async () => {
    const reordered = await types({ routes: { "/b": "B", "/a": "A" }, schemas: { B: obj({ ok: { type: "boolean" } }), A: obj({ id: str, name: str }) } });
    expect(compareTypes(await base(), reordered).breaking).toEqual([]);
  });

  it("lets the API grow: a new route and a new schema are only reported", async () => {
    const grown = await types({
      routes: { "/a": "A", "/b": "B", "/c": "C" },
      schemas: { A: obj({ id: str, name: str }), B: obj({ ok: { type: "boolean" } }), C: obj({ x: str }) },
    });
    const r = compareTypes(await base(), grown);
    expect(r.breaking).toEqual([]);
    expect(r.added).toEqual({ paths: ["/c"], schemas: ["C"] });
  });

  it("treats a new field on a schema as additive, not breaking", async () => {
    const withField = await types({
      routes: { "/a": "A", "/b": "B" },
      schemas: { A: obj({ id: str, name: str, nickname: str }), B: obj({ ok: { type: "boolean" } }) },
    });
    const r = compareTypes(await base(), withField);
    expect(r.breaking).toEqual([]);
    expect(r.additive).toEqual([{ kind: "schema", name: "A" }]);
  });

  it("breaks when a field the app reads is removed", async () => {
    const removed = await types({ routes: { "/a": "A", "/b": "B" }, schemas: { A: obj({ id: str }), B: obj({ ok: { type: "boolean" } }) } });
    expect(compareTypes(await base(), removed).breaking).toEqual([{ kind: "schema", name: "A", reason: "changed" }]);
  });

  it("breaks when a field changes type", async () => {
    const retyped = await types({
      routes: { "/a": "A", "/b": "B" },
      schemas: { A: obj({ id: { type: "number" }, name: str }), B: obj({ ok: { type: "boolean" } }) },
    });
    expect(compareTypes(await base(), retyped).breaking).toEqual([{ kind: "schema", name: "A", reason: "changed" }]);
  });

  it("breaks when a field becomes optional", async () => {
    const optional = await types({
      routes: { "/a": "A", "/b": "B" },
      schemas: { A: obj({ id: str, name: str }, ["id"]), B: obj({ ok: { type: "boolean" } }) },
    });
    expect(compareTypes(await base(), optional).breaking).toEqual([{ kind: "schema", name: "A", reason: "changed" }]);
  });

  it("breaks when a route the app knows disappears", async () => {
    const gone = await types({ routes: { "/a": "A" }, schemas: { A: obj({ id: str, name: str }), B: obj({ ok: { type: "boolean" } }) } });
    expect(compareTypes(await base(), gone).breaking).toEqual([{ kind: "route", name: "/b", reason: "removed" }]);
  });

  it("breaks when a route now answers with another schema", async () => {
    const swapped = await types({
      routes: { "/a": "B", "/b": "B" },
      schemas: { A: obj({ id: str, name: str }), B: obj({ ok: { type: "boolean" } }) },
    });
    expect(compareTypes(await base(), swapped).breaking).toEqual([{ kind: "route", name: "/a", reason: "changed" }]);
  });

  it("breaks when a schema the app knows disappears", async () => {
    const gone = await types({ routes: { "/b": "B" }, schemas: { B: obj({ ok: { type: "boolean" } }) } });
    const names = compareTypes(await base(), gone).breaking.map((b) => `${b.kind}:${b.name}`);
    expect(names).toEqual(expect.arrayContaining(["route:/a", "schema:A"]));
  });
});
