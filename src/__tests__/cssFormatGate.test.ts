/**
 * cssFormatGate.test.ts
 *
 * Confirms that the project's Prettier format-check gate catches CSS
 * formatting violations before they reach the pre-commit hook or CI.
 *
 * The `pnpm run format` script runs:
 *   prettier --check "src/**\/*.{ts,tsx,css}" ...
 *
 * These tests verify the gate via the Prettier Node.js API, which is the
 * authoritative source of truth for whether `prettier --check` would exit
 * non-zero. A string that fails `prettier.check()` is exactly the same string
 * that would cause the CLI to report a formatting violation.
 *
 * Three violation classes are confirmed:
 *   1. Uppercase hex colours (e.g. #FF0000 → #ff0000)
 *   2. Compressed multi-declaration rules that should be split across lines
 *   3. Missing semicolons on CSS declarations
 *
 * One clean-file check confirms no false positives.
 */

import { describe, it, expect } from "vitest";
import prettier from "prettier";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const prettierConfig = JSON.parse(readFileSync(resolve(root, ".prettierrc"), "utf8")) as Record<
  string,
  unknown
>;

/** Returns true when the CSS string is already formatted; false when it needs reformatting. */
async function isFormatted(css: string): Promise<boolean> {
  return prettier.check(css, { ...prettierConfig, parser: "css" });
}

// ---------------------------------------------------------------------------
// 1. CSS violations — gate must catch them (isFormatted → false)
// ---------------------------------------------------------------------------

describe("Prettier CSS format gate — violations are caught", () => {
  it("uppercase hex colour causes a formatting violation", async () => {
    // Prettier normalises hex digits to lowercase: #FF0000 → #ff0000.
    const unformatted = ".forge-card {\n  color: #FF0000;\n}\n";
    expect(await isFormatted(unformatted)).toBe(false);
  });

  it("compressed multi-declaration single-line rule causes a formatting violation", async () => {
    // Prettier expands single-line rules with multiple declarations to multi-line.
    // This is the canonical form that violates the CSS format gate.
    const unformatted =
      ".forge-header { background-color: var(--forge-header-bg); color: var(--forge-header-fg); border-bottom: 1px solid var(--forge-header-border); }\n";
    expect(await isFormatted(unformatted)).toBe(false);
  });

  it("missing semicolon on a CSS declaration causes a formatting violation", async () => {
    // Prettier adds missing semicolons; a declaration without one is not considered formatted.
    const unformatted = ".forge-card {\n  color: red\n}\n";
    expect(await isFormatted(unformatted)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Clean CSS — gate must not fire (isFormatted → true)
// ---------------------------------------------------------------------------

describe("Prettier CSS format gate — clean files are not flagged", () => {
  it("correctly formatted CSS rule is considered already formatted", async () => {
    const formatted = ".forge-card {\n  color: #ff0000;\n}\n";
    expect(await isFormatted(formatted)).toBe(true);
  });

  it("the project's src/index.css passes the gate (no false positive on real project file)", async () => {
    // Sanity-check: the file the gate runs against in CI must be clean itself.
    const source = readFileSync(resolve(root, "src/index.css"), "utf8");
    expect(await isFormatted(source)).toBe(true);
  });

  it("the project's src/styles/forge-tokens.css passes the gate", async () => {
    const source = readFileSync(resolve(root, "src/styles/forge-tokens.css"), "utf8");
    expect(await isFormatted(source)).toBe(true);
  });
});
