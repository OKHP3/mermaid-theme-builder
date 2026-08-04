import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard against accidentally changing the python-N.N module declaration in .replit.
// If that line drifts to a different major.minor, Replit silently switches the Python
// version and could break environment tooling.  The project pins Python 3.11 — any
// other major.minor is a breakage.

const REQUIRED_MAJOR_MINOR = "3.11";

const ROOT = resolve(import.meta.dirname, "../..");

describe(".replit python module declaration", () => {
  const replit = readFileSync(resolve(ROOT, ".replit"), "utf8");

  it("contains a python-N.N module entry", () => {
    expect(replit).toMatch(/python-\d+\.\d+/);
  });

  it(`declares Python major.minor version ${REQUIRED_MAJOR_MINOR}`, () => {
    const match = replit.match(/python-(\d+\.\d+)/);
    expect(
      match,
      'Could not find a "python-N.N" entry in .replit modules. ' +
        'Expected a line like: modules = ["nodejs-24", "python-3.11"]'
    ).not.toBeNull();

    const majorMinor = match![1];
    expect(
      majorMinor,
      `The python module in .replit declares ${majorMinor}, expected ${REQUIRED_MAJOR_MINOR}. ` +
        `Update the expected version in this test only after verifying Python ${majorMinor} works in the Replit environment.`
    ).toBe(REQUIRED_MAJOR_MINOR);
  });
});
