// @vitest-environment happy-dom

/**
 * Tests for the Examples tab search logic (Task #269).
 *
 * `filterExamples` and `ALL_EXAMPLES` are the exact exports used by
 * ExamplesTab.tsx — no reimplementation, no divergence. Assertions cover the
 * full assembled list (brand palette previews, showcase, and catalog entries)
 * and all six searchable fields: label, family, badge, section, description,
 * and tags.
 */

import { describe, it, expect } from "vitest";
import { ALL_EXAMPLES, filterExamples, assertNoDuplicateIds } from "@/lib/examples-filter";
import type { ExampleItem } from "@/lib/examples-filter";
import { EXAMPLE_CATALOG } from "@/data/example-library";

describe("ExamplesTab — filterExamples (real assembled list)", () => {
  // -------------------------------------------------------------------------
  // Empty / whitespace queries — full list returned unchanged
  // -------------------------------------------------------------------------

  it("empty query returns all assembled examples", () => {
    expect(filterExamples(ALL_EXAMPLES, "")).toHaveLength(ALL_EXAMPLES.length);
  });

  it("whitespace-only query returns all assembled examples", () => {
    expect(filterExamples(ALL_EXAMPLES, "   ")).toHaveLength(ALL_EXAMPLES.length);
  });

  // -------------------------------------------------------------------------
  // Section field — "OKHP3 Brand" matches brand palette items via section
  // -------------------------------------------------------------------------

  it('searching "OKHP3 Brand" returns entries in the "OKHP3 Brand & Showcase" section (section match)', () => {
    const results = filterExamples(ALL_EXAMPLES, "OKHP3 Brand");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      expect(e.section).toBe("OKHP3 Brand & Showcase");
    });
  });

  // -------------------------------------------------------------------------
  // Badge field — "Brand" matches brand palette items via badge
  // -------------------------------------------------------------------------

  it('searching "Brand" returns entries whose badge is "Brand"', () => {
    const results = filterExamples(ALL_EXAMPLES, "Brand");
    expect(results.length).toBeGreaterThan(0);
    const badgeBrandIds = results.filter((e) => e.badge === "Brand").map((e) => e.id);
    expect(badgeBrandIds.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Description + tag search — "governance"
  // venn-governance-triangle and both Ishikawa entries carry the tag.
  // -------------------------------------------------------------------------

  it('searching "governance" returns the Venn governance-triangle entry (tag match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "governance").map((e) => e.id);
    expect(ids).toContain("venn-governance-triangle");
  });

  it('searching "governance" returns the Ishikawa render-failure entry (tag match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "governance").map((e) => e.id);
    expect(ids).toContain("ishikawa-render-failure");
  });

  it('searching "governance" returns the Ishikawa premature-rendering entry (tag + description match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "governance").map((e) => e.id);
    expect(ids).toContain("ishikawa-premature-rendering-root-cause");
  });

  it('all results for "governance" have the word in at least one searchable field', () => {
    const results = filterExamples(ALL_EXAMPLES, "governance");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      const haystack = [
        e.label,
        e.family ?? "",
        e.badge ?? "",
        e.section,
        e.description ?? "",
        ...(e.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("governance");
    });
  });

  // -------------------------------------------------------------------------
  // Tag search — "OKH"
  // All three contextual OKH catalog entries carry "OKH" in their tags.
  // -------------------------------------------------------------------------

  it('searching "OKH" returns the sequence-council-to-prototype entry (tag match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "OKH").map((e) => e.id);
    expect(ids).toContain("sequence-council-to-prototype");
  });

  it('searching "OKH" returns the gantt-mermaid-theme-builder-roadmap entry (tag match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "OKH").map((e) => e.id);
    expect(ids).toContain("gantt-mermaid-theme-builder-roadmap");
  });

  it('searching "OKH" returns the gitgraph-repo-evolution entry (tag match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "OKH").map((e) => e.id);
    expect(ids).toContain("gitgraph-repo-evolution");
  });

  it('all results for "OKH" have "okh" in at least one searchable field', () => {
    const results = filterExamples(ALL_EXAMPLES, "OKH");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      const haystack = [
        e.label,
        e.family ?? "",
        e.badge ?? "",
        e.section,
        e.description ?? "",
        ...(e.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("okh");
    });
  });

  // -------------------------------------------------------------------------
  // Label / family field search — "flowchart"
  // flowchart-basic has family: "flowchart"; brand items have family: "flowchart"
  // and section: "OKHP3 Brand".
  // -------------------------------------------------------------------------

  it('searching "flowchart" returns the flowchart-basic catalog entry (family field match)', () => {
    const ids = filterExamples(ALL_EXAMPLES, "flowchart").map((e) => e.id);
    expect(ids).toContain("flowchart-basic");
  });

  it('searching "flowchart" returns brand palette flowchart entries (family field match)', () => {
    const results = filterExamples(ALL_EXAMPLES, "flowchart");
    const brandFlowIds = results.filter((e) => e.id.startsWith("brand-") && e.id.endsWith("-flow"));
    expect(brandFlowIds.length).toBeGreaterThan(0);
  });

  it('all results for "flowchart" have the word in at least one searchable field', () => {
    const results = filterExamples(ALL_EXAMPLES, "flowchart");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      const haystack = [
        e.label,
        e.family ?? "",
        e.badge ?? "",
        e.section,
        e.description ?? "",
        ...(e.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("flowchart");
    });
  });

  // -------------------------------------------------------------------------
  // Case-insensitivity
  // -------------------------------------------------------------------------

  it('search is case-insensitive: "GOVERNANCE" and "governance" return the same results', () => {
    const lower = filterExamples(ALL_EXAMPLES, "governance").map((e) => e.id);
    const upper = filterExamples(ALL_EXAMPLES, "GOVERNANCE").map((e) => e.id);
    expect(lower.sort()).toEqual(upper.sort());
  });

  it('search is case-insensitive: "okh" and "OKH" return the same results', () => {
    const lower = filterExamples(ALL_EXAMPLES, "okh").map((e) => e.id);
    const upper = filterExamples(ALL_EXAMPLES, "OKH").map((e) => e.id);
    expect(lower.sort()).toEqual(upper.sort());
  });

  // -------------------------------------------------------------------------
  // No false positives
  // -------------------------------------------------------------------------

  it("a query with no matching entries returns an empty array", () => {
    expect(filterExamples(ALL_EXAMPLES, "xyzzy-not-a-real-term-9q4k7")).toHaveLength(0);
  });
});

// =============================================================================
// EXAMPLE_CATALOG — data-integrity tests (Task #346)
//
// These tests assert directly on the catalog *data*, not on the filter logic.
// They ensure that high-value entries retain the populated description and tags
// fields that make search useful.  If an entry is accidentally cleared or
// renamed during a future catalog edit the filter tests above would still pass
// (the logic is correct) but these tests would immediately flag the regression.
// =============================================================================

describe("EXAMPLE_CATALOG — data integrity", () => {
  // Build a lookup map once for all entry-specific assertions.
  const byId = new Map(EXAMPLE_CATALOG.map((e) => [e.id, e]));

  // ---------------------------------------------------------------------------
  // Helper: assert a named entry has non-empty description AND non-empty tags.
  // ---------------------------------------------------------------------------
  function assertHasDescriptionAndTags(id: string): void {
    const entry = byId.get(id);
    expect(entry, `entry "${id}" must exist in EXAMPLE_CATALOG`).toBeDefined();
    expect(
      entry!.description?.trim(),
      `entry "${id}" must have a non-empty description`
    ).toBeTruthy();
    expect(entry!.tags, `entry "${id}" must have a tags array`).toBeDefined();
    expect(entry!.tags!.length, `entry "${id}" must have at least one tag`).toBeGreaterThan(0);
  }

  // ---------------------------------------------------------------------------
  // Named high-value entries — explicitly guarded
  // ---------------------------------------------------------------------------

  it("venn-governance-triangle has a non-empty description and tags", () => {
    assertHasDescriptionAndTags("venn-governance-triangle");
  });

  it("ishikawa-render-failure has a non-empty description and tags", () => {
    assertHasDescriptionAndTags("ishikawa-render-failure");
  });

  it("sequence-council-to-prototype has a non-empty description and tags", () => {
    assertHasDescriptionAndTags("sequence-council-to-prototype");
  });

  it("gantt-mermaid-theme-builder-roadmap has a non-empty description and tags", () => {
    assertHasDescriptionAndTags("gantt-mermaid-theme-builder-roadmap");
  });

  it("gitgraph-repo-evolution has a non-empty description and tags", () => {
    assertHasDescriptionAndTags("gitgraph-repo-evolution");
  });

  // ---------------------------------------------------------------------------
  // Count guard — catches accidental bulk deletion of searchable metadata
  //
  // At the time this test was written there were 30 catalog entries with both
  // a non-empty description and at least one tag.  The floor of 25 catches any
  // batch deletion (≥ 5 entries cleared) while tolerating deliberate small
  // pruning without requiring an immediate test update.
  // ---------------------------------------------------------------------------

  it("at least 25 EXAMPLE_CATALOG entries have both a non-empty description and at least one tag", () => {
    const enriched = EXAMPLE_CATALOG.filter(
      (e) =>
        e.description !== undefined &&
        e.description.trim().length > 0 &&
        e.tags !== undefined &&
        e.tags.length > 0
    );
    expect(
      enriched.length,
      `expected ≥ 25 enriched catalog entries, found ${enriched.length}`
    ).toBeGreaterThanOrEqual(25);
  });

  // ---------------------------------------------------------------------------
  // ID uniqueness guard (Task #433)
  //
  // A duplicate id causes the byId lookup map above (and the same map built in
  // ExamplesTab.tsx) to silently drop the earlier entry — last writer wins.
  // This test catches that regression before it reaches the UI.
  // ---------------------------------------------------------------------------

  it("every EXAMPLE_CATALOG entry has a non-empty string id", () => {
    EXAMPLE_CATALOG.forEach((entry, index) => {
      expect(
        typeof entry.id === "string" && entry.id.trim().length > 0,
        `entry at index ${index} has a blank or missing id (found: ${JSON.stringify(entry.id)})`
      ).toBe(true);
    });
  });

  it("every EXAMPLE_CATALOG id is unique — no duplicates", () => {
    const ids = EXAMPLE_CATALOG.map((e) => e.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(
      duplicates,
      `duplicate ids found in EXAMPLE_CATALOG: ${duplicates.join(", ")}`
    ).toHaveLength(0);
  });

  it("ALL_EXAMPLES assembled list has no duplicate ids across all sources", () => {
    const ids = ALL_EXAMPLES.map((e) => e.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(
      duplicates,
      `duplicate ids found across assembled ALL_EXAMPLES (catalog + brand previews + showcase): ${duplicates.join(", ")}`
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// assertNoDuplicateIds — runtime guard unit tests
// ---------------------------------------------------------------------------

function makeItem(id: string): ExampleItem {
  return { id, label: id, content: "graph LR\n  A-->B", section: "Test" };
}

describe("assertNoDuplicateIds — duplicate-ID runtime guard", () => {
  it("does not throw when all ids are unique", () => {
    const items = [makeItem("alpha"), makeItem("beta"), makeItem("gamma")];
    expect(() => assertNoDuplicateIds(items)).not.toThrow();
  });

  it("throws when a single id is duplicated", () => {
    const items = [makeItem("foo"), makeItem("bar"), makeItem("foo")];
    expect(() => assertNoDuplicateIds(items)).toThrow(/foo/);
  });

  it("error message names every duplicated id", () => {
    const items = [
      makeItem("alpha"),
      makeItem("beta"),
      makeItem("alpha"),
      makeItem("beta"),
      makeItem("gamma"),
    ];
    let message = "";
    try {
      assertNoDuplicateIds(items);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/alpha/);
    expect(message).toMatch(/beta/);
    expect(message).not.toMatch(/gamma/);
  });

  it("does not throw for an empty list", () => {
    expect(() => assertNoDuplicateIds([])).not.toThrow();
  });

  it("does not throw for a single-item list", () => {
    expect(() => assertNoDuplicateIds([makeItem("only")])).not.toThrow();
  });
});
