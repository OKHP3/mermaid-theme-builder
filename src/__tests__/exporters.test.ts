import { describe, it, expect } from "vitest";
import {
  makeFilename,
  paletteToCssVariables,
  paletteToPortableJson,
  parsePortablePalette,
  parsePaletteBundle,
  palettesToBundleJson,
} from "@/lib/exporters";
import type { Palette } from "@/lib/palettes";
import { BUILTIN_PALETTES, REQUIRED_COLOR_KEYS, KNOWN_COLOR_KEYS } from "@/lib/palettes";
import type { ShareablePayload } from "@/lib/persistence";

const MINIMAL_PALETTE: Palette = {
  id: "test-palette",
  name: "Test Palette",
  description: "A minimal test palette.",
  version: "0.1.0",
  colors: [
    { key: "primaryColor", label: "Primary", value: "#111827" },
    { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
    { key: "lineColor", label: "Lines", value: "#6b7280" },
  ],
  attribution: {
    enabledByDefault: false,
    label: "Test",
    url: "https://example.com",
    themeName: "Test Palette",
    toolName: "Test",
    toolVersion: "0.1.0",
  },
};

// ── makeFilename ─────────────────────────────────────────────────────────────

describe("makeFilename", () => {
  it("returns a string", () => {
    expect(typeof makeFilename("Ocean Depth", "styled", "mmd")).toBe("string");
  });

  it("lowercases the theme name", () => {
    const result = makeFilename("Ocean Depth", "styled", "mmd");
    expect(result).toBe("ocean-depth-styled.mmd");
  });

  it("replaces spaces and special characters with hyphens", () => {
    const result = makeFilename("My Theme! V2", "export", "md");
    expect(result).toContain("my-theme");
    expect(result).toContain("v2");
    expect(result).not.toContain("!");
    expect(result).not.toContain(" ");
  });

  it("trims leading and trailing hyphens from the slug", () => {
    const result = makeFilename("  ---theme---  ", "test", "txt");
    expect(result).not.toMatch(/^-/);
    expect(result).not.toMatch(/---/);
  });

  it("falls back to 'diagram' when theme name collapses to empty", () => {
    const result = makeFilename("!@#$%^&", "export", "mmd");
    expect(result).toMatch(/^diagram-/);
  });

  it("includes the suffix in the filename", () => {
    const result = makeFilename("My Theme", "markdown-bootstrap", "md");
    expect(result).toContain("markdown-bootstrap");
  });

  it("includes the extension in the filename", () => {
    const result = makeFilename("My Theme", "styled", "mmd");
    expect(result.endsWith(".mmd")).toBe(true);
  });

  it("truncates very long theme names to at most 40 slug chars before suffix", () => {
    const longName = "A".repeat(100);
    const result = makeFilename(longName, "styled", "mmd");
    const slugPart = result.replace("-styled.mmd", "");
    expect(slugPart.length).toBeLessThanOrEqual(40);
  });

  it("works for all three canonical export suffixes", () => {
    expect(makeFilename("Ocean Depth", "styled", "mmd")).toBe("ocean-depth-styled.mmd");
    expect(makeFilename("Ocean Depth", "markdown-bootstrap", "md")).toBe(
      "ocean-depth-markdown-bootstrap.md"
    );
    expect(makeFilename("Ocean Depth", "prompt-scaffold", "md")).toBe(
      "ocean-depth-prompt-scaffold.md"
    );
  });
});

// ── paletteToCssVariables ────────────────────────────────────────────────────

describe("paletteToCssVariables", () => {
  it("returns a non-empty string", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains a :root { } block", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result).toContain(":root {");
    expect(result).toContain("}");
  });

  it("contains a --mermaid- CSS variable for each color", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result).toContain("--mermaid-primary-color");
    expect(result).toContain("--mermaid-primary-text-color");
    expect(result).toContain("--mermaid-line-color");
  });

  it("includes the hex value for each color", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result).toContain("#111827");
    expect(result).toContain("#ffffff");
    expect(result).toContain("#6b7280");
  });

  it("includes the palette name in a comment header", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result).toContain("Test Palette");
  });

  it("converts camelCase keys to kebab-case variable names", () => {
    const result = paletteToCssVariables(MINIMAL_PALETTE);
    expect(result).not.toContain("--mermaid-primaryColor");
    expect(result).toContain("--mermaid-primary-color");
  });

  it("produces valid output for all BUILTIN_PALETTES", () => {
    for (const palette of BUILTIN_PALETTES) {
      const result = paletteToCssVariables(palette);
      expect(result).toContain(":root {");
      expect(result.length).toBeGreaterThan(20);
    }
  });
});

// ── paletteToPortableJson ────────────────────────────────────────────────────

describe("paletteToPortableJson", () => {
  it("returns a valid JSON string", () => {
    const result = paletteToPortableJson(MINIMAL_PALETTE);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("includes type: mtb-palette discriminator", () => {
    const result = JSON.parse(paletteToPortableJson(MINIMAL_PALETTE));
    expect(result.type).toBe("mtb-palette");
  });

  it("includes schemaVersion: 1", () => {
    const result = JSON.parse(paletteToPortableJson(MINIMAL_PALETTE));
    expect(result.schemaVersion).toBe(1);
  });

  it("preserves palette id, name, description, and version", () => {
    const result = JSON.parse(paletteToPortableJson(MINIMAL_PALETTE));
    expect(result.id).toBe("test-palette");
    expect(result.name).toBe("Test Palette");
    expect(result.description).toBe("A minimal test palette.");
    expect(result.version).toBe("0.1.0");
  });

  it("includes all colors with key, label, and value", () => {
    const result = JSON.parse(paletteToPortableJson(MINIMAL_PALETTE));
    expect(Array.isArray(result.colors)).toBe(true);
    expect(result.colors).toHaveLength(3);
    expect(result.colors[0]).toMatchObject({
      key: "primaryColor",
      label: "Primary",
      value: "#111827",
    });
  });

  it("produces the same structure for all BUILTIN_PALETTES", () => {
    for (const palette of BUILTIN_PALETTES) {
      const result = JSON.parse(paletteToPortableJson(palette));
      expect(result.type).toBe("mtb-palette");
      expect(result.schemaVersion).toBe(1);
      expect(Array.isArray(result.colors)).toBe(true);
      expect(result.colors.length).toBeGreaterThan(0);
    }
  });
});

// ── parsePortablePalette ─────────────────────────────────────────────────────

describe("parsePortablePalette", () => {
  const validJson = paletteToPortableJson(MINIMAL_PALETTE);

  it("returns ok:true for a valid palette JSON string", () => {
    const result = parsePortablePalette(validJson);
    expect(result.ok).toBe(true);
  });

  it("reconstructed palette has the same id and name", () => {
    const result = parsePortablePalette(validJson);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.palette.id).toBe("test-palette");
    expect(result.palette.name).toBe("Test Palette");
  });

  it("reconstructed palette preserves all color entries", () => {
    const result = parsePortablePalette(validJson);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.palette.colors).toHaveLength(3);
  });

  it("returns ok:false for invalid JSON", () => {
    const result = parsePortablePalette("not json at all");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for a JSON object with wrong type field", () => {
    const bad = JSON.stringify({
      type: "wrong-type",
      colors: [{ key: "a", label: "A", value: "#fff" }],
    });
    const result = parsePortablePalette(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("type");
  });

  it("returns ok:false for missing colors array", () => {
    const bad = JSON.stringify({ type: "mtb-palette", colors: [] });
    const result = parsePortablePalette(bad);
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for a plain string (not an object)", () => {
    const result = parsePortablePalette(JSON.stringify("just a string"));
    expect(result.ok).toBe(false);
  });

  it("round-trips all BUILTIN_PALETTES without error", () => {
    for (const palette of BUILTIN_PALETTES) {
      const json = paletteToPortableJson(palette);
      const result = parsePortablePalette(json);
      expect(result.ok, `Round-trip failed for palette: ${palette.id}`).toBe(true);
      if (result.ok) {
        expect(result.palette.id).toBe(palette.id);
        expect(result.palette.colors).toHaveLength(palette.colors.length);
      }
    }
  });

  it("returns empty missingKeys and unknownKeys for a complete valid palette", () => {
    const fullPalette: Palette = {
      ...MINIMAL_PALETTE,
      colors: [
        { key: "primaryColor", label: "Primary", value: "#1a4f8a" },
        { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
        { key: "primaryBorderColor", label: "Primary border", value: "#0d3060" },
        { key: "lineColor", label: "Lines", value: "#2563eb" },
        { key: "secondaryColor", label: "Secondary", value: "#0ea5e9" },
        { key: "tertiaryColor", label: "Tertiary", value: "#e0f2fe" },
        { key: "background", label: "Background", value: "#f0f9ff" },
        { key: "mainBkg", label: "Main background", value: "#dbeafe" },
        { key: "nodeBorder", label: "Node border", value: "#1d4ed8" },
        { key: "clusterBkg", label: "Cluster background", value: "#e0f2fe" },
        { key: "titleColor", label: "Title color", value: "#1e3a5f" },
      ],
    };
    const result = parsePortablePalette(paletteToPortableJson(fullPalette));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.missingKeys).toHaveLength(0);
      expect(result.unknownKeys).toHaveLength(0);
    }
  });

  it("reports missing required keys when a palette is incomplete", () => {
    const json = paletteToPortableJson(MINIMAL_PALETTE);
    const result = parsePortablePalette(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.missingKeys).toContain("primaryBorderColor");
      expect(result.missingKeys).toContain("secondaryColor");
      expect(result.missingKeys).toContain("tertiaryColor");
      expect(result.missingKeys).not.toContain("primaryColor");
      expect(result.missingKeys).not.toContain("lineColor");
    }
  });

  it("reports unknown keys not in the recognized set", () => {
    const paletteWithUnknown: Palette = {
      ...MINIMAL_PALETTE,
      colors: [
        ...MINIMAL_PALETTE.colors,
        { key: "weirdCustomProp", label: "Custom", value: "#abcdef" },
        { key: "anotherUnknownKey", label: "Also custom", value: "#fedcba" },
      ],
    };
    const result = parsePortablePalette(paletteToPortableJson(paletteWithUnknown));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unknownKeys).toContain("weirdCustomProp");
      expect(result.unknownKeys).toContain("anotherUnknownKey");
      expect(result.unknownKeys).not.toContain("primaryColor");
    }
  });

  it("known optional keys (fontFamily, edgeLabelBackground) do not appear in unknownKeys", () => {
    const paletteWithOptionals: Palette = {
      ...MINIMAL_PALETTE,
      colors: [
        ...MINIMAL_PALETTE.colors,
        { key: "fontFamily", label: "Font family", value: "DM Sans, sans-serif" },
        { key: "edgeLabelBackground", label: "Edge label bg", value: "#ffffff" },
      ],
    };
    const result = parsePortablePalette(paletteToPortableJson(paletteWithOptionals));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unknownKeys).not.toContain("fontFamily");
      expect(result.unknownKeys).not.toContain("edgeLabelBackground");
    }
  });

  it("round-tripped BUILTIN_PALETTES have no missingKeys or unknownKeys", () => {
    for (const palette of BUILTIN_PALETTES) {
      const result = parsePortablePalette(paletteToPortableJson(palette));
      if (result.ok) {
        expect(
          result.missingKeys,
          `${palette.id} should have no missing required keys`
        ).toHaveLength(0);
        expect(result.unknownKeys, `${palette.id} should have no unknown keys`).toHaveLength(0);
      }
    }
  });
});

// ── palettesToBundleJson ─────────────────────────────────────────────────────

describe("palettesToBundleJson", () => {
  it("returns a valid JSON string", () => {
    const result = palettesToBundleJson([MINIMAL_PALETTE]);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("includes type: mtb-palette-bundle discriminator", () => {
    const result = JSON.parse(palettesToBundleJson([MINIMAL_PALETTE]));
    expect(result.type).toBe("mtb-palette-bundle");
  });

  it("includes schemaVersion: 1", () => {
    const result = JSON.parse(palettesToBundleJson([MINIMAL_PALETTE]));
    expect(result.schemaVersion).toBe(1);
  });

  it("count matches the number of palettes", () => {
    const result = JSON.parse(palettesToBundleJson(BUILTIN_PALETTES));
    expect(result.count).toBe(BUILTIN_PALETTES.length);
    expect(result.palettes).toHaveLength(BUILTIN_PALETTES.length);
  });

  it("each palette entry in the bundle has the mtb-palette type", () => {
    const result = JSON.parse(palettesToBundleJson(BUILTIN_PALETTES));
    for (const entry of result.palettes) {
      expect(entry.type).toBe("mtb-palette");
    }
  });

  it("handles an empty palette array without throwing", () => {
    const result = palettesToBundleJson([]);
    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(0);
    expect(parsed.palettes).toHaveLength(0);
  });
});

// ── parsePaletteBundle ────────────────────────────────────────────────────────

describe("parsePaletteBundle", () => {
  const FULL_PALETTE: Palette = {
    ...MINIMAL_PALETTE,
    id: "full-palette",
    name: "Full Palette",
    colors: [
      { key: "primaryColor", label: "Primary", value: "#1a4f8a" },
      { key: "primaryTextColor", label: "Primary text", value: "#ffffff" },
      { key: "primaryBorderColor", label: "Primary border", value: "#0d3060" },
      { key: "lineColor", label: "Lines", value: "#2563eb" },
      { key: "secondaryColor", label: "Secondary", value: "#0ea5e9" },
      { key: "tertiaryColor", label: "Tertiary", value: "#e0f2fe" },
      { key: "background", label: "Background", value: "#f0f9ff" },
      { key: "mainBkg", label: "Main background", value: "#dbeafe" },
      { key: "nodeBorder", label: "Node border", value: "#1d4ed8" },
      { key: "clusterBkg", label: "Cluster background", value: "#e0f2fe" },
      { key: "titleColor", label: "Title color", value: "#1e3a5f" },
    ],
  };

  it("returns ok:true for a valid bundle produced by palettesToBundleJson", () => {
    const json = palettesToBundleJson([FULL_PALETTE]);
    const result = parsePaletteBundle(json);
    expect(result.ok).toBe(true);
  });

  it("returns the correct number of palettes for a multi-palette bundle", () => {
    const json = palettesToBundleJson([
      FULL_PALETTE,
      { ...FULL_PALETTE, id: "pal-2", name: "Palette 2" },
    ]);
    const result = parsePaletteBundle(json);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.palettes).toHaveLength(2);
  });

  it("round-trips all BUILTIN_PALETTES through bundle format without error", () => {
    const json = palettesToBundleJson(BUILTIN_PALETTES);
    const result = parsePaletteBundle(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.palettes).toHaveLength(BUILTIN_PALETTES.length);
  });

  it("returns ok:false for invalid JSON", () => {
    const result = parsePaletteBundle("not json");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false for a JSON object with the wrong type field", () => {
    const bad = JSON.stringify({ type: "mtb-palette", palettes: [] });
    const result = parsePaletteBundle(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("mtb-palette-bundle");
  });

  it("returns ok:false when the palettes array is missing", () => {
    const bad = JSON.stringify({ type: "mtb-palette-bundle" });
    const result = parsePaletteBundle(bad);
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when a palette entry inside the bundle is invalid", () => {
    const bundle = {
      type: "mtb-palette-bundle",
      schemaVersion: 1,
      palettes: [
        {
          type: "mtb-palette",
          id: "ok",
          name: "OK",
          description: "d",
          version: "1",
          colors: [{ key: "primaryColor", label: "P", value: "#fff" }],
        },
        { type: "wrong-type", colors: [] },
      ],
    };
    const result = parsePaletteBundle(JSON.stringify(bundle));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("2");
  });

  it("each palette in the result carries its own missingKeys and unknownKeys", () => {
    const incompleteBundle = {
      type: "mtb-palette-bundle",
      schemaVersion: 1,
      palettes: [
        {
          type: "mtb-palette",
          id: "incomplete",
          name: "Incomplete",
          description: "Missing most required keys.",
          version: "1",
          colors: [
            { key: "primaryColor", label: "Primary", value: "#111" },
            { key: "weirdCustomProp", label: "Custom", value: "#abc" },
          ],
        },
      ],
    };
    const result = parsePaletteBundle(JSON.stringify(incompleteBundle));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    const imp = result.palettes[0];
    expect(imp.missingKeys).toContain("primaryBorderColor");
    expect(imp.missingKeys).toContain("lineColor");
    expect(imp.unknownKeys).toContain("weirdCustomProp");
  });

  it("BUILTIN_PALETTES round-tripped through bundle have no missingKeys or unknownKeys", () => {
    const json = palettesToBundleJson(BUILTIN_PALETTES);
    const result = parsePaletteBundle(json);
    if (!result.ok) throw new Error("Expected ok:true");
    for (const imp of result.palettes) {
      expect(imp.missingKeys).toHaveLength(0);
      expect(imp.unknownKeys).toHaveLength(0);
    }
  });
});

// ── share URL key validation (decodeShareableTheme → REQUIRED_COLOR_KEYS) ─────

describe("share URL validation against REQUIRED_COLOR_KEYS", () => {
  // We test the validation logic directly (the same logic App.tsx applies after
  // buildPaletteFromShare) rather than mounting the full App component.
  function validateSharePayloadKeys(payload: ShareablePayload) {
    const presentKeys = new Set(Object.keys(payload.themeVariables));
    const missingKeys = (REQUIRED_COLOR_KEYS as readonly string[]).filter(
      (k) => !presentKeys.has(k)
    );
    const unknownKeys = Object.keys(payload.themeVariables).filter((k) => !KNOWN_COLOR_KEYS.has(k));
    return { missingKeys, unknownKeys };
  }

  it("returns no warnings for a payload with all required keys", () => {
    const themeVariables: Record<string, string> = Object.fromEntries(
      (REQUIRED_COLOR_KEYS as readonly string[]).map((k) => [k, "#ffffff"])
    );
    const { missingKeys, unknownKeys } = validateSharePayloadKeys({ v: 1, themeVariables });
    expect(missingKeys).toHaveLength(0);
    expect(unknownKeys).toHaveLength(0);
  });

  it("reports missing keys when required keys are absent", () => {
    const { missingKeys } = validateSharePayloadKeys({
      v: 1,
      themeVariables: { primaryColor: "#111" },
    });
    expect(missingKeys).toContain("lineColor");
    expect(missingKeys).toContain("secondaryColor");
    expect(missingKeys).not.toContain("primaryColor");
  });

  it("reports unknown keys that are not in KNOWN_COLOR_KEYS", () => {
    const themeVariables: Record<string, string> = {
      ...Object.fromEntries((REQUIRED_COLOR_KEYS as readonly string[]).map((k) => [k, "#fff"])),
      weirdUnknownKey: "#abc",
    };
    const { unknownKeys } = validateSharePayloadKeys({ v: 1, themeVariables });
    expect(unknownKeys).toContain("weirdUnknownKey");
    expect(unknownKeys).not.toContain("primaryColor");
  });

  it("reports no warnings for an empty themeVariables object except missing keys", () => {
    const { missingKeys, unknownKeys } = validateSharePayloadKeys({ v: 1, themeVariables: {} });
    expect(missingKeys.length).toBeGreaterThan(0);
    expect(unknownKeys).toHaveLength(0);
  });
});

// ── parsePortablePalette — invalidValues ──────────────────────────────────────

describe("parsePortablePalette — invalidValues", () => {
  function makePaletteJson(overrideColors: Array<{ key: string; label: string; value: string }>) {
    return JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: overrideColors,
    });
  }

  it("returns empty invalidValues for a palette with all valid hex colors", () => {
    const result = parsePortablePalette(
      makePaletteJson([
        { key: "primaryColor", label: "Primary", value: "#1a2b3c" },
        { key: "lineColor", label: "Line", value: "#fff" },
      ])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("reports an entry for a non-hex, non-keyword, non-alpha value (e.g. numeric coercion)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "lineColor", label: "Line", value: "#xyz" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues).toHaveLength(1);
    expect(result.invalidValues[0].key).toBe("lineColor");
    expect(result.invalidValues[0].value).toBe("#xyz");
    expect(result.warnValues).toHaveLength(0);
  });

  it("routes an alpha-only non-keyword value to warnValues (looks like a CSS named color)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "notacolor" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.warnValues).toHaveLength(1);
    expect(result.warnValues[0].key).toBe("primaryColor");
    expect(result.warnValues[0].value).toBe("notacolor");
    expect(result.invalidValues).toHaveLength(0);
  });

  it("reports an entry for an empty string value", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "lineColor", label: "Line", value: "" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("lineColor");
  });

  it("accepts valid 3-digit hex (#fff)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "#fff" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("accepts valid 4-digit hex (#ffff)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "#abcd" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("accepts valid 8-digit hex (#aabbccdd)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "#1a2b3c4d" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("accepts CSS keyword 'transparent'", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "background", label: "BG", value: "transparent" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("accepts CSS keyword 'inherit' (case-insensitive)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "background", label: "BG", value: "Inherit" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("accepts CSS keyword 'currentColor'", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "lineColor", label: "Line", value: "currentColor" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("exempts fontFamily from hex validation — any non-empty string is valid", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "fontFamily", label: "Font", value: "DM Sans, Arial, sans-serif" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invalidValues).toHaveLength(0);
  });

  it("reports fontFamily as invalid when the value is an empty string", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "fontFamily", label: "Font", value: "" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("fontFamily");
  });

  it("reports multiple invalid entries when several values are bad", () => {
    const result = parsePortablePalette(
      makePaletteJson([
        { key: "primaryColor", label: "P", value: "red" },
        { key: "lineColor", label: "L", value: "" },
        { key: "background", label: "B", value: "#abc" },
      ])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    const badKeys = result.invalidValues.map((e) => e.key);
    expect(badKeys).not.toContain("primaryColor");
    expect(badKeys).toContain("lineColor");
    expect(badKeys).not.toContain("background");
    const warnKeys = result.warnValues.map((e) => e.key);
    expect(warnKeys).toContain("primaryColor");
  });

  it("BUILTIN_PALETTES round-tripped through parsePortablePalette have no invalidValues", () => {
    for (const palette of BUILTIN_PALETTES) {
      const result = parsePortablePalette(paletteToPortableJson(palette));
      expect(result.ok, `${palette.id} failed to parse`).toBe(true);
      if (result.ok) {
        expect(
          result.invalidValues,
          `${palette.id} has invalid color values: ${result.invalidValues.map((e) => `${e.key}=${e.value}`).join(", ")}`
        ).toHaveLength(0);
      }
    }
  });

  it("rejects a hex-like value with wrong digit count (e.g. #12)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "P", value: "#12" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("primaryColor");
  });

  it("rejects a hex-like value with wrong digit count (e.g. #12345)", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "P", value: "#12345" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("primaryColor");
  });

  it("reports a color entry with a numeric value in invalidValues rather than aborting", () => {
    const json = JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: [{ key: "primaryColor", label: "Primary", value: 16711680 }],
    });
    const result = parsePortablePalette(json);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("primaryColor");
  });

  it("reports a color entry with an object value in invalidValues rather than aborting", () => {
    const json = JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: [{ key: "lineColor", label: "Line", value: { r: 0, g: 0, b: 0 } }],
    });
    const result = parsePortablePalette(json);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("lineColor");
  });

  it("reports a color entry with a boolean value in invalidValues rather than aborting", () => {
    const json = JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: [{ key: "background", label: "BG", value: true }],
    });
    const result = parsePortablePalette(json);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.invalidValues.map((e) => e.key)).toContain("background");
  });

  it("still imports valid entries alongside an entry with a non-string value", () => {
    const json = JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: [
        { key: "primaryColor", label: "Primary", value: "#1a2b3c" },
        { key: "lineColor", label: "Line", value: 42 },
      ],
    });
    const result = parsePortablePalette(json);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.palette.colors).toHaveLength(2);
    expect(result.invalidValues).toHaveLength(1);
    expect(result.invalidValues[0].key).toBe("lineColor");
  });
});

// ── parsePortablePalette — warnValues ─────────────────────────────────────────

describe("parsePortablePalette — warnValues", () => {
  function makePaletteJson(overrideColors: Array<{ key: string; label: string; value: string }>) {
    return JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      id: "test",
      name: "Test",
      description: "d",
      version: "1.0.0",
      colors: overrideColors,
    });
  }

  it("returns empty warnValues for a palette with all valid hex colors", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "#1a2b3c" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnValues).toHaveLength(0);
  });

  it("places a CSS named color in warnValues, not invalidValues", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "primaryColor", label: "Primary", value: "red" }])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.warnValues).toHaveLength(1);
    expect(result.warnValues[0].key).toBe("primaryColor");
    expect(result.warnValues[0].value).toBe("red");
    expect(result.invalidValues).toHaveLength(0);
  });

  it("places multi-word-style named colors in warnValues (e.g. coral, steelblue, aliceblue)", () => {
    for (const named of ["coral", "steelblue", "aliceblue", "tomato", "goldenrod"]) {
      const result = parsePortablePalette(
        makePaletteJson([{ key: "lineColor", label: "Line", value: named }])
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Expected ok:true");
      expect(result.warnValues.map((e) => e.value)).toContain(named);
      expect(result.invalidValues.map((e) => e.value)).not.toContain(named);
    }
  });

  it("does not put CSS keywords (transparent, inherit, currentColor) in warnValues", () => {
    for (const kw of ["transparent", "inherit", "currentColor"]) {
      const result = parsePortablePalette(
        makePaletteJson([{ key: "background", label: "BG", value: kw }])
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("Expected ok:true");
      expect(result.warnValues).toHaveLength(0);
      expect(result.invalidValues).toHaveLength(0);
    }
  });

  it("does not warn fontFamily even when it is alpha-only", () => {
    const result = parsePortablePalette(
      makePaletteJson([{ key: "fontFamily", label: "Font", value: "Arial" }])
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnValues).toHaveLength(0);
      expect(result.invalidValues).toHaveLength(0);
    }
  });

  it("BUILTIN_PALETTES round-tripped through parsePortablePalette have no warnValues", () => {
    for (const palette of BUILTIN_PALETTES) {
      const result = parsePortablePalette(paletteToPortableJson(palette));
      expect(result.ok, `${palette.id} failed to parse`).toBe(true);
      if (result.ok) {
        expect(
          result.warnValues,
          `${palette.id} has named CSS color values: ${result.warnValues.map((e) => `${e.key}=${e.value}`).join(", ")}`
        ).toHaveLength(0);
      }
    }
  });

  it("separates named CSS color (warnValues) from truly invalid value (invalidValues) in same palette", () => {
    const result = parsePortablePalette(
      makePaletteJson([
        { key: "primaryColor", label: "P", value: "red" },
        { key: "lineColor", label: "L", value: "" },
        { key: "background", label: "B", value: "#abc" },
      ])
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok:true");
    expect(result.warnValues.map((e) => e.key)).toContain("primaryColor");
    expect(result.invalidValues.map((e) => e.key)).toContain("lineColor");
    expect(result.invalidValues.map((e) => e.key)).not.toContain("primaryColor");
    expect(result.warnValues.map((e) => e.key)).not.toContain("lineColor");
  });
});

// ── parsePortablePalette — top-level field type validation ────────────────────

describe("parsePortablePalette — top-level field type validation", () => {
  function makeBase(overrides: Record<string, unknown>) {
    return JSON.stringify({
      type: "mtb-palette",
      schemaVersion: 1,
      colors: [{ key: "primaryColor", label: "Primary", value: "#1a2b3c" }],
      ...overrides,
    });
  }

  it("returns ok:false when 'name' is a number", () => {
    const result = parsePortablePalette(makeBase({ name: 42 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("name");
      expect(result.error).toContain("string");
    }
  });

  it("returns ok:false when 'version' is an object", () => {
    const result = parsePortablePalette(makeBase({ version: { major: 1 } }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("version");
      expect(result.error).toContain("string");
    }
  });

  it("returns ok:false when 'id' is an array", () => {
    const result = parsePortablePalette(makeBase({ id: ["a", "b"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("id");
      expect(result.error).toContain("string");
    }
  });

  it("returns ok:false when 'description' is a boolean", () => {
    const result = parsePortablePalette(makeBase({ description: true }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("description");
      expect(result.error).toContain("string");
    }
  });

  it("returns ok:true when 'name' is absent — falls back to default", () => {
    const result = parsePortablePalette(makeBase({}));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.palette.name).toBe("Imported palette");
  });

  it("returns ok:true when 'version' is absent — falls back to default", () => {
    const result = parsePortablePalette(makeBase({}));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.palette.version).toBe("0.0.0");
  });

  it("returns ok:true when 'id' is absent — generates a fallback id", () => {
    const result = parsePortablePalette(makeBase({}));
    expect(result.ok).toBe(true);
    if (result.ok) expect(typeof result.palette.id).toBe("string");
  });

  it("returns ok:false when 'name' is null (present but wrong type)", () => {
    const result = parsePortablePalette(makeBase({ name: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("name");
  });

  it("error message names the field and the actual type received", () => {
    const result = parsePortablePalette(makeBase({ version: 99 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/version/);
      expect(result.error).toMatch(/number/);
    }
  });
});
