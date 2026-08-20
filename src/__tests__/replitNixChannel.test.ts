import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guard against accidentally changing the Nix channel declaration in .replit.
// If that line drifts to a different stable release, Replit silently changes
// the system packages available in the environment.

const REQUIRED_CHANNEL = "stable-25_05";

const ROOT = resolve(import.meta.dirname, "../..");

describe(".replit Nix channel declaration", () => {
  const replit = readFileSync(resolve(ROOT, ".replit"), "utf8");

  it("contains a [nix] section", () => {
    expect(replit).toMatch(/^\[nix\]\s*$/m);
  });

  it(`declares Nix channel ${REQUIRED_CHANNEL}`, () => {
    const nixSectionStart = replit.match(/^\[nix\]\s*$/m);
    expect(nixSectionStart, 'Could not find a "[nix]" section in .replit.').not.toBeNull();

    const sectionStart = nixSectionStart!.index! + nixSectionStart![0].length;
    const afterNixSection = replit.slice(sectionStart);
    const nextSectionStart = afterNixSection.search(/^\[[^\]]+\]\s*$/m);
    const nixSection =
      nextSectionStart === -1 ? afterNixSection : afterNixSection.slice(0, nextSectionStart);
    const channel = nixSection.match(/^\s*channel\s*=\s*"([^"]+)"/m);
    expect(
      channel,
      'Could not find a `channel = "..."` entry in the [nix] section of .replit.'
    ).not.toBeNull();

    expect(
      channel![1],
      `The Nix channel in .replit declares ${channel![1]}, expected ${REQUIRED_CHANNEL}. ` +
        `Update the expected channel in this test only after verifying the new stable release works in the Replit environment.`
    ).toBe(REQUIRED_CHANNEL);
  });
});
