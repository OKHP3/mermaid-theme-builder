#!/usr/bin/env node
/**
 * check-version-strings.mjs
 *
 * Guards against stale version strings in docs/ and src/ after a version bump.
 *
 * Checks:
 *   1. TOOL_VERSION in src/lib/theme-engine.ts matches package.json "version"
 *   2. docs/attribution.md sample line contains the current version
 *
 * Usage:
 *   node scripts/check-version-strings.mjs          # exits 0 if all OK, 1 if any stale
 *   pnpm run check:version-strings
 *
 * Run this as part of the pre-release checklist or wired into CI.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

const errors = [];

function check(label, file, pattern, hint) {
  const src = read(file);
  if (!pattern.test(src)) {
    errors.push(`  ✗ ${label}\n      file : ${file}\n      hint : ${hint}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Read canonical version from package.json
// ---------------------------------------------------------------------------

const pkg = JSON.parse(read("package.json"));
const version = pkg.version; // e.g. "0.5.0"

if (!version) {
  console.error("Could not read version from package.json");
  process.exit(1);
}

console.log(`\nChecking version strings for v${version}…\n`);

// ---------------------------------------------------------------------------
// 1. TOOL_VERSION in src/lib/theme-engine.ts
// ---------------------------------------------------------------------------

check(
  `TOOL_VERSION in src/lib/theme-engine.ts is "${version}"`,
  "src/lib/theme-engine.ts",
  new RegExp(`TOOL_VERSION\\s*=\\s*["']${version.replace(/\./g, "\\.")}["']`),
  `Update: const TOOL_VERSION = "${version}";`
);

// ---------------------------------------------------------------------------
// 2. docs/attribution.md sample attribution line
// ---------------------------------------------------------------------------

check(
  `docs/attribution.md sample line references "v${version}"`,
  "docs/attribution.md",
  new RegExp(`v${version.replace(/\./g, "\\.")}`),
  `Update the example "%% Created with: Mermaid Theme Builder v${version}" line`
);

// ---------------------------------------------------------------------------
// 3. Palette toolVersion consistency — dynamic scan of all production sources
//
//    toolVersion is the palette output schema version — a distinct concept from
//    the app version in package.json — so it is NOT required to match `version`.
//    What IS required is that every production toolVersion occurrence agrees
//    with every other one.  A drift where one file still says "0.3.0" while
//    another says "0.4.0" is silently dangerous and this check guards against it.
//
//    Strategy:
//      - Recursively scan src/**/*.{ts,tsx} for lines containing toolVersion:
//      - Exclude test files (src/__tests__/**) which use synthetic fixture values
//      - Collect EVERY matching occurrence (not just first-per-file) so multi-
//        entry files cannot hide drift
//      - Assert all collected values are identical
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from "node:fs";

/** Recursively collect *.ts / *.tsx paths under a directory. */
function collectTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const TOOL_VERSION_LINE_RE = /toolVersion:\s*["']([^"']+)["']/g;

/** Returns all toolVersion values found in a source string. */
function extractAllToolVersions(src) {
  const hits = [];
  let m;
  while ((m = TOOL_VERSION_LINE_RE.exec(src)) !== null) {
    hits.push(m[1]);
  }
  return hits;
}

const srcDir = resolve(root, "src");
const testDir = resolve(root, "src/__tests__");

const allTsFiles = collectTsFiles(srcDir).filter(
  // Exclude test fixtures — they deliberately use synthetic versions.
  (f) => !f.startsWith(testDir)
);

/** @type {Array<{file: string, value: string}>} */
const toolVersionOccurrences = [];

for (const absPath of allTsFiles) {
  const rel = absPath.slice(root.length + 1);
  const src = readFileSync(absPath, "utf8");
  const values = extractAllToolVersions(src);
  for (const value of values) {
    toolVersionOccurrences.push({ file: rel, value });
  }
}

if (toolVersionOccurrences.length === 0) {
  errors.push(
    `  ✗ Palette toolVersion consistency\n` +
      `      No toolVersion occurrences found in src/ (excluding __tests__).\n` +
      `      Expected at least one production file to declare it.`
  );
} else {
  const canonical = toolVersionOccurrences[0].value;
  const disagreements = toolVersionOccurrences.filter((o) => o.value !== canonical);

  if (disagreements.length === 0) {
    console.log(
      `  ✓ Palette toolVersion is "${canonical}" in all ` +
        `${toolVersionOccurrences.length} production occurrence(s) across ` +
        `${new Set(toolVersionOccurrences.map((o) => o.file)).size} file(s)`
    );
  } else {
    const report = toolVersionOccurrences
      .map(({ file, value }) => {
        const tag = value === canonical ? "✓" : "✗";
        return `    ${tag} ${file}: "${value}"`;
      })
      .join("\n");
    errors.push(
      `  ✗ Palette toolVersion consistency — ${disagreements.length} occurrence(s) disagree with canonical "${canonical}"\n` +
        `      Occurrences:\n${report}\n` +
        `      Fix: update all toolVersion fields to the same string before releasing.`
    );
  }
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

if (errors.length > 0) {
  console.error(`\n${errors.length} stale version string(s) found:\n`);
  errors.forEach((e) => console.error(e));
  console.error(
    `\nRun the release checklist section "Pre-release: version strings" to fix these.\n`
  );
  process.exit(1);
}

console.log(`\nAll version strings are current (v${version}). ✓\n`);
