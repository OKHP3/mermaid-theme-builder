// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { buildPaletteFromShare } from "@/App";
import {
  paletteToPortableJson,
  palettesToBundleJson,
  parsePaletteBundle,
  parsePortablePalette,
} from "@/lib/exporters";
import { BUILTIN_PALETTES, PALETTE_TOOL_VERSION, REQUIRED_COLOR_KEYS } from "@/lib/palettes";
import { extractTheme, paletteFromExtracted } from "@/lib/extractor";
import type { ShareablePayload } from "@/lib/persistence";

describe("palette tool version propagation", () => {
  it("embeds the shared version when exporting and re-reading a .theme.json palette", () => {
    const result = parsePortablePalette(paletteToPortableJson(BUILTIN_PALETTES[0]));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palette.attribution.toolVersion).toBe(PALETTE_TOOL_VERSION);
  });

  it("embeds the shared version in every palette restored from a multi-palette bundle", () => {
    const result = parsePaletteBundle(
      palettesToBundleJson([BUILTIN_PALETTES[0], BUILTIN_PALETTES[1]])
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palettes).toHaveLength(2);
    for (const imported of result.palettes) {
      expect(imported.palette.attribution.toolVersion).toBe(PALETTE_TOOL_VERSION);
    }
  });

  it("embeds the shared version in palettes created from extracted Mermaid code", () => {
    const extracted = extractTheme(
      `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#112233"}}}%%
flowchart TD
  A --> B`
    );
    const palette = paletteFromExtracted(extracted, "Extracted test theme");

    expect(palette.attribution.toolVersion).toBe(PALETTE_TOOL_VERSION);
  });

  it("embeds the shared version in palettes created from a share link", () => {
    const themeVariables = Object.fromEntries(REQUIRED_COLOR_KEYS.map((key) => [key, "#ffffff"]));
    const payload: ShareablePayload = { v: 1, themeVariables };

    expect(buildPaletteFromShare(payload).attribution.toolVersion).toBe(PALETTE_TOOL_VERSION);
  });
});
