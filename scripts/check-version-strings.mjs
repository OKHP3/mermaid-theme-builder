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
// 3. Palette toolVersion consistency across the four source files
//
//    toolVersion is the palette output schema version — a distinct concept from
//    the app version in package.json — so it is NOT required to match `version`.
//    What IS required is that all four files agree with each other; a drift where
//    one file still says "0.3.0" while others say "0.4.0" is the failure mode
//    this check guards against.
// ---------------------------------------------------------------------------

const TOOL_VERSION_FILES = [
  "src/lib/exporters.ts",
  "src/lib/extractor.ts",
  "src/lib/palettes.ts",
  "src/App.tsx",
];

const TOOL_VERSION_RE = /toolVersion:\s*["']([^"']+)["']/;

const toolVersions = TOOL_VERSION_FILES.map((file) => {
  const src = read(file);
  const match = TOOL_VERSION_RE.exec(src);
  return { file, value: match ? match[1] : null };
});

const foundValues = toolVersions.map((t) => t.value);
const definedValues = foundValues.filter((v) => v !== null);
const canonical = definedValues[0] ?? null;
const allAgree = canonical !== null && definedValues.every((v) => v === canonical);

if (!allAgree) {
  const report = toolVersions
    .map(({ file, value }) => {
      const tag = value === canonical ? "✓" : "✗";
      return `    ${tag} ${file}: ${value !== null ? `"${value}"` : "(not found)"}`;
    })
    .join("\n");
  errors.push(
    `  ✗ Palette toolVersion consistency across ${TOOL_VERSION_FILES.length} files\n` +
      `      Values found:\n${report}\n` +
      `      Fix: update all toolVersion fields to the same string before releasing.`
  );
} else {
  console.log(
    `  ✓ Palette toolVersion is "${canonical}" in all ${TOOL_VERSION_FILES.length} files`
  );
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
