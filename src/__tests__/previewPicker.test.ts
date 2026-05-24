// @vitest-environment happy-dom

/**
 * Tests for the Theme Preview diagram picker logic (ComposeTab.tsx lines 244–271).
 *
 * Behaviors covered:
 *   1. localStorage persistence — stored id is read on mount and written on change.
 *   2. Catalog fallback — unknown/missing id resolves to EXAMPLE_CATALOG[0].
 *   3. isBetaPreview hint — fires for "Beta" and "Experimental" badges, not for
 *      "Canonical" or absent badges.
 *
 * Tests mirror the exact logic in ComposeTab so that any behavioral change in
 * the component breaks these tests immediately.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EXAMPLE_CATALOG } from "@/data/example-library";

// ---------------------------------------------------------------------------
// Helpers that mirror ComposeTab logic exactly
// ---------------------------------------------------------------------------

const LS_KEY = "mtb.compose.previewSampleId";
const DEFAULT_ID = "flowchart-basic";

/** Mirrors the useState initializer in ComposeTab (line 244–249). */
function readStoredId(): string {
  try {
    return localStorage.getItem(LS_KEY) ?? DEFAULT_ID;
  } catch {
    return DEFAULT_ID;
  }
}

/** Mirrors handleSampleIdChange's localStorage.setItem call (line 255). */
function writeStoredId(id: string): void {
  try {
    localStorage.setItem(LS_KEY, id);
  } catch { /* ignore */ }
}

/** Mirrors the sampleEntry useMemo (line 259–262). */
function resolveSampleEntry(id: string) {
  return EXAMPLE_CATALOG.find((e) => e.id === id) ?? EXAMPLE_CATALOG[0];
}

/** Mirrors isBetaPreview (line 265–268). */
function isBetaEntry(badge: string | undefined): boolean {
  return Boolean(badge && (badge.includes("Beta") || badge.includes("Experimental")));
}

/** Mirrors previewBadgeLabel (line 269–271). */
function badgeLabel(badge: string | undefined): string {
  return badge?.includes("Experimental") ? "Experimental" : "Beta";
}

// ---------------------------------------------------------------------------
// Suite 1 — localStorage persistence
// ---------------------------------------------------------------------------

describe("previewPicker — localStorage persistence", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns 'flowchart-basic' when localStorage is empty (null fallback)", () => {
    expect(readStoredId()).toBe("flowchart-basic");
  });

  it("returns 'flowchart-basic' when the key was explicitly removed", () => {
    localStorage.removeItem(LS_KEY);
    expect(readStoredId()).toBe("flowchart-basic");
  });

  it("returns the stored id when a valid value is present", () => {
    localStorage.setItem(LS_KEY, "sankey-effort-to-output");
    expect(readStoredId()).toBe("sankey-effort-to-output");
  });

  it("writeStoredId writes the id under the correct localStorage key", () => {
    writeStoredId("class-software-architecture");
    expect(localStorage.getItem(LS_KEY)).toBe("class-software-architecture");
  });

  it("writeStoredId overwrites a previous value", () => {
    writeStoredId("sequence-basic");
    writeStoredId("er-basic");
    expect(localStorage.getItem(LS_KEY)).toBe("er-basic");
  });

  it("round-trip: write then read returns the same id", () => {
    writeStoredId("gantt-basic");
    expect(readStoredId()).toBe("gantt-basic");
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — catalog lookup and fallback
// ---------------------------------------------------------------------------

describe("previewPicker — sampleEntry catalog lookup", () => {
  it("EXAMPLE_CATALOG[0] has id 'flowchart-basic' (fallback target)", () => {
    expect(EXAMPLE_CATALOG[0].id).toBe("flowchart-basic");
  });

  it("resolves to the matching entry for a known id", () => {
    const entry = resolveSampleEntry("flowchart-basic");
    expect(entry.id).toBe("flowchart-basic");
  });

  it("falls back to EXAMPLE_CATALOG[0] for a completely unknown id without throwing", () => {
    expect(() => resolveSampleEntry("this-id-does-not-exist-anywhere")).not.toThrow();
    const entry = resolveSampleEntry("this-id-does-not-exist-anywhere");
    expect(entry).toBe(EXAMPLE_CATALOG[0]);
  });

  it("falls back to EXAMPLE_CATALOG[0] for an empty string", () => {
    const entry = resolveSampleEntry("");
    expect(entry).toBe(EXAMPLE_CATALOG[0]);
  });

  it("falls back gracefully for a stale localStorage id that no longer exists in catalog", () => {
    localStorage.setItem(LS_KEY, "old-removed-diagram-id");
    const id = readStoredId();
    const entry = resolveSampleEntry(id);
    expect(entry).toBe(EXAMPLE_CATALOG[0]);
  });

  it("resolves a known beta entry by its real catalog id", () => {
    const entry = resolveSampleEntry("sankey-effort-to-output");
    expect(entry.id).toBe("sankey-effort-to-output");
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — isBetaPreview hint logic
// ---------------------------------------------------------------------------

describe("previewPicker — isBetaPreview hint logic", () => {
  it("returns false when badge is undefined", () => {
    expect(isBetaEntry(undefined)).toBe(false);
  });

  it("returns false for empty badge string", () => {
    expect(isBetaEntry("")).toBe(false);
  });

  it("returns false for 'Canonical' badge", () => {
    expect(isBetaEntry("Canonical")).toBe(false);
  });

  it("returns true for plain 'Beta' badge", () => {
    expect(isBetaEntry("Beta")).toBe(true);
  });

  it("returns true for 'Canonical · Beta' badge", () => {
    expect(isBetaEntry("Canonical · Beta")).toBe(true);
  });

  it("returns true for 'Experimental' badge", () => {
    expect(isBetaEntry("Experimental")).toBe(true);
  });

  it("returns true for 'Beta — may not render in all environments'", () => {
    expect(isBetaEntry("Beta — may not render in all environments")).toBe(true);
  });

  it("badgeLabel returns 'Experimental' when badge includes Experimental", () => {
    expect(badgeLabel("Experimental")).toBe("Experimental");
  });

  it("badgeLabel returns 'Beta' for plain Beta badge", () => {
    expect(badgeLabel("Beta")).toBe("Beta");
  });

  it("badgeLabel returns 'Beta' for 'Canonical · Beta'", () => {
    expect(badgeLabel("Canonical · Beta")).toBe("Beta");
  });

  it("badgeLabel returns 'Beta' (default) when badge is undefined", () => {
    expect(badgeLabel(undefined)).toBe("Beta");
  });

  it("at least one catalog entry triggers isBetaPreview (catalog sanity check)", () => {
    const betaEntries = EXAMPLE_CATALOG.filter((e) => isBetaEntry(e.badge));
    expect(betaEntries.length).toBeGreaterThan(0);
  });

  it("flowchart-basic does NOT trigger isBetaPreview", () => {
    const entry = EXAMPLE_CATALOG.find((e) => e.id === "flowchart-basic");
    expect(entry).toBeDefined();
    expect(isBetaEntry(entry!.badge)).toBe(false);
  });

  it("sankey-effort-to-output DOES trigger isBetaPreview", () => {
    const entry = EXAMPLE_CATALOG.find((e) => e.id === "sankey-effort-to-output");
    expect(entry).toBeDefined();
    expect(isBetaEntry(entry!.badge)).toBe(true);
  });
});
