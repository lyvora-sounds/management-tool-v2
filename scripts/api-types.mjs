#!/usr/bin/env node
// Generates lib/api/schema.d.ts from the OpenAPI document that kiki-api publishes.
//
//   pnpm api:types                 reads ${NEXT_PUBLIC_API_URL}/openapi.json (or the staging API) and rewrites the file
//   pnpm api:types ./openapi.json  reads a local file instead (kiki-api: `pnpm openapi > openapi.json`)
//   pnpm api:types --check         changes nothing; exits 1 if the committed types differ from the API
//
// A route that changes its response then fails `tsc` here, in the pull request, not in production.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

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
  const current = readFileSync(OUT, "utf8");
  if (current !== generated) {
    console.error("api-types: lib/api/schema.d.ts is out of date with the API. Run `pnpm api:types` and fix what tsc reports.");
    process.exit(1);
  }
  console.log("api-types: up to date");
} else {
  writeFileSync(OUT, generated);
  console.log(`api-types: wrote lib/api/schema.d.ts from ${source}`);
}
