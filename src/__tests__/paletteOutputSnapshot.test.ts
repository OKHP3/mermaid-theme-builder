/**
 * Snapshot tests: exact themed output for every BRAND_PALETTE.
 *
 * Purpose
 * -------
 * The applyTabDiffWiring tests confirm the pipeline wires up correctly, but
 * they do not catch a subtly wrong theme — e.g. if palette B's colors are
 * accidentally used when palette A is selected, or if a color key is silently
 * dropped. These snapshot tests pin the full string output of
 * `generateThemedCode` for each BRAND_PALETTE so that any change to the
 * generated text is immediately visible as a diff failure.
 *
 * On first run (or after an intentional palette change) update with:
 *   pnpm vitest run --update-snapshots src/__tests__/paletteOutputSnapshot.test.ts
 *
 * Snapshots are stored in src/__tests__/__snapshots__/
 */

import { describe, it, expect } from "vitest";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

/** Minimal flowchart with enough nodes to exercise the full init directive. */
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
// 1. Snapshot per palette — catches wrong-palette and color-key mutations
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × SIMPLE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) matches snapshot`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Cross-palette uniqueness — no two palettes produce identical output
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct output", () => {
  it("all brand palette outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Structural invariants — every palette output must contain its own colors
//    (guards against palette A's colors leaking into palette B's output)
// ---------------------------------------------------------------------------

describe("generateThemedCode — palette colors appear in output", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" output contains its own primaryColor`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette));
      const primaryColor = palette.colors.find((c) => c.key === "primaryColor")?.value ?? "";
      expect(output).toContain(primaryColor);
    });

    it(`palette "${palette.name}" output contains its own lineColor`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette));
      const lineColor = palette.colors.find((c) => c.key === "lineColor")?.value ?? "";
      expect(output).toContain(lineColor);
    });

    it(`palette "${palette.name}" output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette));
      const ownPrimary = palette.colors.find((c) => c.key === "primaryColor")?.value ?? "";

      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = other.colors.find((c) => c.key === "primaryColor")?.value ?? "";
        if (otherPrimary === ownPrimary) continue; // skip if colors happen to be equal
        expect(
          output,
          `Palette "${palette.name}" output contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Diagram body integrity — the original diagram lines survive unchanged
// ---------------------------------------------------------------------------

describe("generateThemedCode — original diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the diagram body`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, baseOptions(palette));
      expect(output).toContain("flowchart TD");
      expect(output).toContain("A[User Request] --> B[Validate Input]");
      expect(output).toContain("B --> C[Return Response]");
    });
  }
});
