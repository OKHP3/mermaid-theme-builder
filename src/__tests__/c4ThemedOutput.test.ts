/**
 * Integration tests: C4 themed output guard.
 *
 * Purpose
 * -------
 * The registry consistency tests (registryExamples.test.ts) confirm that C4
 * catalog entries have valid ids, labels, content, and family aliases. They do
 * NOT confirm that applying a palette to these diagrams actually produces
 * themed output. A regression in familyTheming.ts or themeEngine.ts could
 * silently break C4 themed output without touching any catalog metadata.
 *
 * These tests verify, for every C4 catalog entry (Container, Dynamic,
 * Component), that:
 *   1. The %%{init:...}%% directive is always injected.
 *   2. The C4-family themeVariable keys (personBkg, personBorder, mainBkg,
 *      nodeBorder, lineColor) appear in the output.
 *   3. The palette's own color values appear in the output.
 *   4. The original C4 keyword is preserved in the diagram body.
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { EXAMPLE_CATALOG } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * C4-specific themeVariable keys emitted by familyTheming.ts for "c4Diagram".
 * If any of these disappear from the output, a regression has occurred.
 */
const C4_THEME_KEYS = ["personBkg", "personBorder", "mainBkg", "nodeBorder", "lineColor"] as const;

/** Catalog entries under test — one per C4 level that exists in the library. */
const C4_FIXTURES = [
  { id: "c4-container-learning-platform", keyword: "C4Container" },
  { id: "c4-dynamic-user-login", keyword: "C4Dynamic" },
  { id: "c4-component-api-server", keyword: "C4Component" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCatalogContent(id: string): string {
  const entry = EXAMPLE_CATALOG.find((e) => e.id === id);
  if (!entry) throw new Error(`Catalog entry not found: ${id}`);
  return entry.content;
}

function c4Options(palette: (typeof BRAND_PALETTES)[number]): ExportOptions {
  return {
    palette,
    diagramFamily: "c4Diagram",
    includeMetaComments: false,
    includeBadge: false,
  };
}

// ---------------------------------------------------------------------------
// 1. %%{init} block is always injected
// ---------------------------------------------------------------------------

describe("C4 themed output — %%{init} block is injected for every palette", () => {
  for (const fixture of C4_FIXTURES) {
    describe(fixture.keyword, () => {
      const content = getCatalogContent(fixture.id);

      it("first BRAND_PALETTE produces output with %%{init block", () => {
        const output = generateThemedCode(content, c4Options(BRAND_PALETTES[0]));
        expect(output).toContain("%%{init:");
      });

      it("every BRAND_PALETTE produces output with %%{init block", () => {
        for (const palette of BRAND_PALETTES) {
          const output = generateThemedCode(content, c4Options(palette));
          expect(
            output,
            `Palette "${palette.name}" did not inject %%{init for ${fixture.id}`
          ).toContain("%%{init:");
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 2. C4-family themeVariable keys appear in the init block
// ---------------------------------------------------------------------------

describe("C4 themed output — C4-family themeVariable keys appear in output", () => {
  for (const fixture of C4_FIXTURES) {
    describe(fixture.keyword, () => {
      const output = generateThemedCode(
        getCatalogContent(fixture.id),
        c4Options(BRAND_PALETTES[0])
      );

      for (const key of C4_THEME_KEYS) {
        it(`output contains "${key}"`, () => {
          expect(output).toContain(key);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Palette colors appear in generated output
// ---------------------------------------------------------------------------

describe("C4 themed output — palette colors appear in output", () => {
  for (const fixture of C4_FIXTURES) {
    describe(fixture.keyword, () => {
      const content = getCatalogContent(fixture.id);
      const palette = BRAND_PALETTES[0];
      const output = generateThemedCode(content, c4Options(palette));

      it("primaryColor appears in output", () => {
        const primaryColor = palette.colors.find((c) => c.key === "primaryColor")?.value ?? "";
        expect(output).toContain(primaryColor);
      });

      it("lineColor appears in output", () => {
        const lineColor = palette.colors.find((c) => c.key === "lineColor")?.value ?? "";
        expect(output).toContain(lineColor);
      });

      it("mainBkg color appears in output", () => {
        const mainBkg = palette.colors.find((c) => c.key === "mainBkg")?.value ?? "";
        expect(output).toContain(mainBkg);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Original C4 diagram body is preserved unchanged
// ---------------------------------------------------------------------------

describe("C4 themed output — original diagram body is preserved", () => {
  for (const fixture of C4_FIXTURES) {
    it(`${fixture.id}: ${fixture.keyword} keyword survives in output`, () => {
      const content = getCatalogContent(fixture.id);
      const output = generateThemedCode(content, c4Options(BRAND_PALETTES[0]));
      expect(output).toContain(fixture.keyword);
    });
  }
});
