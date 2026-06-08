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
 * Required fixtures (task #292):
 *   c4-container-learning-platform  (C4Container)
 *   c4-dynamic-user-login           (C4Dynamic)
 *
 * Additional fixture (added in task #291):
 *   c4-component-api-server         (C4Component)
 *
 * For all three fixtures these tests verify that:
 *   1. The %%{init:...}%% directive is injected for every BRAND_PALETTE.
 *   2. All C4-family themeVariable keys (personBkg, personBorder, mainBkg,
 *      nodeBorder, lineColor) appear in the output for every BRAND_PALETTE.
 *   3. The palette's own color values appear in the output.
 *   4. The original C4 keyword is preserved in the diagram body.
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { EXAMPLE_CATALOG } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * C4-specific themeVariable keys emitted by familyTheming.ts for "c4Diagram".
 * If any key is dropped or renamed, the corresponding test will fail.
 */
const C4_THEME_KEYS = ["personBkg", "personBorder", "mainBkg", "nodeBorder", "lineColor"] as const;

/**
 * Primary fixtures are the task #292 targets.
 * Component is extra coverage introduced alongside the new catalog entry.
 */
const C4_FIXTURES = [
  { id: "c4-container-learning-platform", keyword: "C4Container", primary: true },
  { id: "c4-dynamic-user-login", keyword: "C4Dynamic", primary: true },
  { id: "c4-component-api-server", keyword: "C4Component", primary: false },
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
// 1. %%{init} block is injected for every palette
// ---------------------------------------------------------------------------

describe("C4 themed output — %%{init} block is injected for every palette", () => {
  for (const fixture of C4_FIXTURES) {
    const label = fixture.primary ? fixture.keyword : `${fixture.keyword} (extra coverage)`;
    describe(label, () => {
      const content = getCatalogContent(fixture.id);

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
// 2. C4-family themeVariable keys appear in output for every palette
// ---------------------------------------------------------------------------

describe("C4 themed output — C4-family themeVariable keys appear for every palette", () => {
  for (const fixture of C4_FIXTURES) {
    const label = fixture.primary ? fixture.keyword : `${fixture.keyword} (extra coverage)`;
    describe(label, () => {
      const content = getCatalogContent(fixture.id);

      for (const key of C4_THEME_KEYS) {
        it(`"${key}" appears for every BRAND_PALETTE`, () => {
          for (const palette of BRAND_PALETTES) {
            const output = generateThemedCode(content, c4Options(palette));
            expect(
              output,
              `Palette "${palette.name}" output is missing key "${key}" for ${fixture.id}`
            ).toContain(key);
          }
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

      it("every palette's primaryColor appears in its own output", () => {
        for (const palette of BRAND_PALETTES) {
          const output = generateThemedCode(content, c4Options(palette));
          const primaryColor = palette.colors.find((c) => c.key === "primaryColor")?.value ?? "";
          expect(
            output,
            `Palette "${palette.name}" primaryColor missing from ${fixture.id} output`
          ).toContain(primaryColor);
        }
      });

      it("every palette's lineColor appears in its own output", () => {
        for (const palette of BRAND_PALETTES) {
          const output = generateThemedCode(content, c4Options(palette));
          const lineColor = palette.colors.find((c) => c.key === "lineColor")?.value ?? "";
          expect(
            output,
            `Palette "${palette.name}" lineColor missing from ${fixture.id} output`
          ).toContain(lineColor);
        }
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
