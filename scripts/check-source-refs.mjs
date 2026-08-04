#!/usr/bin/env node
/**
 * check-source-refs.mjs
 *
 * Companion to scripts/check-links.sh. Scans TypeScript source files for
 * inline file-path references in JSDoc and line comments, then validates that
 * each referenced path exists on disk.
 *
 * Patterns matched (comment context only):
 *   @see src/lib/foo.ts
 *   @see {src/lib/foo.ts}
 *   @file src/lib/foo.ts
 *   (src/components/Bar.tsx)           — parenthesised cross-reference
 *   bare path in a comment line:       * Tests for helper in src/lib/baz.ts.
 *   e2e/  scripts/  docs/  cross-refs  — same patterns for those roots
 *
 * Only lines that are clearly in comment context are scanned:
 *   //  ...
 *    *  ...  (block-comment continuation)
 *   /** ...
 *   /*  ...
 *
 * Import / export statements and lines in string literals are skipped via
 * the comment-context filter.
 *
 * Usage:
 *   node scripts/check-source-refs.mjs          # scans src/ and e2e/
 *   pnpm run check:source-refs
 *
 * Exits 0 when all referenced paths resolve; exits 1 with clear output otherwise.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function findTs(dir) {
  try {
    return execSync(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" \\)`, {
      cwd: root,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

const scanDirs = ["src", "e2e"];
const allFiles = scanDirs.flatMap(findTs);

if (allFiles.length === 0) {
  console.error("No TypeScript files found to scan.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Regex
// ---------------------------------------------------------------------------

// Matches a local file-path reference in a comment.
// Roots: src/ e2e/ scripts/ docs/
// Extensions: .ts .tsx .sh .mjs .js .md .snap
const PATH_RE =
  /\b(src|e2e|scripts|docs)\/([\w./-]+?\.(ts|tsx|sh|mjs|js|md|snap))\b/g;

// A line is "comment context" if, after stripping leading whitespace, it starts
// with one of: // * /** /*
// This reliably covers both single-line comments and block-comment continuations.
const COMMENT_LINE_RE = /^\s*(\/\/|\*|\/\*\*|\/\*)/;

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

console.log(`\nScanning ${allFiles.length} TypeScript file(s) for cross-reference drift…\n`);

let totalRefs = 0;
let brokenCount = 0;
let failed = false;

for (const relPath of allFiles) {
  const absPath = resolve(root, relPath);
  const src = readFileSync(absPath, "utf8");
  const lines = src.split(/\r?\n/);

  const fileErrors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!COMMENT_LINE_RE.test(line)) continue;

    // Strip any http(s):// URLs from the line before matching so that a path
    // embedded in a GitHub URL (e.g. "https://github.com/.../src/lib/foo.ts")
    // is not incorrectly treated as a local cross-reference.
    const lineWithoutUrls = line.replace(/https?:\/\/\S+/g, "");

    let match;
    PATH_RE.lastIndex = 0;
    while ((match = PATH_RE.exec(lineWithoutUrls)) !== null) {
      const rawRef = match[0]; // e.g. "src/lib/foo.ts"
      // Skip __snapshots__ entries — they are auto-generated and referenced
      // only as informational paths, not stable cross-references.
      if (rawRef.includes("__snapshots__")) continue;

      totalRefs++;
      const resolved = resolve(root, rawRef);
      if (!existsSync(resolved)) {
        fileErrors.push({ line: i + 1, ref: rawRef });
        brokenCount++;
        failed = true;
      }
    }
  }

  if (fileErrors.length > 0) {
    console.error(`  ${relPath}`);
    for (const { line, ref } of fileErrors) {
      console.error(`    [BROKEN] line ${line}: ${ref}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log(`\nScanned ${totalRefs} cross-reference(s) across ${allFiles.length} file(s).\n`);

if (failed) {
  console.error(`FAIL: ${brokenCount} broken source cross-reference(s) detected.\n`);
  console.error(
    "  Update the comment to use the current file path, then re-run:\n" +
      "    pnpm run check:source-refs\n"
  );
  process.exit(1);
}

console.log("PASS: All source cross-references are valid. ✓\n");
