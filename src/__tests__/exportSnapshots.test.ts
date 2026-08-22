/**
 * Snapshot tests: markdown and prompt-scaffold export formats for every BRAND_PALETTE.
 *
 * Purpose
 * -------
 * `generateMarkdownExport` and `generatePromptScaffoldWithFormat` produce multi-line
 * text artifacts that users copy-paste into docs and AI tools. Any change to heading
 * levels, badge placement, palette-metadata sections, or scaffold block structure will
 * show up immediately as a snapshot diff, making format regressions impossible to miss.
 *
 * Date pinning
 * ------------
 * `generateMarkdownExport` embeds a **Generated:** date (YYYY-MM-DD). The system clock
 * is frozen to 2025-01-15 via vi.useFakeTimers() so snapshots are stable across runs.
 *
 * On first run (or after an intentional format change) update with:
 *   pnpm vitest run --update-snapshots src/__tests__/exportSnapshots.test.ts
 *
 * Snapshots are stored in src/__tests__/__snapshots__/
 */

import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  generateThemedCode,
  type ExportOptions,
  type ScaffoldFormat,
} from "@/lib/theme-engine";
import { BRAND_PALETTES, BUILTIN_PALETTES } from "@/lib/palettes";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

/** Minimal flowchart — same fixture used in paletteOutputSnapshot.test.ts. */
const SIMPLE_DIAGRAM =
  "flowchart TD\n  A[User Request] --> B[Validate Input]\n  B --> C[Return Response]";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseOptions(palette: (typeof BRAND_PALETTES)[number]): ExportOptions {
  return {
    palette,
    diagramFamily: "flowchart",
    includeMetaComments: false,
    includeBadge: false,
  };
}

// ---------------------------------------------------------------------------
// Date pinning — freeze the clock so the **Generated:** line is stable
// ---------------------------------------------------------------------------

beforeAll(() => {
  // 2025-01-15T00:00:00.000Z → generates "2025-01-15" in the markdown export
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T00:00:00.000Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. Markdown export snapshots — one per BRAND_PALETTE
// ---------------------------------------------------------------------------

describe("generateMarkdownExport snapshots — BRAND_PALETTES × SIMPLE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) markdown export matches snapshot`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Prompt-scaffold snapshots — BRAND_PALETTES × three ScaffoldFormat values
// ---------------------------------------------------------------------------

const SCAFFOLD_FORMATS: ScaffoldFormat[] = ["formatA", "formatB", "both"];

describe("generatePromptScaffoldWithFormat snapshots — BRAND_PALETTES × ScaffoldFormat", () => {
  for (const palette of BRAND_PALETTES) {
    for (const format of SCAFFOLD_FORMATS) {
      it(`palette "${palette.name}" format "${format}" scaffold matches snapshot`, () => {
        const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), format);
        expect(output).toMatchSnapshot();
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Markdown structural invariants — key sections must be present
// ---------------------------------------------------------------------------

describe("generateMarkdownExport structural invariants", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" markdown contains the theme heading`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("# Mermaid Diagram —");
      expect(output).toContain("Theme");
    });

    it(`palette "${palette.name}" markdown contains the Usage section`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("## Usage");
    });

    it(`palette "${palette.name}" markdown contains the Attribution section`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("## Attribution");
    });

    it(`palette "${palette.name}" markdown contains the pinned Generated date`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("**Generated:** 2025-01-15");
    });

    it(`palette "${palette.name}" markdown embeds the themed code block`, () => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("```mermaid\n");
      expect(output).toContain(themedCode);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Scaffold structural invariants — key blocks must be present per format
// ---------------------------------------------------------------------------

describe("generatePromptScaffoldWithFormat structural invariants", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" format "formatA" contains PART 1`, () => {
      const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), "formatA");
      expect(output).toContain("PART 1");
    });

    it(`palette "${palette.name}" format "formatB" contains PART 1`, () => {
      const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), "formatB");
      expect(output).toContain("PART 1");
    });

    it(`palette "${palette.name}" format "both" contains PART 1, PART 2, and PART 3`, () => {
      const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), "both");
      expect(output).toContain("PART 1");
      expect(output).toContain("PART 2");
      expect(output).toContain("PART 3");
    });

    it(`palette "${palette.name}" format "both" contains the palette name`, () => {
      const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), "both");
      expect(output).toContain(palette.name);
    });

    it(`palette "${palette.name}" format "both" contains the palette's primaryColor value`, () => {
      const primaryColor = palette.colors.find((c) => c.key === "primaryColor")?.value ?? "";
      const output = generatePromptScaffoldWithFormat(palette, baseOptions(palette), "both");
      if (primaryColor) {
        expect(output).toContain(primaryColor);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Cross-palette uniqueness — markdown outputs are palette-specific
// ---------------------------------------------------------------------------

describe("generateMarkdownExport cross-palette uniqueness", () => {
  it("each palette produces a distinct markdown export", () => {
    const outputs = BRAND_PALETTES.map((palette) => {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      return generateMarkdownExport(themedCode, palette, opts);
    });
    const unique = new Set(outputs);
    expect(unique.size).toBe(BRAND_PALETTES.length);
  });
});

// ---------------------------------------------------------------------------
// 5b. Source URL presence / absence in markdown export
// ---------------------------------------------------------------------------

describe("generateMarkdownExport source URL section", () => {
  it("includes '**Brand sources:**' and all source URLs when palette has sourceUrls", () => {
    // overkill-hill is a brand preset with two source URLs
    const palette = BRAND_PALETTES.find((p) => p.id === "overkill-hill")!;
    expect(palette.sourceUrls?.length).toBeGreaterThan(0);

    const opts = baseOptions(palette);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, palette, opts);

    expect(output).toContain("**Brand sources:**");
    for (const url of palette.sourceUrls!) {
      expect(output).toContain(url);
    }
  });

  it("includes all source URLs for every brand palette that declares them", () => {
    for (const palette of BRAND_PALETTES.filter((p) => p.sourceUrls?.length)) {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);

      expect(output).toContain("**Brand sources:**");
      for (const url of palette.sourceUrls!) {
        expect(output).toContain(url);
      }
    }
  });

  it("does NOT include '**Brand sources:**' when palette has no sourceUrls", () => {
    const palettesWithoutUrls = BUILTIN_PALETTES.filter(
      (p) => !p.sourceUrls || p.sourceUrls.length === 0
    );
    expect(palettesWithoutUrls.length).toBeGreaterThan(0);

    for (const palette of palettesWithoutUrls) {
      const opts = baseOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).not.toContain("**Brand sources:**");
    }
  });

  it("does NOT include '**Brand sources:**' for a synthetic palette with sourceUrls: undefined", () => {
    const base = BRAND_PALETTES[0];
    const paletteNoUrls = { ...base, sourceUrls: undefined };

    const opts = baseOptions(paletteNoUrls);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteNoUrls, opts);

    expect(output).not.toContain("**Brand sources:**");
  });

  it("does NOT include '**Brand sources:**' for a synthetic palette with sourceUrls: []", () => {
    const base = BRAND_PALETTES[0];
    const paletteEmptyUrls = { ...base, sourceUrls: [] };

    const opts = baseOptions(paletteEmptyUrls);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteEmptyUrls, opts);

    expect(output).not.toContain("**Brand sources:**");
  });

  it("omits invalid (non-http/https) URLs from the source section, keeping valid ones", () => {
    const base = BRAND_PALETTES[0];
    const paletteWithBadUrl = {
      ...base,
      sourceUrls: ["javascript:alert(1)", "https://overkillhill.com"],
    };

    const opts = baseOptions(paletteWithBadUrl);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteWithBadUrl, opts);

    expect(output).toContain("**Brand sources:**");
    expect(output).toContain("https://overkillhill.com");
    expect(output).not.toContain("javascript:");
  });

  it("does NOT include '**Brand sources:**' when all sourceUrls are invalid schemes", () => {
    const base = BRAND_PALETTES[0];
    const paletteAllBadUrls = {
      ...base,
      sourceUrls: ["javascript:alert(1)", "data:text/html,<h1>hi</h1>"],
    };

    const opts = baseOptions(paletteAllBadUrls);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteAllBadUrls, opts);

    expect(output).not.toContain("**Brand sources:**");
    expect(output).not.toContain("javascript:");
  });

  it("does NOT include '**Brand sources:**' when all sourceUrls are unparseable strings", () => {
    const base = BRAND_PALETTES[0];
    const paletteUnparseable = {
      ...base,
      sourceUrls: ["not a url", "also not a url", "   "],
    };

    const opts = baseOptions(paletteUnparseable);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteUnparseable, opts);

    expect(output).not.toContain("**Brand sources:**");
  });

  it("does NOT include '**Brand sources:**' for ftp:// (non-http/https scheme)", () => {
    const base = BRAND_PALETTES[0];
    const paletteFtp = {
      ...base,
      sourceUrls: ["ftp://old.example.com/theme.css"],
    };

    const opts = baseOptions(paletteFtp);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteFtp, opts);

    expect(output).not.toContain("**Brand sources:**");
    expect(output).not.toContain("ftp://");
  });

  it("leaves no stray angle brackets when all sourceUrls are malformed", () => {
    const base = BRAND_PALETTES[0];
    const paletteMalformed = {
      ...base,
      sourceUrls: ["not a url", "ftp://old.example.com", "javascript:void(0)"],
    };

    const opts = baseOptions(paletteMalformed);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteMalformed, opts);

    // No stray <url> angle bracket pairs from a partially-rendered source section.
    // The Brand sources line should be absent entirely, so no leftover '<' or '>'
    // that belong to it can appear on the Tool: line or elsewhere.
    expect(output).not.toContain("**Brand sources:**");
    // The only angle brackets allowed are those inside the known static links
    // (mermaid.live, overkillhill.com) — not from sourceUrls.
    const brandSourcesIndex = output.indexOf("**Brand sources:**");
    expect(brandSourcesIndex).toBe(-1);
  });

  it("markdown is structurally intact (heading, Usage, Attribution) when all sourceUrls are malformed", () => {
    const base = BRAND_PALETTES[0];
    const paletteMalformed = {
      ...base,
      sourceUrls: ["not a url", "ftp://old.example.com"],
    };

    const opts = baseOptions(paletteMalformed);
    const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
    const output = generateMarkdownExport(themedCode, paletteMalformed, opts);

    // All structural sections must still be present — malformed URLs must not
    // corrupt or truncate the surrounding markdown.
    expect(output).toContain("# Mermaid Diagram —");
    expect(output).toContain("## Usage");
    expect(output).toContain("## Attribution");
    expect(output).toContain("**Generated:** 2025-01-15");
    expect(output).toContain("```mermaid\n");
  });
});

// ---------------------------------------------------------------------------
// 6. Cross-palette uniqueness — scaffold "both" outputs are palette-specific
// ---------------------------------------------------------------------------

describe("generatePromptScaffoldWithFormat cross-palette uniqueness", () => {
  it('each palette produces a distinct scaffold for format "both"', () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generatePromptScaffoldWithFormat(palette, baseOptions(palette), "both")
    );
    const unique = new Set(outputs);
    expect(unique.size).toBe(BRAND_PALETTES.length);
  });
});

// ---------------------------------------------------------------------------
// 7. customThemeName snapshots — all BRAND_PALETTES × customThemeName: "My Brand"
// ---------------------------------------------------------------------------

/** Options with a custom theme name applied to the given palette. */
function customNameOptions(palette: (typeof BRAND_PALETTES)[number]): ExportOptions {
  return {
    ...baseOptions(palette),
    customThemeName: "My Brand",
  };
}

describe("generateMarkdownExport snapshots — customThemeName path", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) with customThemeName "My Brand" matches snapshot`, () => {
      const opts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generatePromptScaffoldWithFormat snapshots — customThemeName path", () => {
  for (const palette of BRAND_PALETTES) {
    for (const format of SCAFFOLD_FORMATS) {
      it(`palette "${palette.name}" format "${format}" with customThemeName "My Brand" matches snapshot`, () => {
        const opts = customNameOptions(palette);
        const output = generatePromptScaffoldWithFormat(palette, opts, format);
        expect(output).toMatchSnapshot();
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 7b. Cross-palette uniqueness — customThemeName must not erase palette data
// ---------------------------------------------------------------------------

describe("customThemeName cross-palette uniqueness", () => {
  it("each palette produces a distinct markdown export with customThemeName", () => {
    const outputs = BRAND_PALETTES.map((palette) => {
      const opts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      return generateMarkdownExport(themedCode, palette, opts);
    });
    const unique = new Set(outputs);
    expect(unique.size).toBe(BRAND_PALETTES.length);
  });

  it('each palette produces a distinct scaffold for format "both" with customThemeName', () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generatePromptScaffoldWithFormat(palette, customNameOptions(palette), "both")
    );
    const unique = new Set(outputs);
    expect(unique.size).toBe(BRAND_PALETTES.length);
  });
});

// ---------------------------------------------------------------------------
// 8. customThemeName structural invariants — "Custom — based on" must appear
// ---------------------------------------------------------------------------

describe("generateMarkdownExport structural invariants — customThemeName", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" markdown contains "Custom — based on" label`, () => {
      const opts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("Custom — based on");
      expect(output).toContain(palette.name);
    });

    it(`palette "${palette.name}" markdown H1 contains the custom theme name "My Brand"`, () => {
      const opts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("# Mermaid Diagram — My Brand Theme");
    });

    it(`palette "${palette.name}" markdown Theme: line contains "Custom — based on"`, () => {
      const opts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      const themeLine = output.split("\n").find((l) => l.startsWith("**Theme:**"));
      expect(themeLine).toContain("Custom — based on");
      expect(themeLine).toContain(palette.name);
    });

    it(`palette "${palette.name}" markdown output differs from non-custom output`, () => {
      const standardOpts = baseOptions(palette);
      const customOpts = customNameOptions(palette);
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, standardOpts);
      const standardOutput = generateMarkdownExport(themedCode, palette, standardOpts);
      const customOutput = generateMarkdownExport(themedCode, palette, customOpts);
      expect(customOutput).not.toBe(standardOutput);
    });
  }
});

describe("generatePromptScaffoldWithFormat structural invariants — customThemeName", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" format "both" scaffold contains "Custom — based on"`, () => {
      const opts = customNameOptions(palette);
      const output = generatePromptScaffoldWithFormat(palette, opts, "both");
      expect(output).toContain("Custom — based on");
      expect(output).toContain(palette.name);
    });

    it(`palette "${palette.name}" format "both" scaffold output differs from non-custom output`, () => {
      const standardOpts = baseOptions(palette);
      const customOpts = customNameOptions(palette);
      const standardOutput = generatePromptScaffoldWithFormat(palette, standardOpts, "both");
      const customOutput = generatePromptScaffoldWithFormat(palette, customOpts, "both");
      expect(customOutput).not.toBe(standardOutput);
    });
  }
});

// ---------------------------------------------------------------------------
// 9. customThemeName === palette.name boundary — "Custom — based on" must
//    still appear even when the user's custom name is identical to the
//    palette name (any non-empty customThemeName is always treated as custom)
// ---------------------------------------------------------------------------

describe("generateMarkdownExport — customThemeName equal to palette.name is still treated as custom", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" shows "Custom — based on" when customThemeName equals the palette name`, () => {
      const opts: ExportOptions = { ...baseOptions(palette), customThemeName: palette.name };
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      expect(output).toContain("Custom — based on");
      expect(output).toContain(palette.name);
    });

    it(`palette "${palette.name}" markdown Theme: line contains "Custom — based on" when customThemeName equals the palette name`, () => {
      const opts: ExportOptions = { ...baseOptions(palette), customThemeName: palette.name };
      const themedCode = generateThemedCode(SIMPLE_DIAGRAM, opts);
      const output = generateMarkdownExport(themedCode, palette, opts);
      const themeLine = output.split("\n").find((l) => l.startsWith("**Theme:**"));
      expect(themeLine).toContain("Custom — based on");
    });
  }
});

describe("generatePromptScaffoldWithFormat — customThemeName equal to palette.name is still treated as custom", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" format "both" shows "Custom — based on" when customThemeName equals the palette name`, () => {
      const opts: ExportOptions = { ...baseOptions(palette), customThemeName: palette.name };
      const output = generatePromptScaffoldWithFormat(palette, opts, "both");
      expect(output).toContain("Custom — based on");
      expect(output).toContain(palette.name);
    });
  }
});
