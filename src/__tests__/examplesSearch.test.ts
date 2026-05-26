// @vitest-environment happy-dom

/**
 * Tests for the filteredExamples search logic in ExamplesTab (Task #269).
 *
 * ExamplesTab builds ALL_EXAMPLES by merging brand/showcase items with
 * EXAMPLE_CATALOG entries. Descriptions and tags live on ExampleEntry objects
 * in EXAMPLE_CATALOG; brand and showcase items carry no descriptions or tags.
 * Tests therefore run directly against EXAMPLE_CATALOG, applying the same
 * filter predicate ExamplesTab uses (label | family | badge | description | tags).
 *
 * `section` is intentionally excluded from the local filter: it is synthesised
 * at runtime from EXAMPLE_GROUPS label (not stored on ExampleEntry), and none
 * of the tested queries match any group label anyway.
 */

import { describe, it, expect } from "vitest";
import { EXAMPLE_CATALOG, type ExampleEntry } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Mirror of the filteredExamples predicate from ExamplesTab.tsx (lines ~173-183)
// ---------------------------------------------------------------------------

/**
 * Applies the same filter predicate used by ExamplesTab's filteredExamples
 * useMemo, restricted to the five fields that live on ExampleEntry.
 */
function filterCatalog(entries: ExampleEntry[], query: string): ExampleEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      (e.family ?? "").toLowerCase().includes(q) ||
      (e.badge ?? "").toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q) ||
      (e.tags ?? []).some((t) => t.toLowerCase().includes(q))
  );
}

/** Collect every searchable field of an entry into one lowercased string. */
function haystack(e: ExampleEntry): string {
  return [e.label, e.family ?? "", e.badge ?? "", e.description ?? "", ...(e.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ExamplesTab — filteredExamples search logic", () => {
  // -------------------------------------------------------------------------
  // Empty / whitespace queries — must return the full catalog
  // -------------------------------------------------------------------------

  it("empty query returns all catalog entries", () => {
    expect(filterCatalog(EXAMPLE_CATALOG, "")).toHaveLength(EXAMPLE_CATALOG.length);
  });

  it("whitespace-only query returns all catalog entries", () => {
    expect(filterCatalog(EXAMPLE_CATALOG, "   ")).toHaveLength(EXAMPLE_CATALOG.length);
  });

  // -------------------------------------------------------------------------
  // Description + tag search — "governance"
  // Venn and Ishikawa entries both carry "governance" in their tags.
  // The Ishikawa premature-rendering entry also has it in its description.
  // -------------------------------------------------------------------------

  it('searching "governance" returns the Venn governance-triangle entry (tag match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "governance").map((e) => e.id);
    expect(ids).toContain("venn-governance-triangle");
  });

  it('searching "governance" returns the Ishikawa render-failure entry (tag match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "governance").map((e) => e.id);
    expect(ids).toContain("ishikawa-render-failure");
  });

  it('searching "governance" returns the Ishikawa premature-rendering entry (tag + description match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "governance").map((e) => e.id);
    expect(ids).toContain("ishikawa-premature-rendering-root-cause");
  });

  it('all results for "governance" have the word in at least one searchable field', () => {
    const results = filterCatalog(EXAMPLE_CATALOG, "governance");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      expect(haystack(e)).toContain("governance");
    });
  });

  // -------------------------------------------------------------------------
  // Tag search — "OKH"
  // All three contextual OKH examples carry "OKH" in their tags array.
  // -------------------------------------------------------------------------

  it('searching "OKH" returns the sequence-council-to-prototype entry (tag match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "OKH").map((e) => e.id);
    expect(ids).toContain("sequence-council-to-prototype");
  });

  it('searching "OKH" returns the gantt-mermaid-theme-builder-roadmap entry (tag match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "OKH").map((e) => e.id);
    expect(ids).toContain("gantt-mermaid-theme-builder-roadmap");
  });

  it('searching "OKH" returns the gitgraph-repo-evolution entry (tag match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "OKH").map((e) => e.id);
    expect(ids).toContain("gitgraph-repo-evolution");
  });

  it('all results for "OKH" have "okh" in at least one searchable field', () => {
    const results = filterCatalog(EXAMPLE_CATALOG, "OKH");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      expect(haystack(e)).toContain("okh");
    });
  });

  // -------------------------------------------------------------------------
  // Label / family field search — "flowchart"
  // flowchart-basic has family: "flowchart"; search hits via the family field.
  // -------------------------------------------------------------------------

  it('searching "flowchart" returns the flowchart-basic entry (family field match)', () => {
    const ids = filterCatalog(EXAMPLE_CATALOG, "flowchart").map((e) => e.id);
    expect(ids).toContain("flowchart-basic");
  });

  it('all results for "flowchart" have the word in at least one searchable field', () => {
    const results = filterCatalog(EXAMPLE_CATALOG, "flowchart");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      expect(haystack(e)).toContain("flowchart");
    });
  });

  // -------------------------------------------------------------------------
  // Case-insensitivity — "GOVERNANCE" and "governance" must return the same set
  // -------------------------------------------------------------------------

  it('search is case-insensitive: "GOVERNANCE" and "governance" return the same results', () => {
    const lower = filterCatalog(EXAMPLE_CATALOG, "governance").map((e) => e.id);
    const upper = filterCatalog(EXAMPLE_CATALOG, "GOVERNANCE").map((e) => e.id);
    expect(lower.sort()).toEqual(upper.sort());
  });

  it('search is case-insensitive: "okh" and "OKH" return the same results', () => {
    const lower = filterCatalog(EXAMPLE_CATALOG, "okh").map((e) => e.id);
    const upper = filterCatalog(EXAMPLE_CATALOG, "OKH").map((e) => e.id);
    expect(lower.sort()).toEqual(upper.sort());
  });

  // -------------------------------------------------------------------------
  // No false positives — a term that matches nothing returns empty
  // -------------------------------------------------------------------------

  it("a query with no matching entries returns an empty array", () => {
    const results = filterCatalog(EXAMPLE_CATALOG, "xyzzy-not-a-real-term-9q4k7");
    expect(results).toHaveLength(0);
  });
});
