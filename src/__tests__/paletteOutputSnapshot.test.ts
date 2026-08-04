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

// ===========================================================================
// GANTT FAMILY
// ===========================================================================

/**
 * Minimal gantt diagram — exercises the gantt family overlay
 * (taskBkgColor, taskTextColor, gridColor, activeTaskBorderColor, etc.).
 */
const GANTT_DIAGRAM =
  "gantt\n  title Project Plan\n  dateFormat YYYY-MM-DD\n  section Phase 1\n  Design :a1, 2024-01-01, 7d\n  section Phase 2\n  Build :a2, after a1, 14d";

// ---------------------------------------------------------------------------
// 13. Snapshot per palette — BRAND_PALETTES × GANTT_DIAGRAM
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × GANTT_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) gantt snapshot`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 14. Cross-palette uniqueness — gantt outputs are distinct
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct gantt output", () => {
  it("all brand palette gantt outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Gantt: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Structural invariants — gantt family overlay variables are populated
//     from the correct palette color keys
// ---------------------------------------------------------------------------

describe("generateThemedCode — gantt overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" gantt output contains taskBkgColor = primaryColor`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"taskBkgColor": "${primary}"`);
    });

    it(`palette "${palette.name}" gantt output contains gridColor = lineColor`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"gridColor": "${line}"`);
    });

    it(`palette "${palette.name}" gantt output contains activeTaskBorderColor = primaryBorderColor`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      const border = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"activeTaskBorderColor": "${border}"`);
    });

    it(`palette "${palette.name}" gantt output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `Gantt: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 16. Diagram body integrity — gantt diagram body is preserved
// ---------------------------------------------------------------------------

describe("generateThemedCode — gantt diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the gantt diagram body`, () => {
      const output = generateThemedCode(GANTT_DIAGRAM, baseOptions(palette, "gantt"));
      expect(output).toContain("gantt");
      expect(output).toContain("title Project Plan");
      expect(output).toContain("Design :a1, 2024-01-01, 7d");
    });
  }
});

// ===========================================================================
// PIE FAMILY
// ===========================================================================

/**
 * Minimal pie chart — exercises the pie family overlay
 * (pie1, pie2, pie3, pieTitleTextColor, pieSectionTextColor, etc.).
 */
const PIE_DIAGRAM = 'pie title Distribution\n  "Alpha" : 40\n  "Beta" : 35\n  "Gamma" : 25';

// ---------------------------------------------------------------------------
// 17. Snapshot per palette — BRAND_PALETTES × PIE_DIAGRAM
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × PIE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) pie snapshot`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 18. Cross-palette uniqueness — pie outputs are distinct
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct pie output", () => {
  it("all brand palette pie outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Pie: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 19. Structural invariants — pie family overlay variables are populated
//     from the correct palette color keys
// ---------------------------------------------------------------------------

describe("generateThemedCode — pie overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" pie output contains pie1 = primaryColor`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"pie1": "${primary}"`);
    });

    it(`palette "${palette.name}" pie output contains pie2 = secondaryColor`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      const secondary = paletteColor(palette, "secondaryColor");
      expect(output).toContain(`"pie2": "${secondary}"`);
    });

    it(`palette "${palette.name}" pie output contains pieTitleTextColor = titleColor`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      const title = paletteColor(palette, "titleColor");
      expect(output).toContain(`"pieTitleTextColor": "${title}"`);
    });

    it(`palette "${palette.name}" pie output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `Pie: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 20. Diagram body integrity — pie diagram body is preserved
// ---------------------------------------------------------------------------

describe("generateThemedCode — pie diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the pie diagram body`, () => {
      const output = generateThemedCode(PIE_DIAGRAM, baseOptions(palette, "pie"));
      expect(output).toContain("pie");
      expect(output).toContain("title Distribution");
      expect(output).toContain('"Alpha" : 40');
    });
  }
});

// ===========================================================================
// STATE DIAGRAM FAMILY
// ===========================================================================

/**
 * Minimal state diagram — exercises the stateDiagram family overlay
 * (stateBkg, transitionColor, compositeBorder, labelColor, etc.).
 */
const STATE_DIAGRAM =
  "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Running : start\n  Running --> Idle : stop\n  Running --> [*]";

// ---------------------------------------------------------------------------
// 21. Snapshot per palette — BRAND_PALETTES × STATE_DIAGRAM
// ---------------------------------------------------------------------------

describe("generateThemedCode snapshots — BRAND_PALETTES × STATE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) state snapshot`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      expect(output).toMatchSnapshot();
    });
  }
});

// ---------------------------------------------------------------------------
// 22. Cross-palette uniqueness — state diagram outputs are distinct
// ---------------------------------------------------------------------------

describe("generateThemedCode — each BRAND_PALETTE produces a distinct state output", () => {
  it("all brand palette state diagram outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"))
    );

    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `State: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 23. Structural invariants — stateDiagram family overlay variables are
//     populated from the correct palette color keys
// ---------------------------------------------------------------------------

describe("generateThemedCode — stateDiagram overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" state output contains stateBkg = primaryColor`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"stateBkg": "${primary}"`);
    });

    it(`palette "${palette.name}" state output contains transitionColor = lineColor`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"transitionColor": "${line}"`);
    });

    it(`palette "${palette.name}" state output contains compositeBorder = primaryBorderColor`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      const border = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"compositeBorder": "${border}"`);
    });

    it(`palette "${palette.name}" state output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `State: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 24. Diagram body integrity — state diagram body is preserved
// ---------------------------------------------------------------------------

describe("generateThemedCode — state diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the state diagram body`, () => {
      const output = generateThemedCode(STATE_DIAGRAM, baseOptions(palette, "stateDiagram"));
      expect(output).toContain("stateDiagram-v2");
      expect(output).toContain("[*] --> Idle");
      expect(output).toContain("Running --> Idle : stop");
    });
  }
});
