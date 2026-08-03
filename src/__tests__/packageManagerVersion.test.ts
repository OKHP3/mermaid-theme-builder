import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard against accidentally copying a downstream packageManager version bump
// (e.g. from mermaid's own package.json) that would crash every workflow.
// The project pins pnpm 10.x.x — any other major is a breakage.

const REQUIRED_MAJOR = 10;
const PACKAGE_MANAGER_RE = /^pnpm@(\d+)\.(\d+)\.(\d+)$/;

const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8")
) as { packageManager?: unknown };

describe("packageManager field in package.json", () => {
  it('is present and starts with "pnpm@"', () => {
    expect(typeof packageJson.packageManager).toBe("string");
    expect(packageJson.packageManager as string).toMatch(/^pnpm@/);
  });

  it(`matches the exact format pnpm@<major>.<minor>.<patch> with major === ${REQUIRED_MAJOR}`, () => {
    const value = packageJson.packageManager as string;
    const match = PACKAGE_MANAGER_RE.exec(value);
    expect(
      match,
      `"packageManager" must be "pnpm@${REQUIRED_MAJOR}.x.x" but got "${value}". ` +
        `Copying a version from another project's package.json (e.g. mermaid) will crash every workflow.`
    ).not.toBeNull();

    const major = Number(match![1]);
    expect(
      major,
      `"packageManager" major version must be ${REQUIRED_MAJOR}, got ${major} (full value: "${value}"). ` +
        `Update the expected major in this test only after verifying pnpm ${major} works in the Replit environment.`
    ).toBe(REQUIRED_MAJOR);
  });
});
