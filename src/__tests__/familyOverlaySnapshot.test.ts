/**
 * Snapshot tests: exact themed output for gantt, pie, and stateDiagram families
 * across all BRAND_PALETTES.
 *
 * Purpose
 * -------
 * src/lib/family-theming.ts contains distinct overlay key mappings for each
 * diagram family. The existing paletteOutputSnapshot tests cover flowchart,
 * sequenceDiagram, and erDiagram; c4OutputSnapshot.test.ts covers c4Diagram.
 * This file closes the gap for the three remaining non-trivial families:
 *
 *   gantt      — sectionBkgColor, taskBkgColor, activeTaskBkgColor, gridColor, …
 *   pie        — pie1–pie5, pieTitleTextColor, pieSectionTextColor, …
 *   stateDiagram — stateBkg, stateLabelColor, transitionColor, compositeBackground, …
 *
 * Sections
 * --------
 *   1. Snapshot per palette × fixture — pins the full %%{init} block
 *   2. Cross-palette uniqueness — no two palettes produce identical output
 *   3. Structural invariants — each family overlay key resolves the right palette color
 *   4. Diagram body integrity — diagram keyword survives in the output
 *
 * To update snapshots after an intentional palette / overlay change:
 *   pnpm vitest run -u src/__tests__/familyOverlaySnapshot.test.ts
 *
 * Snapshots are stored in src/__tests__/__snapshots__/familyOverlaySnapshot.test.ts.snap
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { EXAMPLE_CATALOG } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAMILY_FIXTURES = [
  { id: "gantt-basic", family: "gantt" as const, keyword: "gantt" },
  { id: "pie-effort-allocation", family: "pie" as const, keyword: "pie" },
  { id: "state-theme-lifecycle", family: "stateDiagram" as const, keyword: "stateDiagram-v2" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCatalogContent(id: string): string {
  const entry = EXAMPLE_CATALOG.find((e) => e.id === id);
  if (!entry) throw new Error(`Catalog entry not found: ${id}`);
  return entry.content;
}

function familyOptions(
  palette: (typeof BRAND_PALETTES)[number],
  family: (typeof FAMILY_FIXTURES)[number]["family"]
): ExportOptions {
  return {
    palette,
    diagramFamily: family,
    includeMetaComments: false,
    includeBadge: false,
  };
}

/** Pull the resolved value of a color key from a palette, falling back to "". */
function paletteColor(palette: (typeof BRAND_PALETTES)[number], key: string): string {
  return palette.colors.find((c) => c.key === key)?.value ?? "";
}

// ---------------------------------------------------------------------------
// 1. Snapshot per palette × fixture
//    Catches: wrong color values, key renames, JSON format changes
// ---------------------------------------------------------------------------

for (const fixture of FAMILY_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`${fixture.family} snapshot — ${fixture.id}`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`palette "${palette.name}" (id: ${palette.id}) matches snapshot`, () => {
        const output = generateThemedCode(content, familyOptions(palette, fixture.family));
        expect(output).toMatchSnapshot();
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 2. Cross-palette uniqueness — no two palettes produce identical output
//    Catches: palette-selection logic returning the same result for all inputs
// ---------------------------------------------------------------------------

for (const fixture of FAMILY_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`${fixture.family} uniqueness — ${fixture.id} outputs are distinct per palette`, () => {
    it("all BRAND_PALETTE outputs are unique", () => {
      const outputs = BRAND_PALETTES.map((p) =>
        generateThemedCode(content, familyOptions(p, fixture.family))
      );
      for (let i = 0; i < outputs.length; i++) {
        for (let j = i + 1; j < outputs.length; j++) {
          expect(
            outputs[i],
            `${fixture.id}: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
          ).not.toBe(outputs[j]);
        }
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 3. Structural invariants — overlay keys resolve the correct palette colors
//    Mirrors the mappings in src/lib/family-theming.ts for each family.
//
//    gantt:
//      sectionBkgColor       → mainBkg
//      taskBkgColor          → primaryColor
//      activeTaskBkgColor    → secondaryColor
//      activeTaskBorderColor → primaryBorderColor
//      gridColor             → lineColor
//      critBkgColor          → "#dc2626"  (hardcoded)
//
//    pie:
//      pie1                  → primaryColor
//      pie2                  → secondaryColor
//      pie3                  → tertiaryColor
//      pieTitleTextColor     → titleColor
//      pieSectionTextColor   → primaryTextColor
//
//    stateDiagram:
//      stateBkg              → primaryColor
//      stateLabelColor       → titleColor
//      transitionColor       → lineColor
//      compositeBackground   → clusterBkg
// ---------------------------------------------------------------------------

describe("gantt overlay invariants", () => {
  const content = getCatalogContent("gantt-basic");

  for (const palette of BRAND_PALETTES) {
    it(`"${palette.name}": sectionBkgColor = mainBkg`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(`"sectionBkgColor": "${paletteColor(palette, "mainBkg")}"`);
    });

    it(`"${palette.name}": taskBkgColor = primaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(`"taskBkgColor": "${paletteColor(palette, "primaryColor")}"`);
    });

    it(`"${palette.name}": activeTaskBkgColor = secondaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(
        `"activeTaskBkgColor": "${paletteColor(palette, "secondaryColor")}"`
      );
    });

    it(`"${palette.name}": activeTaskBorderColor = primaryBorderColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(
        `"activeTaskBorderColor": "${paletteColor(palette, "primaryBorderColor")}"`
      );
    });

    it(`"${palette.name}": gridColor = lineColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(`"gridColor": "${paletteColor(palette, "lineColor")}"`);
    });

    it(`"${palette.name}": critBkgColor = "#dc2626" (hardcoded)`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "gantt"));
      expect(output).toContain(`"critBkgColor": "#dc2626"`);
    });
  }
});

describe("pie overlay invariants", () => {
  const content = getCatalogContent("pie-effort-allocation");

  for (const palette of BRAND_PALETTES) {
    it(`"${palette.name}": pie1 = primaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "pie"));
      expect(output).toContain(`"pie1": "${paletteColor(palette, "primaryColor")}"`);
    });

    it(`"${palette.name}": pie2 = secondaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "pie"));
      expect(output).toContain(`"pie2": "${paletteColor(palette, "secondaryColor")}"`);
    });

    it(`"${palette.name}": pie3 = tertiaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "pie"));
      expect(output).toContain(`"pie3": "${paletteColor(palette, "tertiaryColor")}"`);
    });

    it(`"${palette.name}": pieTitleTextColor = titleColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "pie"));
      expect(output).toContain(`"pieTitleTextColor": "${paletteColor(palette, "titleColor")}"`);
    });

    it(`"${palette.name}": pieSectionTextColor = primaryTextColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "pie"));
      expect(output).toContain(
        `"pieSectionTextColor": "${paletteColor(palette, "primaryTextColor")}"`
      );
    });
  }
});

describe("stateDiagram overlay invariants", () => {
  const content = getCatalogContent("state-theme-lifecycle");

  for (const palette of BRAND_PALETTES) {
    it(`"${palette.name}": stateBkg = primaryColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "stateDiagram"));
      expect(output).toContain(`"stateBkg": "${paletteColor(palette, "primaryColor")}"`);
    });

    it(`"${palette.name}": stateLabelColor = titleColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "stateDiagram"));
      expect(output).toContain(`"stateLabelColor": "${paletteColor(palette, "titleColor")}"`);
    });

    it(`"${palette.name}": transitionColor = lineColor`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "stateDiagram"));
      expect(output).toContain(`"transitionColor": "${paletteColor(palette, "lineColor")}"`);
    });

    it(`"${palette.name}": compositeBackground = clusterBkg`, () => {
      const output = generateThemedCode(content, familyOptions(palette, "stateDiagram"));
      expect(output).toContain(`"compositeBackground": "${paletteColor(palette, "clusterBkg")}"`);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Diagram body integrity — diagram keywords survive in the output unchanged
// ---------------------------------------------------------------------------

describe("family overlay — diagram body preserved", () => {
  for (const fixture of FAMILY_FIXTURES) {
    const content = getCatalogContent(fixture.id);

    it(`${fixture.id}: "${fixture.keyword}" keyword survives for every palette`, () => {
      for (const palette of BRAND_PALETTES) {
        const output = generateThemedCode(content, familyOptions(palette, fixture.family));
        expect(
          output,
          `Palette "${palette.name}" dropped "${fixture.keyword}" from ${fixture.id}`
        ).toContain(fixture.keyword);
      }
    });
  }
});
