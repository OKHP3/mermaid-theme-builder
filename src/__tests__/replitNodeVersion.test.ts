import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard against accidentally changing the nodejs-N module declaration in .replit.
// If that line drifts to a different major, Replit silently switches the Node.js
// version and breaks the build.  The project pins Node.js 24 — any other major
// is a breakage.

const REQUIRED_MAJOR = 24;

const ROOT = resolve(import.meta.dirname, "../..");

describe(".replit nodejs module declaration", () => {
  const replit = readFileSync(resolve(ROOT, ".replit"), "utf8");

  it("contains a nodejs-N module entry", () => {
    expect(replit).toMatch(/nodejs-\d+/);
  });

  it(`declares Node.js major version ${REQUIRED_MAJOR}`, () => {
    const match = replit.match(/nodejs-(\d+)/);
    expect(
      match,
      'Could not find a "nodejs-N" entry in .replit modules. ' +
        'Expected a line like: modules = ["nodejs-24", ...]'
    ).not.toBeNull();

    const major = Number(match![1]);
    expect(
      major,
      `The nodejs module in .replit declares major ${major}, expected ${REQUIRED_MAJOR}. ` +
        `Update the expected major in this test only after verifying Node.js ${major} works in the Replit environment.`
    ).toBe(REQUIRED_MAJOR);
  });
});
