import { describe, it, expect } from "vitest";
import { detectDiagram } from "@/lib/detector";
import { EXAMPLE_CATALOG } from "@/data/example-library";
import type { DiagramFamily } from "@/data/mermaid-capabilities";

// EXAMPLE_CATALOG uses a set of shorthand family strings that differ from the
// canonical DiagramFamily values returned by detectDiagram().  This map
// normalizes the catalog string to the DiagramFamily value the detector emits.
const CATALOG_TO_DIAGRAM_FAMILY: Record<string, DiagramFamily> = {
  // shorthand → DiagramFamily
  sequence: "sequenceDiagram",
  class: "classDiagram",
  er: "erDiagram",
  state: "stateDiagram",
  requirement: "requirementDiagram",
  quadrant: "quadrantChart",
  gitgraph: "gitGraph",
  c4: "c4Diagram",
};

function expectedFamily(catalogFamily: string): DiagramFamily {
  return (CATALOG_TO_DIAGRAM_FAMILY[catalogFamily] ?? catalogFamily) as DiagramFamily;
}

// Entries whose content is legitimately undetectable at parse time are listed
// here with a reason.  Keep this list minimal — every addition is a gap in
// detection coverage.
const KNOWN_UNDETECTABLE = new Set<string>([
  // none currently — all catalog entries start with a recognized keyword
]);

describe("EXAMPLE_CATALOG — every entry detects to its declared family", () => {
  const detectable = EXAMPLE_CATALOG.filter(
    (e) => e.family && e.family !== "unknown" && !KNOWN_UNDETECTABLE.has(e.id)
  );

  it("has entries to test", () => {
    expect(detectable.length).toBeGreaterThan(0);
  });

  for (const entry of detectable) {
    const expected = expectedFamily(entry.family);
    it(`${entry.id} (family: ${entry.family}) detects as ${expected}`, () => {
      const result = detectDiagram(entry.content);
      expect(
        result.family,
        `Entry "${entry.id}" — expected detectDiagram to return "${expected}" but got "${result.family}". Check that the content starts with the correct diagram keyword.`
      ).toBe(expected);
    });
  }
});
