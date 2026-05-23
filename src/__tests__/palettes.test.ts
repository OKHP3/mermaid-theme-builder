import { describe, it, expect } from "vitest";
import { BUILTIN_PALETTES, REQUIRED_COLOR_KEYS } from "@/lib/palettes";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/;
const FONT_FAMILY_KEY = "fontFamily";
const CSS_KEYWORD_RE = /^transparent$|^inherit$|^currentColor$/i;

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

describe("BUILTIN_PALETTES — schema validation", () => {
  it("has no duplicate palette ids", () => {
    const ids = BUILTIN_PALETTES.map((p) => p.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(
      [...new Set(duplicates)],
      `Duplicate palette ids: ${[...new Set(duplicates)].join(", ")}`,
    ).toHaveLength(0);
  });

  for (const palette of BUILTIN_PALETTES) {
    describe(`palette "${palette.id}"`, () => {
      it("has a non-empty id", () => {
        expect(palette.id.trim(), "id must not be blank").not.toBe("");
      });

      it("has a non-empty name", () => {
        expect(palette.name.trim(), "name must not be blank").not.toBe("");
      });

      it("has a non-empty description", () => {
        expect(palette.description.trim(), "description must not be blank").not.toBe("");
      });

      it("has a semver-formatted version", () => {
        expect(
          SEMVER_RE.test(palette.version),
          `version "${palette.version}" does not match semver (e.g. 0.1.0)`,
        ).toBe(true);
      });

      it("attribution has a non-empty label", () => {
        expect(
          palette.attribution.label.trim(),
          "attribution.label must not be blank",
        ).not.toBe("");
      });

      it("attribution has a non-empty themeName", () => {
        expect(
          palette.attribution.themeName.trim(),
          "attribution.themeName must not be blank",
        ).not.toBe("");
      });
    });
  }
});

describe("BUILTIN_PALETTES — color token completeness", () => {
  it("exports at least one palette", () => {
    expect(BUILTIN_PALETTES.length).toBeGreaterThan(0);
  });

  for (const palette of BUILTIN_PALETTES) {
    describe(`palette "${palette.name}" (${palette.id})`, () => {
      it("contains all 11 required color keys", () => {
        const presentKeys = new Set(palette.colors.map((c) => c.key));
        const missingKeys = REQUIRED_COLOR_KEYS.filter((k) => !presentKeys.has(k));
        expect(
          missingKeys,
          `Missing required keys: ${missingKeys.join(", ")}`,
        ).toHaveLength(0);
      });

      it("has no duplicate color keys", () => {
        const keys = palette.colors.map((c) => c.key);
        const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
        expect(
          [...new Set(duplicates)],
          `Duplicate keys found: ${[...new Set(duplicates)].join(", ")}`,
        ).toHaveLength(0);
      });

      it("has valid values for all color entries", () => {
        const invalid: string[] = [];
        for (const { key, value } of palette.colors) {
          if (key === FONT_FAMILY_KEY) {
            if (!value || value.trim().length === 0) {
              invalid.push(`${key}: empty font-family string`);
            }
          } else if (!HEX_COLOR_RE.test(value) && !CSS_KEYWORD_RE.test(value)) {
            invalid.push(`${key}: "${value}"`);
          }
        }
        expect(
          invalid,
          `Invalid color values:\n  ${invalid.join("\n  ")}`,
        ).toHaveLength(0);
      });
    });
  }
});
