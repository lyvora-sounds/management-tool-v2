#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const glossaryPath = path.join(rootDir, "i18n", "glossary.json");
const messagesDir = path.join(rootDir, "messages");
const defaultLocale = "en";

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function flattenKeys(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordPattern(term, caseSensitive) {
  return new RegExp(
    `(?<=^|[^\\p{L}\\p{N}_])${escapeRegex(term)}(?=[^\\p{L}\\p{N}_]|$)`,
    caseSensitive ? "gu" : "giu",
  );
}

function run() {
  const args = process.argv.slice(2);
  const isCheckMode = args.includes("--check") || !args.includes("--sync");

  const glossary = loadJSON(glossaryPath) || {};
  const enFile = path.join(messagesDir, `${defaultLocale}.json`);
  const enData = loadJSON(enFile);

  if (!enData) {
    console.error(`Base dictionary not found at ${enFile}`);
    process.exit(1);
  }

  const enFlat = flattenKeys(enData);
  const locales = fs
    .readdirSync(messagesDir)
    .filter((f) => f.endsWith(".json") && f !== `${defaultLocale}.json`)
    .map((f) => f.replace(".json", ""));

  let hasErrors = false;

  for (const locale of locales) {
    const targetFile = path.join(messagesDir, `${locale}.json`);
    const targetData = loadJSON(targetFile) || {};
    const targetFlat = flattenKeys(targetData);

    console.log(`Checking locale: [${locale}]`);

    const missingKeys = Object.keys(enFlat).filter((key) => !(key in targetFlat));
    const extraKeys = Object.keys(targetFlat).filter((key) => !(key in enFlat));
    const glossaryIssues = [];

    for (const [key, targetVal] of Object.entries(targetFlat)) {
      const enVal = enFlat[key] || "";

      for (const [term, rule] of Object.entries(glossary)) {
        const expectedInTarget = rule[locale];
        if (!expectedInTarget) continue;

        const sourcePattern = wordPattern(term, rule.caseSensitive);
        if (!sourcePattern.test(enVal)) continue;

        const variants = [expectedInTarget];
        const pluralSibling = glossary[`${term}s`]?.[locale];
        if (pluralSibling) variants.push(pluralSibling);
        if (!expectedInTarget.endsWith("s")) variants.push(`${expectedInTarget}s`);

        const matchesExpected = variants.some((variant) =>
          wordPattern(variant, rule.caseSensitive).test(targetVal),
        );
        if (!matchesExpected) {
          glossaryIssues.push({
            key,
            term,
            expectedInTarget,
            current: targetVal,
          });
        }
      }
    }

    if (missingKeys.length > 0) {
      console.warn(`  Missing ${missingKeys.length} key(s):`);
      missingKeys.slice(0, 20).forEach((k) => console.warn(`     - ${k}`));
      if (missingKeys.length > 20) {
        console.warn(`     ... and ${missingKeys.length - 20} more.`);
      }
      hasErrors = true;
    } else {
      console.log(`  All ${Object.keys(enFlat).length} keys are present.`);
    }

    if (extraKeys.length > 0) {
      console.warn(`  Extra ${extraKeys.length} key(s) not in ${defaultLocale}:`);
      extraKeys.slice(0, 10).forEach((k) => console.warn(`     - ${k}`));
    }

    if (glossaryIssues.length > 0) {
      console.error(`  Glossary consistency violation:`);
      glossaryIssues.forEach((issue) => {
        console.error(`     - ${issue.key}: "${issue.term}" should appear as "${issue.expectedInTarget}"`);
      });
      hasErrors = true;
    } else {
      console.log(`  Glossary terms are consistent.`);
    }
  }

  if (isCheckMode && hasErrors) {
    console.error("Translation check failed.\n");
    process.exit(1);
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log("Translation check finished successfully.\n");
}

run();
