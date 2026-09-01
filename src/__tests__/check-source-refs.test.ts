/**
 * Integration tests for scripts/check-source-refs.mjs.
 *
 * The script scans TypeScript files for comment-line cross-references and exits
 * 1 if any referenced path does not exist on disk. These tests scope the scan
 * to their temporary fixture so unrelated repository drift cannot affect them.
 *
 * Relevant files:
 * - scripts/check-source-refs.mjs — the script under test
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = resolve(root, "scripts/check-source-refs.mjs");

// The fixture lives inside src/__tests__/ and is passed explicitly with --file.
// The leading double-underscore name makes it easy to identify as a test artifact.
const FIXTURE = resolve(root, "src/__tests__/__drift-fixture.ts");
const FIXTURE_RELATIVE = "src/__tests__/__drift-fixture.ts";

function writeFixture(content: string): void {
  writeFileSync(FIXTURE, content, "utf8");
}

function runScript(...args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync("node", [SCRIPT, ...args], { cwd: root, encoding: "utf8" });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function cleanFixture(): void {
  try {
    if (existsSync(FIXTURE)) rmSync(FIXTURE);
  } catch {
    // Already gone — ignore.
  }
}

beforeEach(cleanFixture);
afterEach(cleanFixture);

describe("check-source-refs.mjs", () => {
  it("exits 1 and reports the broken path when a comment references a non-existent file", () => {
    // Introduce a cross-reference that points to a path that does not exist.
    // The script's comment-context filter only picks up lines starting with
    // // or *, so the reference must be in a comment, not a string or import.
    writeFixture("// See: src/nonexistent/does-not-exist.ts\nexport {};\n");

    const { status, stderr } = runScript("--file", FIXTURE_RELATIVE);

    expect(status).toBe(1);
    // The broken path should appear in the error output.
    expect(stderr).toContain("src/nonexistent/does-not-exist.ts");
    // The script labels broken references clearly.
    expect(stderr).toContain("BROKEN");
  });

  it("exits 0 when all comment-referenced paths resolve to real files on disk", () => {
    // Reference a path that is guaranteed to exist: the script under test itself.
    writeFixture("// See: scripts/check-source-refs.mjs\nexport {};\n");

    const { status } = runScript("--file", FIXTURE_RELATIVE);

    expect(status).toBe(0);
  });
});
