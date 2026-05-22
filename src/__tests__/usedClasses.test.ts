import { describe, it, expect } from "vitest";

/**
 * Mirrors the used-class detection logic from ReferenceTab.tsx:
 *   const matches = inputCode.matchAll(/:::(\w+)/g);
 *   return new Set(Array.from(matches, (m) => m[1]));
 *
 * Tests are written against this extracted helper so they document the actual
 * regex behaviour (including edge cases) rather than testing React rendering.
 */
function extractUsedClasses(code: string): Set<string> {
  if (!code) return new Set();
  const matches = code.matchAll(/:::(\w+)/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

describe("extractUsedClasses", () => {
  it("returns empty set for empty string (early-return path)", () => {
    expect(extractUsedClasses("")).toEqual(new Set());
  });

  it("returns empty set for diagram with no ::: classes", () => {
    expect(extractUsedClasses("flowchart TD\n  A --> B\n  B --> C")).toEqual(new Set());
  });

  it("returns empty set for whitespace-only input (no early return, regex finds nothing)", () => {
    expect(extractUsedClasses("   \n  \n")).toEqual(new Set());
  });

  it("detects a single class name", () => {
    const result = extractUsedClasses("flowchart TD\n  A:::primary --> B");
    expect(result).toEqual(new Set(["primary"]));
  });

  it("detects multiple distinct class names across nodes", () => {
    const code = "flowchart TD\n  A:::primary --> B:::secondary\n  B:::secondary --> C:::accent";
    const result = extractUsedClasses(code);
    expect(result).toEqual(new Set(["primary", "secondary", "accent"]));
  });

  it("deduplicates repeated class names", () => {
    const code = "flowchart TD\n  A:::primary --> B:::primary\n  C:::primary --> D";
    const result = extractUsedClasses(code);
    expect(result).toEqual(new Set(["primary"]));
    expect(result.size).toBe(1);
  });

  it("detects class names containing underscores (\\w includes _)", () => {
    const result = extractUsedClasses("flowchart TD\n  A:::out_of_scope --> B");
    expect(result).toContain("out_of_scope");
  });

  it("detects numeric-suffix class names (\\w includes digits)", () => {
    const result = extractUsedClasses("flowchart TD\n  A:::tier1 --> B:::tier2");
    expect(result).toContain("tier1");
    expect(result).toContain("tier2");
  });

  it("stops at hyphen — only captures up to first hyphen for hyphenated names", () => {
    const result = extractUsedClasses("flowchart TD\n  A:::my-class --> B");
    expect(result).toContain("my");
    expect(result).not.toContain("my-class");
    expect(result).not.toContain("class");
  });

  it("matches class names inside comment lines (regex does not exclude %% comments)", () => {
    const code = "flowchart TD\n  %% A:::commentClass is styled\n  B --> C";
    const result = extractUsedClasses(code);
    expect(result).toContain("commentClass");
  });

  it("matches multiple ::: class references on a single line", () => {
    const code = "A:::primary:::secondary --> B:::gate";
    const result = extractUsedClasses(code);
    expect(result).toContain("primary");
    expect(result).toContain("secondary");
    expect(result).toContain("gate");
  });

  it("returns all 16 known semantic class names when all are present", () => {
    const classes = [
      "primary", "secondary", "tertiary", "platform", "boundary",
      "actor", "gate", "control", "log", "question",
      "accent", "deepBlue", "slate", "scope", "outOfScope", "redDash",
    ];
    const code = classes.map((c) => `  Node:::${c}`).join("\n");
    const result = extractUsedClasses(code);
    expect(result.size).toBe(classes.length);
    for (const c of classes) {
      expect(result).toContain(c);
    }
  });
});
