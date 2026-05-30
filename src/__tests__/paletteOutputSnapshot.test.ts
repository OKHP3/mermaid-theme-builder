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
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { BRAND_PALETTES } from "@/lib/palettes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal flowchart with enough nodes to exercise the full init directive. */
const SIMPLE_DIAGRAM =
  "flowchart TD\n  A[User Request] --> B[Validate Input]\n  B --> C[Return Response]";

/**
 * Minimal sequence diagram — exercises the sequenceDiagram family overlay
 * (actorBkg, actorBorder, actorTextColor, actorLineColor, signalColor, etc.).
 */
const SEQUENCE_DIAGRAM =
  "sequenceDiagram\n  participant Alice\n  participant Bob\n  Alice->>Bob: Hello Bob\n  Bob-->>Alice: Hi Alice";

/**
 * Minimal ER diagram — exercises the erDiagram family overlay
 * (entityFill, entityBorder, entityLabelColor, relationColor, etc.).
 */
const ER_DIAGRAM =
  "erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseOptions(
  palette: (typeof BRAND_PALETTES)[number],
  diagramFamily: ExportOptions["diagramFamily"] = "flowchart"
): ExportOptions {
  return {
    palette,
    diagramFamily,
    includeMetaComments: false,
    includeBadge: false,
  };
}

/** Pull the resolved value of a color key from a palette, falling back to "". */
function paletteColor(palette: (typeof BRAND_PALETTES)[number], key: string): string {
  return palette.colors.find((c) => c.key === key)?.value ?? "";
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

// ===========================================================================
// SEQUENCE DIAGRAM FAMILY
// ===========================================================================

// ---------------------------------------------------------------------------
// 5. Snapshot per palette — BRAND_PALETTES × SEQUENCE_DIAGRAM
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × SEQUENCE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) sequence snapshot`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Cross-palette uniqueness — sequence diagram outputs are distinct
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct sequence output", () => {
  it("all brand palette sequence outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Sequence: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Structural invariants — sequence family overlay variables are populated
//    from the correct palette color keys
// ---------------------------------------------------------------------------

describe("generateThemedCode — sequenceDiagram overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" sequence output contains actorBkg = primaryColor`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"actorBkg": "${primary}"`);
    });

    it(`palette "${palette.name}" sequence output contains actorBorder = primaryBorderColor`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      const border = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"actorBorder": "${border}"`);
    });

    it(`palette "${palette.name}" sequence output contains actorLineColor = lineColor`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"actorLineColor": "${line}"`);
    });

    it(`palette "${palette.name}" sequence output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `Sequence: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 8. Diagram body integrity — sequence diagram body is preserved
// ---------------------------------------------------------------------------

describe("generateThemedCode — sequence diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the sequence diagram body`, () => {
      const output = generateThemedCode(SEQUENCE_DIAGRAM, baseOptions(palette, "sequenceDiagram"));
      expect(output).toContain("sequenceDiagram");
      expect(output).toContain("participant Alice");
      expect(output).toContain("Alice->>Bob: Hello Bob");
      expect(output).toContain("Bob-->>Alice: Hi Alice");
    });
  }
});

// ===========================================================================
// ER DIAGRAM FAMILY
// ===========================================================================

// ---------------------------------------------------------------------------
// 9. Snapshot per palette — BRAND_PALETTES × ER_DIAGRAM
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × ER_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) ER snapshot`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 10. Cross-palette uniqueness — ER diagram outputs are distinct
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct ER output", () => {
  it("all brand palette ER outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `ER: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Structural invariants — ER family overlay variables are populated
//     from the correct palette color keys
// ---------------------------------------------------------------------------

describe("generateThemedCode — erDiagram overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" ER output contains entityFill = primaryColor`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"entityFill": "${primary}"`);
    });

    it(`palette "${palette.name}" ER output contains entityBorder = primaryBorderColor`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      const border = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"entityBorder": "${border}"`);
    });

    it(`palette "${palette.name}" ER output contains relationColor = lineColor`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"relationColor": "${line}"`);
    });

    it(`palette "${palette.name}" ER output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `ER: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 12. Diagram body integrity — ER diagram body is preserved
// ---------------------------------------------------------------------------

describe("generateThemedCode — ER diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the ER diagram body`, () => {
      const output = generateThemedCode(ER_DIAGRAM, baseOptions(palette, "erDiagram"));
      expect(output).toContain("erDiagram");
      expect(output).toContain("CUSTOMER ||--o{ ORDER : places");
      expect(output).toContain("ORDER ||--|{ LINE-ITEM : contains");
    });
  }
});
