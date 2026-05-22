import { describe, it, expect } from "vitest";
import {
  makeFilename,
  paletteToCssVariables,
  paletteToPortableJson,
  parsePortablePalette,
  palettesToBundleJson,
} from "@/lib/exporters";
import type { Palette } from "@/lib/palettes";
import { BUILTIN_PALETTES } from "@/lib/palettes";

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
    expect(makeFilename("Ocean Depth", "markdown-bootstrap", "md")).toBe("ocean-depth-markdown-bootstrap.md");
    expect(makeFilename("Ocean Depth", "prompt-scaffold", "md")).toBe("ocean-depth-prompt-scaffold.md");
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
    expect(result.colors[0]).toMatchObject({ key: "primaryColor", label: "Primary", value: "#111827" });
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
    const bad = JSON.stringify({ type: "wrong-type", colors: [{ key: "a", label: "A", value: "#fff" }] });
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
