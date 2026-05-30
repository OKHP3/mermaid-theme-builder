/**
 * Tests for the getFamilySyntaxHint registry in src/lib/familySyntaxHints.ts.
 *
 * Behaviors covered:
 *   1. getFamilySyntaxHint returns a non-null result for every family in
 *      the HINTS registry (exact-set sentinel).
 *   2. getFamilySyntaxHint returns null for families with no registered hint.
 *   3. classDefStatus values are consistent with CLASSDEF_CAPABLE_FAMILIES:
 *      — families in CLASSDEF_CAPABLE_FAMILIES carry "yes" or "limited"
 *      — families outside CLASSDEF_CAPABLE_FAMILIES carry "no"
 *   4. Every registered hint is structurally complete (non-empty required fields,
 *      valid classDefStatus enum value, unique family key).
 */

import { describe, it, expect } from "vitest";
import { getFamilySyntaxHint } from "@/lib/family-syntax-hints";
import type { ClassDefStatus } from "@/lib/family-syntax-hints";
import { CLASSDEF_CAPABLE_FAMILIES } from "@/lib/theme-engine";
import type { DiagramFamily } from "@/data/mermaid-capabilities";

// ---------------------------------------------------------------------------
// 1. Exact-set sentinel — every family in the registry returns a hint
// ---------------------------------------------------------------------------

describe("getFamilySyntaxHint — returns non-null for all registered families", () => {
  const HINT_FAMILIES: DiagramFamily[] = [
    "flowchart",
    "gantt",
    "pie",
    "mindmap",
    "erDiagram",
    "classDiagram",
    "stateDiagram",
    "sequenceDiagram",
    "block",
    "timeline",
    "xychart",
    "quadrantChart",
    "sankey",
  ];

  for (const family of HINT_FAMILIES) {
    it(`returns a hint for "${family}"`, () => {
      expect(getFamilySyntaxHint(family)).not.toBeNull();
    });
  }

  it("exact-set sentinel — list has exactly 13 entries and all return non-null", () => {
    expect(HINT_FAMILIES).toHaveLength(13);
    const missingHints = HINT_FAMILIES.filter((f) => getFamilySyntaxHint(f) === null);
    expect(missingHints).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Families with no registered hint return null
// ---------------------------------------------------------------------------

describe("getFamilySyntaxHint — returns null for families without a hint", () => {
  const NO_HINT_FAMILIES: DiagramFamily[] = ["unknown"];

  for (const family of NO_HINT_FAMILIES) {
    it(`returns null for "${family}"`, () => {
      expect(getFamilySyntaxHint(family)).toBeNull();
    });
  }
});

// ---------------------------------------------------------------------------
// 3. classDefStatus aligns with CLASSDEF_CAPABLE_FAMILIES
// ---------------------------------------------------------------------------

describe("getFamilySyntaxHint — classDefStatus matches CLASSDEF_CAPABLE_FAMILIES", () => {
  it('flowchart classDefStatus is "yes" (full classDef support)', () => {
    expect(getFamilySyntaxHint("flowchart")?.classDefStatus).toBe("yes");
  });

  it('classDiagram classDefStatus is "yes" (full classDef support)', () => {
    expect(getFamilySyntaxHint("classDiagram")?.classDefStatus).toBe("yes");
  });

  it('block classDefStatus is "yes" (full classDef support)', () => {
    expect(getFamilySyntaxHint("block")?.classDefStatus).toBe("yes");
  });

  it('stateDiagram classDefStatus is "limited" (partial classDef support)', () => {
    expect(getFamilySyntaxHint("stateDiagram")?.classDefStatus).toBe("limited");
  });

  const NON_CLASSDEF_HINT_FAMILIES: DiagramFamily[] = [
    "gantt",
    "pie",
    "mindmap",
    "erDiagram",
    "sequenceDiagram",
    "timeline",
    "xychart",
    "quadrantChart",
    "sankey",
  ];

  for (const family of NON_CLASSDEF_HINT_FAMILIES) {
    it(`"${family}" classDefStatus is "no" — not in CLASSDEF_CAPABLE_FAMILIES`, () => {
      expect(getFamilySyntaxHint(family)?.classDefStatus).toBe("no");
      expect(CLASSDEF_CAPABLE_FAMILIES.includes(family)).toBe(false);
    });
  }

  it('every hinted family with "yes" or "limited" classDefStatus is in CLASSDEF_CAPABLE_FAMILIES', () => {
    const HINT_FAMILIES: DiagramFamily[] = [
      "flowchart",
      "gantt",
      "pie",
      "mindmap",
      "erDiagram",
      "classDiagram",
      "stateDiagram",
      "sequenceDiagram",
      "block",
      "timeline",
      "xychart",
      "quadrantChart",
      "sankey",
    ];

    const capable: DiagramFamily[] = [];
    const notCapable: DiagramFamily[] = [];
    for (const family of HINT_FAMILIES) {
      const hint = getFamilySyntaxHint(family);
      if (hint?.classDefStatus === "yes" || hint?.classDefStatus === "limited") {
        capable.push(family);
      } else {
        notCapable.push(family);
      }
    }

    for (const family of capable) {
      expect(
        CLASSDEF_CAPABLE_FAMILIES.includes(family),
        `"${family}" has classDefStatus "yes"/"limited" but is not in CLASSDEF_CAPABLE_FAMILIES`
      ).toBe(true);
    }

    for (const family of notCapable) {
      expect(
        CLASSDEF_CAPABLE_FAMILIES.includes(family),
        `"${family}" has classDefStatus "no" but is listed in CLASSDEF_CAPABLE_FAMILIES`
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Shape integrity — every hint is structurally complete
// ---------------------------------------------------------------------------

describe("getFamilySyntaxHint — shape integrity for all registered hints", () => {
  const HINT_FAMILIES: DiagramFamily[] = [
    "flowchart",
    "gantt",
    "pie",
    "mindmap",
    "erDiagram",
    "classDiagram",
    "stateDiagram",
    "sequenceDiagram",
    "block",
    "timeline",
    "xychart",
    "quadrantChart",
    "sankey",
  ];

  const VALID_CLASSDEF_STATUSES: ClassDefStatus[] = ["yes", "no", "limited"];

  it("every hint has a non-empty keyIdiom", () => {
    const missing = HINT_FAMILIES.filter((f) => {
      const hint = getFamilySyntaxHint(f);
      return !hint?.keyIdiom?.trim();
    });
    expect(missing).toEqual([]);
  });

  it("every hint has a non-empty themingNote", () => {
    const missing = HINT_FAMILIES.filter((f) => {
      const hint = getFamilySyntaxHint(f);
      return !hint?.themingNote?.trim();
    });
    expect(missing).toEqual([]);
  });

  it("every hint classDefStatus is one of 'yes' | 'no' | 'limited'", () => {
    const invalid = HINT_FAMILIES.filter((f) => {
      const hint = getFamilySyntaxHint(f);
      return hint && !VALID_CLASSDEF_STATUSES.includes(hint.classDefStatus);
    });
    expect(invalid).toEqual([]);
  });

  it("every hint family field matches the key used to look it up", () => {
    const mismatched = HINT_FAMILIES.filter((f) => {
      const hint = getFamilySyntaxHint(f);
      return hint?.family !== f;
    });
    expect(mismatched).toEqual([]);
  });

  it("no duplicate family keys in the registry (each lookup returns a distinct object)", () => {
    const hints = HINT_FAMILIES.map((f) => getFamilySyntaxHint(f));
    const uniqueHints = new Set(hints);
    expect(uniqueHints.size).toBe(HINT_FAMILIES.length);
  });
});

// ---------------------------------------------------------------------------
// 5. Content snapshots — lock in keyIdiom, classDefStatus, and themingNote
//    for every registered hint (Task #348).
//
//    Any mutation to a hint body (typo fix, wording change, whitespace edit)
//    produces a diff that must be reviewed before `vitest --update-snapshots`.
//    The first run after adding this block creates the snapshot file; all
//    subsequent CI runs guard against unintentional mutations.
// ---------------------------------------------------------------------------

describe("getFamilySyntaxHint — content snapshots (all 28 registered hints)", () => {
  const ALL_HINT_FAMILIES: DiagramFamily[] = [
    // Original 13 — already covered by structural tests above
    "flowchart",
    "gantt",
    "pie",
    "mindmap",
    "erDiagram",
    "classDiagram",
    "stateDiagram",
    "sequenceDiagram",
    "block",
    "timeline",
    "xychart",
    "quadrantChart",
    "sankey",
    // Additional 15 added in Task #271
    "journey",
    "gitGraph",
    "requirementDiagram",
    "c4Diagram",
    "architectureBeta",
    "packet",
    "kanban",
    "zenuml",
    "radar",
    "treemap",
    "venn",
    "ishikawa",
    "wardley",
    "treeView",
    "eventModeling",
  ];

  it("ALL_HINT_FAMILIES list has exactly 28 entries", () => {
    expect(ALL_HINT_FAMILIES).toHaveLength(28);
  });

  for (const family of ALL_HINT_FAMILIES) {
    it(`snapshot: "${family}" hint content`, () => {
      const hint = getFamilySyntaxHint(family);
      expect(hint).not.toBeNull();
      // Snapshot the full hint object so keyIdiom, classDefStatus,
      // and themingNote are all pinned in one readable snapshot block.
      expect(hint).toMatchSnapshot();
    });
  }
});
