#!/usr/bin/env node
/**
 * check-doc-truth.mjs
 *
 * CI-safe truth-check that reads canonical source files and fails loudly when
 * documentation claims disagree with them.
 *
 * Checks:
 *   1. package.json "version"  vs  version string in index.html <meta name="description">
 *   2. README diagram-family count  vs  DIAGRAM_CAPABILITIES array length
 *      in src/data/mermaid-capabilities.ts
 *   3. README skill count (catalog comment)  vs  SKILL.md count under skills/
 *   4. README TypeScript version  vs  typescript devDependency in package.json
 *
 * On mismatch, prints a diff-style report (expected vs found, which files,
 * how to fix) and exits 1.
 * On clean pass, exits 0.
 *
 * Usage:
 *   node scripts/check-doc-truth.mjs
 *   pnpm run check:doc-truth
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
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

function pass(label, detail) {
  console.log(`  ✓  ${label}${detail ? `  (${detail})` : ""}`);
}

function fail(label, expected, found, hints = []) {
  const lines = [
    `  ✗  ${label}`,
    `       expected : ${expected}`,
    `       found    : ${found}`,
    ...hints.map((h) => `       hint     : ${h}`),
  ];
  const msg = lines.join("\n");
  errors.push(msg);
  console.error(msg);
}

// ---------------------------------------------------------------------------
// Load source files
// ---------------------------------------------------------------------------

const pkg = JSON.parse(read("package.json"));
const indexHtml = read("index.html");
const readme = read("README.md");
const capabilitiesTs = read("src/data/mermaid-capabilities.ts");

console.log("\nRunning documentation truth checks…\n");

// ---------------------------------------------------------------------------
// 1. package.json version vs index.html <meta name="description"> version
//
//    The description meta tag is the primary human-readable version surface
//    in the HTML shell.  It must match package.json so search engines, share
//    previews, and the skills catalog all agree on the current release.
// ---------------------------------------------------------------------------

const pkgVersion = pkg.version; // e.g. "0.6.1"

// Match both attribute orderings: name="description" content="..." and vice-versa
const htmlDescContent =
  indexHtml.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ??
  indexHtml.match(/<meta\s+content="([^"]*)"\s+name="description"/i)?.[1] ??
  null;

const htmlVersion = htmlDescContent?.match(/v(\d+\.\d+\.\d+)/)?.[1] ?? null;

if (htmlVersion === null) {
  fail(
    'index.html <meta name="description"> version',
    `v${pkgVersion}`,
    "(no vX.Y.Z pattern found in description content)",
    ['Add a "vX.Y.Z" version string to the description meta tag content in index.html']
  );
} else if (htmlVersion !== pkgVersion) {
  fail(
    'index.html <meta name="description"> version',
    `${pkgVersion}  (package.json)`,
    `${htmlVersion}  (index.html description)`,
    [
      `In index.html, update the description meta content version from v${htmlVersion} to v${pkgVersion}`,
    ]
  );
} else {
  pass('index.html <meta name="description"> version', `v${pkgVersion}`);
}

// ---------------------------------------------------------------------------
// 2. README diagram-family count vs DIAGRAM_CAPABILITIES array length
//
//    The README features bullet says "**N diagram families**".
//    The canonical count is the number of entries in the DIAGRAM_CAPABILITIES
//    array in src/data/mermaid-capabilities.ts (not including CAPABILITY_GAPS).
// ---------------------------------------------------------------------------

// Extract "**31 diagram families**" → 31
const readmeFamilyMatch = readme.match(/\*\*(\d+)\s+diagram\s+famil(?:y|ies)\*\*/i);
const readmeFamilyCount = readmeFamilyMatch ? parseInt(readmeFamilyMatch[1], 10) : null;

// Count id: occurrences in the DIAGRAM_CAPABILITIES array body only
// (slice between array declaration and getCapabilityById export)
const capsBodyStart = capabilitiesTs.indexOf("export const DIAGRAM_CAPABILITIES");
const capsBodyEnd = capabilitiesTs.indexOf("export function getCapabilityById");
const capabilitiesBody =
  capsBodyStart >= 0 && capsBodyEnd > capsBodyStart
    ? capabilitiesTs.slice(capsBodyStart, capsBodyEnd)
    : "";

const actualFamilyCount = capabilitiesBody === ""
  ? null
  : (capabilitiesBody.match(/\bid:\s*["']/g) ?? []).length;

if (actualFamilyCount === null) {
  fail(
    "README diagram-family count",
    "(could not locate DIAGRAM_CAPABILITIES array in mermaid-capabilities.ts)",
    String(readmeFamilyCount ?? "(not found in README)"),
    ["Check that DIAGRAM_CAPABILITIES is still exported from src/data/mermaid-capabilities.ts"]
  );
} else if (readmeFamilyCount === null) {
  fail(
    "README diagram-family count",
    `${actualFamilyCount}  (mermaid-capabilities.ts)`,
    "(no '**N diagram families**' pattern found in README)",
    [
      `Add a '**${actualFamilyCount} diagram families**' bullet to the README Features section`,
    ]
  );
} else if (readmeFamilyCount !== actualFamilyCount) {
  fail(
    "README diagram-family count",
    `${actualFamilyCount}  (DIAGRAM_CAPABILITIES entries in mermaid-capabilities.ts)`,
    `${readmeFamilyCount}  (README "**N diagram families**" claim)`,
    [
      `In README.md, update "**${readmeFamilyCount} diagram families**" → "**${actualFamilyCount} diagram families**"`,
    ]
  );
} else {
  pass("README diagram-family count", `${actualFamilyCount} families`);
}

// ---------------------------------------------------------------------------
// 3. README skill count (catalog comment) vs SKILL.md count under skills/
//
//    The auto-generated catalog section contains a comment:
//      <!-- Generated: … | Skills: 10 | … -->
//    The canonical count is the number of subdirectories under skills/ that
//    contain a SKILL.md file.
// ---------------------------------------------------------------------------

// Extract "Skills: 10" from the generated catalog comment
const readmeSkillMatch = readme.match(/Skills:\s*(\d+)\s*[|\s]/i);
const readmeSkillCount = readmeSkillMatch ? parseInt(readmeSkillMatch[1], 10) : null;

// Count actual SKILL.md files under skills/*/SKILL.md
const skillsDir = resolve(root, "skills");
let actualSkillCount = 0;
try {
  for (const entry of readdirSync(skillsDir)) {
    const entryPath = resolve(skillsDir, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    try {
      statSync(resolve(entryPath, "SKILL.md"));
      actualSkillCount++;
    } catch {
      // subdirectory has no SKILL.md — skip
    }
  }
} catch {
  // skills/ directory doesn't exist — actualSkillCount stays 0
}

if (readmeSkillCount === null) {
  fail(
    "README skill count",
    `${actualSkillCount}  (SKILL.md files under skills/)`,
    "(no 'Skills: N' pattern found in README catalog comment)",
    ["Regenerate the skills catalog section: python scripts/gen-skills-readme.py"]
  );
} else if (readmeSkillCount !== actualSkillCount) {
  fail(
    "README skill count",
    `${actualSkillCount}  (SKILL.md files under skills/)`,
    `${readmeSkillCount}  (README catalog comment 'Skills: N')`,
    ["Regenerate the skills catalog section: python scripts/gen-skills-readme.py"]
  );
} else {
  pass("README skill count", `${actualSkillCount} skills`);
}

// ---------------------------------------------------------------------------
// 4. README TypeScript version vs package.json devDependencies
//
//    The README Tech Stack table says "TypeScript X.Y".
//    The canonical source is the typescript devDependency in package.json.
//    We compare major.minor only (ignoring patch and range prefix).
// ---------------------------------------------------------------------------

// Extract major.minor from README Tech Stack table: "TypeScript 7.0"
const readmeTsMatch = readme.match(/TypeScript\s+(\d+\.\d+)(?:\s|\b|$)/i);
const readmeTsVersion = readmeTsMatch?.[1] ?? null; // e.g. "7.0"

// Extract major.minor from package.json: "~7.0.2" → "7.0"
const pkgTsRaw = pkg.devDependencies?.typescript ?? null; // e.g. "~7.0.2"
const pkgTsVersion = pkgTsRaw?.match(/(\d+\.\d+)/)?.[1] ?? null; // e.g. "7.0"

if (pkgTsVersion === null) {
  fail(
    "README TypeScript version",
    "(typescript not found in devDependencies)",
    readmeTsVersion ?? "(not found in README)",
    ["Add typescript to devDependencies in package.json"]
  );
} else if (readmeTsVersion === null) {
  fail(
    "README TypeScript version",
    `${pkgTsVersion}  (package.json devDependencies: "${pkgTsRaw}")`,
    "(no 'TypeScript N.N' pattern found in README Tech Stack table)",
    [`Add "TypeScript ${pkgTsVersion}" to the Tech Stack table in README.md`]
  );
} else if (readmeTsVersion !== pkgTsVersion) {
  fail(
    "README TypeScript version",
    `${pkgTsVersion}  (package.json devDependencies: "${pkgTsRaw}")`,
    `${readmeTsVersion}  (README Tech Stack table)`,
    [
      `In README.md Tech Stack table, update "TypeScript ${readmeTsVersion}" → "TypeScript ${pkgTsVersion}"`,
    ]
  );
} else {
  pass("README TypeScript version", `TypeScript ${pkgTsVersion}`);
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log("");

if (errors.length > 0) {
  console.error(
    `doc-truth: ${errors.length} mismatch${errors.length === 1 ? "" : "es"} found — fix the above before merging.\n`
  );
  process.exit(1);
}

console.log("doc-truth: all checks passed. ✓\n");
