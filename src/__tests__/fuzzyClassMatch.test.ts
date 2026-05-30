import { describe, it, expect } from "vitest";
import { levenshtein, suggestClassMatch } from "@/lib/fuzzy-class-match";

// ---------------------------------------------------------------------------
// levenshtein
// ---------------------------------------------------------------------------

describe("levenshtein — base cases", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("primary", "primary")).toBe(0);
  });

  it("returns the length of a when b is empty", () => {
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("returns the length of b when a is empty", () => {
    expect(levenshtein("", "xyz")).toBe(3);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshtein("", "")).toBe(0);
  });
});

describe("levenshtein — single-character edits", () => {
  it("single substitution: 'priamry' → 'primary' = 2 (transposition counts as 2 edits)", () => {
    expect(levenshtein("priamry", "primary")).toBe(2);
  });

  it("single substitution: 'pimary' → 'primary' = 1 (deletion)", () => {
    expect(levenshtein("pimary", "primary")).toBe(1);
  });

  it("single insertion: 'primaryy' → 'primary' = 1", () => {
    expect(levenshtein("primaryy", "primary")).toBe(1);
  });

  it("single deletion: 'rimary' → 'primary' = 1", () => {
    expect(levenshtein("rimary", "primary")).toBe(1);
  });

  it("one character off: 'secundary' → 'secondary' = 1", () => {
    expect(levenshtein("secundary", "secondary")).toBe(1);
  });
});

describe("levenshtein — known distances", () => {
  it("'kitten' → 'sitting' = 3", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });

  it("'saturday' → 'sunday' = 3", () => {
    expect(levenshtein("saturday", "sunday")).toBe(3);
  });

  it("completely different short strings have distance equal to max length", () => {
    expect(levenshtein("abc", "xyz")).toBe(3);
  });

  it("is symmetric: d(a,b) === d(b,a)", () => {
    expect(levenshtein("primary", "priamry")).toBe(levenshtein("priamry", "primary"));
  });
});

// ---------------------------------------------------------------------------
// suggestClassMatch
// ---------------------------------------------------------------------------

const DEFINED = ["primary", "secondary", "tertiary", "accent", "gate", "scope"];

describe("suggestClassMatch — no match", () => {
  it("returns empty array when defined is empty", () => {
    expect(suggestClassMatch("priamry", [])).toEqual([]);
  });

  it("returns empty array when no name is within distance 2", () => {
    expect(suggestClassMatch("zzzzz", DEFINED)).toEqual([]);
  });

  it("returns empty array for a very short name with no close match", () => {
    expect(suggestClassMatch("xy", DEFINED)).toEqual([]);
  });
});

describe("suggestClassMatch — exact or distance-1 match", () => {
  it("returns the exact match when unknown === defined name", () => {
    expect(suggestClassMatch("primary", DEFINED)).toEqual(["primary"]);
  });

  it("single insertion typo 'primaryy' → ['primary']", () => {
    expect(suggestClassMatch("primaryy", DEFINED)).toEqual(["primary"]);
  });

  it("single deletion typo 'rimary' → ['primary']", () => {
    expect(suggestClassMatch("rimary", DEFINED)).toEqual(["primary"]);
  });

  it("single substitution 'primaryX' → ['primary']", () => {
    expect(suggestClassMatch("primaryX", DEFINED)).toEqual(["primary"]);
  });

  it("'accentt' (one extra char) → ['accent']", () => {
    expect(suggestClassMatch("accentt", DEFINED)).toEqual(["accent"]);
  });
});

describe("suggestClassMatch — distance-2 match", () => {
  it("'priamry' (swap am→ma) → includes 'primary'", () => {
    const result = suggestClassMatch("priamry", DEFINED);
    expect(result).toContain("primary");
  });

  it("'seccondary' (double c) → includes 'secondary'", () => {
    const result = suggestClassMatch("seccondary", DEFINED);
    expect(result).toContain("secondary");
  });

  it("'secondry' (missing a) → includes 'secondary'", () => {
    const result = suggestClassMatch("secondry", DEFINED);
    expect(result).toContain("secondary");
  });
});

describe("suggestClassMatch — multiple candidates", () => {
  it("returns multiple suggestions when several names are equidistant", () => {
    const defined = ["cat", "bat", "hat", "rat"];
    const result = suggestClassMatch("mat", defined);
    expect(result.length).toBeGreaterThan(1);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("caps results at 3 suggestions", () => {
    const defined = ["cat", "bat", "hat", "rat", "fat", "sat"];
    const result = suggestClassMatch("mat", defined);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("sorts equal-distance candidates alphabetically", () => {
    const defined = ["zebra", "apple", "mango"];
    const result = suggestClassMatch("apzle", defined);
    if (result.length > 1) {
      const sorted = [...result].sort((a, b) => a.localeCompare(b));
      expect(result).toEqual(sorted);
    }
  });
});

describe("suggestClassMatch — only minimum-distance candidates returned", () => {
  it("only returns distance-1 matches when both distance-1 and distance-2 exist", () => {
    // "primaryy" is distance 1 from "primary", distance 2+ from "priamry_x"
    const defined = ["primary", "priamry_x"];
    const result = suggestClassMatch("primaryy", defined);
    expect(result).toContain("primary");
    expect(result).not.toContain("priamry_x");
  });

  it("falls back to distance-2 matches when no distance-1 match exists", () => {
    // "priamry" is distance 2 from "primary" (swap am→ma)
    const result = suggestClassMatch("priamry", ["primary", "zzzzz"]);
    expect(result).toContain("primary");
  });
});

describe("suggestClassMatch — real mermaid class name typos", () => {
  it("'priamry' → suggests 'primary'", () => {
    const result = suggestClassMatch("priamry", DEFINED);
    expect(result).toContain("primary");
  });

  it("'scondary' → suggests 'secondary'", () => {
    const result = suggestClassMatch("scondary", DEFINED);
    expect(result).toContain("secondary");
  });

  it("'acent' (one deletion) → suggests 'accent'", () => {
    const result = suggestClassMatch("acent", DEFINED);
    expect(result).toContain("accent");
  });

  it("'gat' (one deletion) → suggests 'gate'", () => {
    const result = suggestClassMatch("gat", DEFINED);
    expect(result).toContain("gate");
  });

  it("completely unrelated name returns no suggestions", () => {
    const result = suggestClassMatch("xyzzy", DEFINED);
    expect(result).toEqual([]);
  });
});
