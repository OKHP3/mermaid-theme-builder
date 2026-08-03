import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard against accidentally bumping the Node.js major version in package.json
// engines.node, .nvmrc, or .node-version to a value that would break CI runners
// or the Replit environment.  The project pins Node.js 24 — any other major is a breakage.

const REQUIRED_MAJOR = 24;

const ROOT = resolve(import.meta.dirname, "../..");

function readOptional(filename: string): string | null {
  try {
    return readFileSync(resolve(ROOT, filename), "utf8").trim();
  } catch {
    return null;
  }
}

/** Extract the leading major version integer from strings like >=24.0.0, 24.x, ^24, lts/*, v24.1.2 */
function extractMajor(value: string): number | null {
  const match = value.match(/v?(\d+)/);
  return match ? Number(match[1]) : null;
}

const packageJson = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as {
  engines?: { node?: unknown };
};

describe("Node.js version declarations", () => {
  describe("package.json engines.node", () => {
    it("is present and is a string", () => {
      expect(packageJson.engines, '"engines" field must exist in package.json').toBeDefined();
      expect(typeof packageJson.engines?.node, '"engines.node" field must be a string').toBe(
        "string"
      );
    });

    it(`declares major version ${REQUIRED_MAJOR}`, () => {
      const value = packageJson.engines?.node as string;
      const major = extractMajor(value);
      expect(
        major,
        `Could not parse a version number from engines.node "${value}". ` +
          `Expected a value like ">=24.0.0" or "24.x".`
      ).not.toBeNull();
      expect(
        major,
        `engines.node major must be ${REQUIRED_MAJOR}, got ${major} (full value: "${value}"). ` +
          `Update the expected major in this test only after verifying Node.js ${major} works in the Replit environment.`
      ).toBe(REQUIRED_MAJOR);
    });
  });

  describe(".nvmrc (optional)", () => {
    const nvmrc = readOptional(".nvmrc");

    it(`declares major version ${REQUIRED_MAJOR} when present`, () => {
      if (nvmrc === null) return; // file absent — nothing to check

      const major = extractMajor(nvmrc);
      expect(
        major,
        `Could not parse a version number from .nvmrc content "${nvmrc}".`
      ).not.toBeNull();
      expect(
        major,
        `.nvmrc major must be ${REQUIRED_MAJOR}, got ${major} (content: "${nvmrc}"). ` +
          `Update the expected major in this test only after verifying Node.js ${major} works in the Replit environment.`
      ).toBe(REQUIRED_MAJOR);
    });
  });

  describe(".node-version (optional)", () => {
    const nodeVersion = readOptional(".node-version");

    it(`declares major version ${REQUIRED_MAJOR} when present`, () => {
      if (nodeVersion === null) return; // file absent — nothing to check

      const major = extractMajor(nodeVersion);
      expect(
        major,
        `Could not parse a version number from .node-version content "${nodeVersion}".`
      ).not.toBeNull();
      expect(
        major,
        `.node-version major must be ${REQUIRED_MAJOR}, got ${major} (content: "${nodeVersion}"). ` +
          `Update the expected major in this test only after verifying Node.js ${major} works in the Replit environment.`
      ).toBe(REQUIRED_MAJOR);
    });
  });
});
