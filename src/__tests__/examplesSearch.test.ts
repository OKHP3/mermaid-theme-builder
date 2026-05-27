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
import { ALL_EXAMPLES, filterExamples } from "@/lib/examples-filter";

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

  it('searching "OKHP3 Brand" returns all brand palette entries (section match)', () => {
    const results = filterExamples(ALL_EXAMPLES, "OKHP3 Brand");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((e) => {
      expect(e.section).toBe("OKHP3 Brand");
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
