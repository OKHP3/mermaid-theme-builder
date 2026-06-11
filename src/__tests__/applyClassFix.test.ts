import { describe, it, expect } from "vitest";
import { applyClassFix } from "@/lib/used-classes";

/**
 * Unit tests for applyClassFix — the pure utility that replaces a misspelled
 * :::token with the correct one in a diagram source string.
 *
 * Key contract: replacement is token-exact (word-boundary regex) so tokens
 * that share a common prefix are never corrupted.
 */

describe("applyClassFix — basic replacement", () => {
  it("replaces a single typo token", () => {
    expect(applyClassFix("A:::prmary --> B", "prmary", "primary")).toBe("A:::primary --> B");
  });

  it("replaces all occurrences of the typo token", () => {
    const code = "A:::prmary --> B:::prmary --> C";
    expect(applyClassFix(code, "prmary", "primary")).toBe("A:::primary --> B:::primary --> C");
  });

  it("returns the original string unchanged when typo is not present", () => {
    const code = "A:::primary --> B";
    expect(applyClassFix(code, "prmary", "primary")).toBe(code);
  });

  it("returns the original string unchanged when the code is empty", () => {
    expect(applyClassFix("", "prmary", "primary")).toBe("");
  });
});

describe("applyClassFix — word-boundary safety (prefix isolation)", () => {
  it("does NOT replace :::primary when the typo is :::prim", () => {
    const code = "A:::prim --> B:::primary --> C";
    const result = applyClassFix(code, "prim", "primary");
    // :::prim (exact) must become :::primary; :::primary must stay :::primary
    expect(result).toBe("A:::primary --> B:::primary --> C");
  });

  it("does NOT corrupt :::primaryColor when typo is :::primary", () => {
    const code = "A:::primary --> B:::primaryColor --> C";
    const result = applyClassFix(code, "primary", "accent");
    // :::primary (exact token) becomes :::accent; :::primaryColor is untouched
    expect(result).toBe("A:::accent --> B:::primaryColor --> C");
  });

  it("does NOT replace a token that only contains the typo as a suffix", () => {
    // :::notprimary has 'primary' as suffix — should be unchanged
    const code = "A:::notprimary --> B:::primary --> C";
    const result = applyClassFix(code, "primary", "accent");
    expect(result).toBe("A:::notprimary --> B:::accent --> C");
  });
});

describe("applyClassFix — multiline diagram source", () => {
  it("replaces tokens across multiple lines", () => {
    const code = ["flowchart LR", "  A:::prmary --> B", "  C:::prmary --> D:::secondary"].join(
      "\n"
    );

    const result = applyClassFix(code, "prmary", "primary");
    expect(result).toBe(
      ["flowchart LR", "  A:::primary --> B", "  C:::primary --> D:::secondary"].join("\n")
    );
  });

  it("does not touch other tokens on the same line as the typo", () => {
    const code = "A:::prmary --> B:::secondary --> C:::prmary";
    const result = applyClassFix(code, "prmary", "primary");
    expect(result).toBe("A:::primary --> B:::secondary --> C:::primary");
  });
});

describe("applyClassFix — regex special characters in typo", () => {
  it("handles typo strings that contain regex metacharacters without throwing", () => {
    // A typo like "prim.ary" could blow up an unescaped regex
    const code = "A:::prim.ary --> B";
    // The dot is escaped so it matches a literal '.' — no token named 'prim.ary'
    // exists in practice, but the function must not throw.
    expect(() => applyClassFix(code, "prim.ary", "primary")).not.toThrow();
  });
});
