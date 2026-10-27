#!/usr/bin/env node
// Generates lib/api/schema.d.ts from the OpenAPI document that kiki-api publishes.
//
//   pnpm api:types                 reads ${NEXT_PUBLIC_API_URL}/openapi.json (or the staging API) and rewrites the file
//   pnpm api:types ./openapi.json  reads a local file instead (kiki-api: `pnpm openapi > openapi.json`)
//   pnpm api:types --check         changes nothing; exits 1 only if something the app already knows BROKE
//
// A route that changes its response then fails `tsc` here, in the pull request, not in production.
//
// --check does not demand that the file is identical to the API. The API keeps growing, and every open pull
// request would turn red at each deploy. It fails when a route or schema in the committed file was removed or
// changed in a way that is not purely additive. New routes, new schemas and new fields are only reported.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import { compareTypes } from "./apiTypesDiff.mjs";

const OUT = fileURLToPath(new URL("../lib/api/schema.d.ts", import.meta.url));
const DEFAULT_URL = "https://api-staging.kikiboard.xyz";

const args = process.argv.slice(2);
const check = args.includes("--check");
const source =
  args.find((a) => !a.startsWith("--")) ?? `${(process.env.NEXT_PUBLIC_API_URL || DEFAULT_URL).replace(/\/+$/, "")}/openapi.json`;

const HEADER = `/**
 * Generated from the kiki-api OpenAPI document by scripts/api-types.mjs. Do not edit by hand.
 * Regenerate with \`pnpm api:types\` after the API changes.
 */

`;

let document;
try {
  document = /^https?:/.test(source)
    ? await (async () => {
        const res = await fetch(source, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })()
    : JSON.parse(readFileSync(source, "utf8"));
} catch (error) {
  // In --check mode an unreachable API is not drift: do not fail a pull request because staging is down.
  if (check) {
    console.warn(`api-types: could not read ${source} (${error.message}); skipping the check`);
    process.exit(0);
  }
  console.error(`api-types: could not read ${source}: ${error.message}`);
  process.exit(1);
}

const generated = HEADER + astToString(await openapiTS(document));

if (check) {
  const { breaking, additive, added } = compareTypes(readFileSync(OUT, "utf8"), generated);

  if (breaking.length > 0) {
    console.error("api-types: the API changed something lib/api/schema.d.ts already knows:");
    for (const b of breaking) console.error(`  ${b.reason.padEnd(8)} ${b.kind} ${b.name}`);
    console.error("Run `pnpm api:types` and fix what tsc reports.");
    process.exit(1);
  }

  const news = added.paths.length + added.schemas.length + additive.length;
  if (news === 0) {
    console.log("api-types: up to date");
  } else {
    console.log(
      `api-types: nothing the app uses has broken. The API also has ${added.paths.length} new route(s), ${added.schemas.length} new schema(s) and ${additive.length} schema/route(s) with new fields. Run \`pnpm api:types\` when you need them.`,
    );
  }
} else {
  writeFileSync(OUT, generated);
  console.log(`api-types: wrote lib/api/schema.d.ts from ${source}`);
}
