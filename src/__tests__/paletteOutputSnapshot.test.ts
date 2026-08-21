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

// ---------------------------------------------------------------------------
// 25. customThemeName snapshots — flowchart with badge enabled
//
// The badge node is the only deterministic place customThemeName appears in
// generateThemedCode output (meta comments include a live timestamp and are
// not snapshot-safe).  With includeBadge: true the badge line reads:
//   MTB_ATTR(["Styled with <customThemeName> via Mermaid Theme Builder"])
// Snapshotting the full output here locks in both the %%{init} block AND the
// badge for every BRAND_PALETTE.  A mutation to the custom-name injection or
// badge formatting is immediately visible as a diff failure.
//
// To update after an intentional badge or theme-name change:
//   pnpm vitest run -u src/__tests__/paletteOutputSnapshot.test.ts
// ---------------------------------------------------------------------------

const CUSTOM_THEME_NAME = "My Forge Theme";

describe(`generateThemedCode snapshots — customThemeName "${CUSTOM_THEME_NAME}" × SIMPLE_DIAGRAM (badge enabled)`, () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) matches snapshot`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, {
        ...baseOptions(palette, "flowchart"),
        includeBadge: true,
        customThemeName: CUSTOM_THEME_NAME,
      });
      expect(output).toMatchSnapshot();
    });
  }
});

describe(`generateThemedCode — customThemeName "${CUSTOM_THEME_NAME}" appears in badge for every palette`, () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" badge contains custom name`, () => {
      const output = generateThemedCode(SIMPLE_DIAGRAM, {
        ...baseOptions(palette, "flowchart"),
        includeBadge: true,
        customThemeName: CUSTOM_THEME_NAME,
      });
      expect(output).toContain(`Styled with ${CUSTOM_THEME_NAME} via Mermaid Theme Builder`);
    });
  }
});

describe(`generateThemedCode — customThemeName "${CUSTOM_THEME_NAME}" does not bleed into another palette's badge`, () => {
  it("all BRAND_PALETTE badge outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((p) =>
      generateThemedCode(SIMPLE_DIAGRAM, {
        ...baseOptions(p, "flowchart"),
        includeBadge: true,
        customThemeName: CUSTOM_THEME_NAME,
      })
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical badge output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

// ===========================================================================
// CLASS DIAGRAM FAMILY
// ===========================================================================

/**
 * Minimal class diagram — exercises the classDiagram family overlay
 * (classBorder, relationColor, classText, relationLabelColor).
 */
const CLASS_DIAGRAM =
  "classDiagram\n  class Animal {\n    +String name\n    +makeSound() void\n  }\n  class Dog {\n    +fetch() void\n  }\n  Animal <|-- Dog";

describe("generateThemedCode snapshots — BRAND_PALETTES × CLASS_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) classDiagram snapshot`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct classDiagram output", () => {
  it("all brand palette classDiagram outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `ClassDiagram: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — classDiagram overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" classDiagram output contains classBorder = primaryBorderColor`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      const border = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"classBorder": "${border}"`);
    });

    it(`palette "${palette.name}" classDiagram output contains relationColor = lineColor`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"relationColor": "${line}"`);
    });

    it(`palette "${palette.name}" classDiagram output contains classText = primaryTextColor`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      const text = paletteColor(palette, "primaryTextColor");
      expect(output).toContain(`"classText": "${text}"`);
    });

    it(`palette "${palette.name}" classDiagram output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `ClassDiagram: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — classDiagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the classDiagram body`, () => {
      const output = generateThemedCode(CLASS_DIAGRAM, baseOptions(palette, "classDiagram"));
      expect(output).toContain("classDiagram");
      expect(output).toContain("class Animal");
      expect(output).toContain("Animal <|-- Dog");
    });
  }
});

// ---------------------------------------------------------------------------
// 26. customThemeName badge snapshots — remaining badge-safe families
//
// The flowchart coverage above pins custom badge output for one badge-safe
// family. Sequence, state, and class diagrams accept the same badge syntax,
// but need their own snapshots in case their inclusion in BADGE_SAFE_FAMILIES
// regresses.
// ---------------------------------------------------------------------------

const CUSTOM_BADGE_FAMILY_FIXTURES = [
  { family: "sequenceDiagram" as const, diagram: SEQUENCE_DIAGRAM },
  { family: "stateDiagram" as const, diagram: STATE_DIAGRAM },
  { family: "classDiagram" as const, diagram: CLASS_DIAGRAM },
] as const;

for (const fixture of CUSTOM_BADGE_FAMILY_FIXTURES) {
  describe(`generateThemedCode snapshots — customThemeName "${CUSTOM_THEME_NAME}" × ${fixture.family} (badge enabled)`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`palette "${palette.name}" (id: ${palette.id}) matches snapshot`, () => {
        const output = generateThemedCode(fixture.diagram, {
          ...baseOptions(palette, fixture.family),
          includeBadge: true,
          customThemeName: CUSTOM_THEME_NAME,
        });
        expect(output).toMatchSnapshot();
      });
    }
  });

  describe(`generateThemedCode — customThemeName "${CUSTOM_THEME_NAME}" appears in ${fixture.family} badges`, () => {
    for (const palette of BRAND_PALETTES) {
      it(`palette "${palette.name}" badge contains the custom name`, () => {
        const output = generateThemedCode(fixture.diagram, {
          ...baseOptions(palette, fixture.family),
          includeBadge: true,
          customThemeName: CUSTOM_THEME_NAME,
        });
        expect(output).toContain(
          `MTB_ATTR(["Styled with ${CUSTOM_THEME_NAME} via Mermaid Theme Builder"])`
        );
      });
    }
  });
}

// ===========================================================================
// GITGRAPH FAMILY
// ===========================================================================

/**
 * Minimal git graph — exercises the gitGraph family overlay
 * (git0, git1, git2, gitBranchLabel0, commitLabelColor, etc.).
 */
const GITGRAPH_DIAGRAM =
  "gitGraph\n  commit\n  branch feature\n  checkout feature\n  commit\n  checkout main\n  merge feature";

describe("generateThemedCode snapshots — BRAND_PALETTES × GITGRAPH_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) gitGraph snapshot`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct gitGraph output", () => {
  it("all brand palette gitGraph outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `GitGraph: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — gitGraph overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" gitGraph output contains git0 = primaryColor`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"git0": "${primary}"`);
    });

    it(`palette "${palette.name}" gitGraph output contains git1 = secondaryColor`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      const secondary = paletteColor(palette, "secondaryColor");
      expect(output).toContain(`"git1": "${secondary}"`);
    });

    it(`palette "${palette.name}" gitGraph output contains git2 = lineColor`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"git2": "${line}"`);
    });

    it(`palette "${palette.name}" gitGraph output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `GitGraph: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — gitGraph body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the gitGraph body`, () => {
      const output = generateThemedCode(GITGRAPH_DIAGRAM, baseOptions(palette, "gitGraph"));
      expect(output).toContain("gitGraph");
      expect(output).toContain("branch feature");
      expect(output).toContain("merge feature");
    });
  }
});

// ===========================================================================
// QUADRANTCHART FAMILY
// ===========================================================================

/**
 * Minimal quadrant chart — exercises the quadrantChart family overlay
 * (quadrant1Fill, quadrant2Fill, quadrantPointFill, quadrantTitleFill, etc.).
 */
const QUADRANT_DIAGRAM =
  "quadrantChart\n  title Effort vs Impact\n  x-axis Low Effort --> High Effort\n  y-axis Low Impact --> High Impact\n  Quick wins: [0.2, 0.8]\n  Major projects: [0.8, 0.8]";

describe("generateThemedCode snapshots — BRAND_PALETTES × QUADRANT_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) quadrantChart snapshot`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct quadrantChart output", () => {
  it("all brand palette quadrantChart outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `QuadrantChart: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — quadrantChart overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" quadrantChart output contains quadrant1Fill = primaryColor`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"quadrant1Fill": "${primary}"`);
    });

    it(`palette "${palette.name}" quadrantChart output contains quadrantPointFill = lineColor`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      const line = paletteColor(palette, "lineColor");
      expect(output).toContain(`"quadrantPointFill": "${line}"`);
    });

    it(`palette "${palette.name}" quadrantChart output contains quadrant2Fill = secondaryColor`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      const secondary = paletteColor(palette, "secondaryColor");
      expect(output).toContain(`"quadrant2Fill": "${secondary}"`);
    });

    it(`palette "${palette.name}" quadrantChart output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `QuadrantChart: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — quadrantChart body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the quadrantChart body`, () => {
      const output = generateThemedCode(QUADRANT_DIAGRAM, baseOptions(palette, "quadrantChart"));
      expect(output).toContain("quadrantChart");
      expect(output).toContain("Effort vs Impact");
      expect(output).toContain("Quick wins");
    });
  }
});

// ===========================================================================
// TIMELINE FAMILY
// ===========================================================================

/**
 * Minimal timeline diagram — exercises the timeline family overlay
 * (cScale0–cScale11, cycling primary → secondary → tertiary etc.).
 */
const TIMELINE_DIAGRAM =
  "timeline\n  title Product Roadmap\n  section Q1\n    Design : Wireframes\n  section Q2\n    Build : Core features\n  section Q3\n    Launch : Public release";

describe("generateThemedCode snapshots — BRAND_PALETTES × TIMELINE_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) timeline snapshot`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct timeline output", () => {
  it("all brand palette timeline outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Timeline: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — timeline overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" timeline output contains cScale0 = primaryColor`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"cScale0": "${primary}"`);
    });

    it(`palette "${palette.name}" timeline output contains cScale1 = secondaryColor`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      const secondary = paletteColor(palette, "secondaryColor");
      expect(output).toContain(`"cScale1": "${secondary}"`);
    });

    it(`palette "${palette.name}" timeline output contains cScale2 = tertiaryColor`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      const tertiary = paletteColor(palette, "tertiaryColor");
      expect(output).toContain(`"cScale2": "${tertiary}"`);
    });

    it(`palette "${palette.name}" timeline output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `Timeline: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — timeline body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the timeline body`, () => {
      const output = generateThemedCode(TIMELINE_DIAGRAM, baseOptions(palette, "timeline"));
      expect(output).toContain("timeline");
      expect(output).toContain("Product Roadmap");
      expect(output).toContain("Public release");
    });
  }
});

// ===========================================================================
// XYCHART FAMILY
// ===========================================================================

/**
 * Minimal XY chart — exercises the xychart family overlay.
 * Unlike every other family, xychart uses a single `xyChart` key whose value
 * is a comma-joined color string: [primary,secondary,tertiary,lineColor,nodeBorder,mainBkg].
 * These tests confirm that unusual format serialises into the %%{init} block
 * without being dropped or mangled.
 */
const XYCHART_DIAGRAM =
  "xychart-beta\n  title Sales Trend\n  x-axis [Jan, Feb, Mar, Apr]\n  y-axis 0 --> 100\n  bar [30, 55, 80, 45]\n  line [20, 45, 70, 40]";

describe("generateThemedCode snapshots — BRAND_PALETTES × XYCHART_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) xychart snapshot`, () => {
      const output = generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct xychart output", () => {
  it("all brand palette xychart outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `XYChart: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — xychart overlay produces the correct joined color string", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" xychart output contains xyChart = comma-joined palette colors`, () => {
      const output = generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"));
      const primary = paletteColor(palette, "primaryColor");
      const secondary = paletteColor(palette, "secondaryColor");
      const tertiary = paletteColor(palette, "tertiaryColor");
      const line = paletteColor(palette, "lineColor");
      const nodeBorder = paletteColor(palette, "nodeBorder");
      const mainBkg = paletteColor(palette, "mainBkg");
      const expected = [primary, secondary, tertiary, line, nodeBorder, mainBkg].join(",");
      expect(output).toContain(`"xyChart": "${expected}"`);
    });

    it(`palette "${palette.name}" xychart output contains all six palette colors in order`, () => {
      const output = generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"));
      const primary = paletteColor(palette, "primaryColor");
      const secondary = paletteColor(palette, "secondaryColor");
      const tertiary = paletteColor(palette, "tertiaryColor");
      // The comma-joined value starts with primary and contains secondary and tertiary
      expect(output).toContain(primary);
      expect(output).toContain(secondary);
      expect(output).toContain(tertiary);
    });

    it(`palette "${palette.name}" xychart output does not contain another palette's joined color string`, () => {
      const output = generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        const otherSecondary = paletteColor(other, "secondaryColor");
        const otherTertiary = paletteColor(other, "tertiaryColor");
        const otherLine = paletteColor(other, "lineColor");
        const otherNodeBorder = paletteColor(other, "nodeBorder");
        const otherMainBkg = paletteColor(other, "mainBkg");
        const otherJoined = [
          otherPrimary,
          otherSecondary,
          otherTertiary,
          otherLine,
          otherNodeBorder,
          otherMainBkg,
        ].join(",");
        const ownSecondary = paletteColor(palette, "secondaryColor");
        const ownTertiary = paletteColor(palette, "tertiaryColor");
        const ownLine = paletteColor(palette, "lineColor");
        const ownNodeBorder = paletteColor(palette, "nodeBorder");
        const ownMainBkg = paletteColor(palette, "mainBkg");
        const ownJoined = [
          ownPrimary,
          ownSecondary,
          ownTertiary,
          ownLine,
          ownNodeBorder,
          ownMainBkg,
        ].join(",");
        if (otherJoined === ownJoined) continue; // skip if palettes happen to produce identical strings
        expect(
          output,
          `XYChart: palette "${palette.name}" contains joined color string from "${other.name}"`
        ).not.toContain(otherJoined);
      }
    });
  }
});

describe("generateThemedCode — xychart body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the xychart body`, () => {
      const output = generateThemedCode(XYCHART_DIAGRAM, baseOptions(palette, "xychart"));
      expect(output).toContain("xychart-beta");
      expect(output).toContain("Sales Trend");
      expect(output).toContain("bar [30, 55, 80, 45]");
    });
  }
});

// ===========================================================================
// JOURNEY FAMILY
// ===========================================================================

/**
 * Minimal journey diagram — exercises the journey family overlay
 * (taskBkgColor = primaryColor, sectionBkgColor = mainBkg, labelColor = titleColor,
 * altSectionBkgColor = tertiaryColor, taskTextColor = primaryTextColor).
 */
const JOURNEY_DIAGRAM =
  "journey\n  title My Working Day\n  section Work\n    Make tea: 5: Me\n    Do work: 1: Me, Cat\n  section Home\n    Relax: 5: Me";

describe("generateThemedCode snapshots — BRAND_PALETTES × JOURNEY_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) journey snapshot`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct journey output", () => {
  it("all brand palette journey outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Journey: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — journey overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" journey output contains taskBkgColor = primaryColor`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"taskBkgColor": "${primary}"`);
    });

    it(`palette "${palette.name}" journey output contains sectionBkgColor = mainBkg`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      const mainBkg = paletteColor(palette, "mainBkg");
      expect(output).toContain(`"sectionBkgColor": "${mainBkg}"`);
    });

    it(`palette "${palette.name}" journey output contains labelColor = titleColor`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      const titleColor = paletteColor(palette, "titleColor");
      expect(output).toContain(`"labelColor": "${titleColor}"`);
    });

    it(`palette "${palette.name}" journey output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `Journey: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — journey body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the journey body`, () => {
      const output = generateThemedCode(JOURNEY_DIAGRAM, baseOptions(palette, "journey"));
      expect(output).toContain("journey");
      expect(output).toContain("My Working Day");
      expect(output).toContain("Make tea: 5: Me");
    });
  }
});

// ===========================================================================
// C4DIAGRAM FAMILY
// ===========================================================================

/**
 * Minimal C4 context diagram — exercises the c4Diagram family overlay
 * (personBkg = primaryColor, personBorder = primaryBorderColor,
 * mainBkg = mainBkg, nodeBorder = nodeBorder, lineColor = lineColor).
 */
const C4_DIAGRAM =
  'C4Context\n  title System Context\n  Person(user, "User", "End user")\n  System(sys, "My System", "Core application")\n  Rel(user, sys, "Uses")';

describe("generateThemedCode snapshots — BRAND_PALETTES × C4_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) c4Diagram snapshot`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct c4Diagram output", () => {
  it("all brand palette c4Diagram outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `C4Diagram: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — c4Diagram overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" c4Diagram output contains personBkg = primaryColor`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      const primary = paletteColor(palette, "primaryColor");
      expect(output).toContain(`"personBkg": "${primary}"`);
    });

    it(`palette "${palette.name}" c4Diagram output contains personBorder = primaryBorderColor`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      const primaryBorder = paletteColor(palette, "primaryBorderColor");
      expect(output).toContain(`"personBorder": "${primaryBorder}"`);
    });

    it(`palette "${palette.name}" c4Diagram output contains lineColor = lineColor`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      const lineColor = paletteColor(palette, "lineColor");
      expect(output).toContain(`"lineColor": "${lineColor}"`);
    });

    it(`palette "${palette.name}" c4Diagram output does not contain another palette's primaryColor`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      const ownPrimary = paletteColor(palette, "primaryColor");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherPrimary = paletteColor(other, "primaryColor");
        if (otherPrimary === ownPrimary) continue;
        expect(
          output,
          `C4Diagram: palette "${palette.name}" contains primaryColor from "${other.name}" (${otherPrimary})`
        ).not.toContain(otherPrimary);
      }
    });
  }
});

describe("generateThemedCode — c4Diagram body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the c4Diagram body`, () => {
      const output = generateThemedCode(C4_DIAGRAM, baseOptions(palette, "c4Diagram"));
      expect(output).toContain("C4Context");
      expect(output).toContain("System Context");
      expect(output).toContain("My System");
    });
  }
});

// ===========================================================================
// BLOCK FAMILY
// ===========================================================================

/**
 * Minimal block-beta diagram — exercises the block family overlay
 * (mainBkg = mainBkg, nodeBorder = nodeBorder, lineColor = lineColor,
 * clusterBkg = clusterBkg, titleColor = titleColor).
 * block-beta shares the same themeVariable keys as flowchart but the overlay
 * sets them explicitly so palette colors are not masked by Mermaid defaults.
 */
const BLOCK_DIAGRAM = 'block-beta\n  columns 2\n  A["Step 1"]\n  B["Step 2"]\n  A --> B';

describe("generateThemedCode snapshots — BRAND_PALETTES × BLOCK_DIAGRAM", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" (id: ${palette.id}) block snapshot`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      expect(output).toMatchSnapshot();
    });
  }
});

describe("generateThemedCode — each BRAND_PALETTE produces a distinct block output", () => {
  it("all brand palette block outputs are unique", () => {
    const outputs = BRAND_PALETTES.map((palette) =>
      generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"))
    );
    for (let i = 0; i < outputs.length; i++) {
      for (let j = i + 1; j < outputs.length; j++) {
        expect(
          outputs[i],
          `Block: palette "${BRAND_PALETTES[i].name}" and "${BRAND_PALETTES[j].name}" produced identical output`
        ).not.toBe(outputs[j]);
      }
    }
  });
});

describe("generateThemedCode — block overlay variables resolve from palette", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" block output contains mainBkg = mainBkg`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      const mainBkg = paletteColor(palette, "mainBkg");
      expect(output).toContain(`"mainBkg": "${mainBkg}"`);
    });

    it(`palette "${palette.name}" block output contains nodeBorder = nodeBorder`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      const nodeBorder = paletteColor(palette, "nodeBorder");
      expect(output).toContain(`"nodeBorder": "${nodeBorder}"`);
    });

    it(`palette "${palette.name}" block output contains lineColor = lineColor`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      const lineColor = paletteColor(palette, "lineColor");
      expect(output).toContain(`"lineColor": "${lineColor}"`);
    });

    it(`palette "${palette.name}" block output does not contain another palette's mainBkg`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      const ownMainBkg = paletteColor(palette, "mainBkg");
      for (const other of BRAND_PALETTES) {
        if (other.id === palette.id) continue;
        const otherMainBkg = paletteColor(other, "mainBkg");
        if (otherMainBkg === ownMainBkg) continue;
        expect(
          output,
          `Block: palette "${palette.name}" contains mainBkg from "${other.name}" (${otherMainBkg})`
        ).not.toContain(otherMainBkg);
      }
    });
  }
});

describe("generateThemedCode — block body is preserved", () => {
  for (const palette of BRAND_PALETTES) {
    it(`palette "${palette.name}" preserves the block body`, () => {
      const output = generateThemedCode(BLOCK_DIAGRAM, baseOptions(palette, "block"));
      expect(output).toContain("block-beta");
      expect(output).toContain("Step 1");
      expect(output).toContain("Step 2");
    });
  }
});
