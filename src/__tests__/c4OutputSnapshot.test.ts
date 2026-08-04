/**
 * Snapshot tests: exact themed output for C4 diagrams across all BRAND_PALETTES.
 *
 * Purpose
 * -------
 * The c4ThemedOutput.test.ts integration tests confirm that the %%{init} block
 * is injected and all C4 themeVariable keys (personBkg, personBorder, mainBkg,
 * nodeBorder, lineColor) appear in the output — but they do NOT pin the exact
 * color values or full structure of the init directive. A subtle mutation such
 * as personBkg receiving the wrong palette color, a key being swapped between
 * C4 fixtures, or the JSON serialisation format changing would still pass the
 * integration tests.
 *
 * These snapshot tests pin the full string output of `generateThemedCode` for
 * c4-container-learning-platform and c4-component-api-server across every
 * BRAND_PALETTE so that any unintended change to the generated init block is
 * immediately visible as a diff failure.
 *
 * To update snapshots after an intentional change to palette values or the
 * C4 family overlay in src/lib/family-theming.ts, run:
 *
 *   pnpm vitest run -u src/__tests__/c4OutputSnapshot.test.ts
 *
 * Snapshots are stored in src/__tests__/__snapshots__/c4OutputSnapshot.test.ts.snap
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { EXAMPLE_CATALOG } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * The two primary C4 fixtures targeted by this task.
 * c4-dynamic-user-login is covered by c4ThemedOutput.test.ts and not snapshotted
 * here to avoid duplication; the container and component views exercise the full
 * C4 overlay (personBkg, personBorder, mainBkg, nodeBorder, lineColor, titleColor).
 */
const C4_SNAPSHOT_FIXTURES = [
  { id: "c4-container-learning-platform", keyword: "C4Container" },
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

/** Pull the resolved value of a color key from a palette, falling back to "". */
function paletteColor(palette: (typeof BRAND_PALETTES)[number], key: string): string {
  return palette.colors.find((c) => c.key === key)?.value ?? "";
}

// ---------------------------------------------------------------------------
// 1. Snapshot per palette — pins the full %%{init} block structure
//    Catches: wrong color values, key renames, JSON format changes
// ---------------------------------------------------------------------------

for (const fixture of C4_SNAPSHOT_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`C4 snapshot — ${fixture.id} (${fixture.keyword})`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`palette "${palette.name}" (id: ${palette.id}) matches snapshot`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toMatchSnapshot();
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 2. Cross-palette uniqueness — no two palettes produce identical C4 output
//    Catches: palette-selection logic returning the same result for all inputs
// ---------------------------------------------------------------------------

for (const fixture of C4_SNAPSHOT_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`C4 uniqueness — ${fixture.id} outputs are distinct per palette`, () => {
    it("all BRAND_PALETTE outputs are unique", () => {
      const outputs = BRAND_PALETTES.map((p) => generateThemedCode(content, c4Options(p)));
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
// 3. Structural invariants — C4 overlay keys resolve from the correct palette
//    colors (mirrors the mapping in src/lib/family-theming.ts, case "c4Diagram")
//
//    personBkg    → primaryColor
//    personBorder → primaryBorderColor
//    mainBkg      → mainBkg
//    nodeBorder   → nodeBorder
//    lineColor    → lineColor
//    titleColor   → titleColor
// ---------------------------------------------------------------------------

for (const fixture of C4_SNAPSHOT_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`C4 overlay invariants — ${fixture.id}`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`"${palette.name}": personBkg = primaryColor`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(`"personBkg": "${paletteColor(palette, "primaryColor")}"`);
      });

      it(`"${palette.name}": personBorder = primaryBorderColor`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(
          `"personBorder": "${paletteColor(palette, "primaryBorderColor")}"`
        );
      });

      it(`"${palette.name}": mainBkg = mainBkg palette key`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(`"mainBkg": "${paletteColor(palette, "mainBkg")}"`);
      });

      it(`"${palette.name}": nodeBorder = nodeBorder palette key`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(`"nodeBorder": "${paletteColor(palette, "nodeBorder")}"`);
      });

      it(`"${palette.name}": lineColor = lineColor palette key`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(`"lineColor": "${paletteColor(palette, "lineColor")}"`);
      });

      it(`"${palette.name}": titleColor = titleColor palette key`, () => {
        const output = generateThemedCode(content, c4Options(palette));
        expect(output).toContain(`"titleColor": "${paletteColor(palette, "titleColor")}"`);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Cross-palette isolation — no C4 output contains another palette's colors
//    Catches: palette leak (palette B's primaryColor appearing in palette A's output)
// ---------------------------------------------------------------------------

for (const fixture of C4_SNAPSHOT_FIXTURES) {
  const content = getCatalogContent(fixture.id);

  describe(`C4 palette isolation — ${fixture.id}`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`"${palette.name}" personBkg does not appear in any other palette's output`, () => {
        const ownOutput = generateThemedCode(content, c4Options(palette));
        const ownPersonBkg = paletteColor(palette, "primaryColor");

        for (const other of BRAND_PALETTES) {
          if (other.id === palette.id) continue;
          const otherPersonBkg = paletteColor(other, "primaryColor");
          if (otherPersonBkg === ownPersonBkg) continue; // equal colors — skip
          const otherOutput = generateThemedCode(content, c4Options(other));
          expect(
            otherOutput,
            `${fixture.id}: palette "${other.name}" output contains personBkg from "${palette.name}" (${ownPersonBkg})`
          ).not.toContain(`"personBkg": "${ownPersonBkg}"`);
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 5. Diagram body integrity — C4 keywords survive in the output unchanged
// ---------------------------------------------------------------------------

describe("C4 snapshot — diagram body preserved", () => {
  for (const fixture of C4_SNAPSHOT_FIXTURES) {
    const content = getCatalogContent(fixture.id);

    it(`${fixture.id}: ${fixture.keyword} keyword survives for every palette`, () => {
      for (const palette of BRAND_PALETTES) {
        const output = generateThemedCode(content, c4Options(palette));
        expect(
          output,
          `Palette "${palette.name}" dropped ${fixture.keyword} from ${fixture.id}`
        ).toContain(fixture.keyword);
      }
    });
  }
});
