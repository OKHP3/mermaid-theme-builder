/**
 * Dedicated unit tests for src/lib/syntax-highlight.tsx — the canonical
 * single source of truth for all syntax-highlight color constants and
 * pure highlight functions.
 *
 * Imports are made directly from @/lib/syntax-highlight (not from
 * HighlightedCode or ClassBrowser re-exports) so that coverage is explicit
 * and re-export gaps are caught early.
 *
 * Covers:
 *   - HL, INIT_HL, COMMENT_HL — exact color values (authoritative palette)
 *   - highlightPropsSegment    — key/hex/value/punct coloring
 *   - highlightClassDefLine    — standard format + non-standard fallback
 *   - highlightClassDefBlock   — multi-line dispatch
 *   - highlightInitDirectiveLine — bracket/content split + malformed fallback
 *   - highlightCommentLine     — color + italic + text preservation
 *   - highlightMermaidCodeLine — dispatcher round-trips for all four routes
 *   - highlightMermaidCodeBlock — wraps dispatcher over a full block
 */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  HL,
  INIT_HL,
  COMMENT_HL,
  highlightPropsSegment,
  highlightClassDefLine,
  highlightClassDefBlock,
  highlightInitDirectiveLine,
  highlightCommentLine,
  highlightMermaidCodeLine,
  highlightMermaidCodeBlock,
} from "@/lib/syntax-highlight";

/** Render a ReactNode to an HTML string for assertion. */
function hl(node: import("react").ReactNode): string {
  return renderToString(createElement("span", null, node));
}

// ===========================================================================
// Color constant objects — exact values (authoritative palette reference)
// ===========================================================================

describe("HL — classDef color constants", () => {
  it("HL.keyword is rust-orange #c46a2c", () => {
    expect(HL.keyword).toBe("#c46a2c");
  });

  it("HL.name is bright cream #e8d9c0", () => {
    expect(HL.name).toBe("#e8d9c0");
  });

  it("HL.key is forge teal #5fa89a", () => {
    expect(HL.key).toBe("#5fa89a");
  });

  it("HL.hex is sky blue #9ecfe8", () => {
    expect(HL.hex).toBe("#9ecfe8");
  });

  it("HL.value is warm beige #c8b89a", () => {
    expect(HL.value).toBe("#c8b89a");
  });

  it("HL.punct is dimmed #7a7060", () => {
    expect(HL.punct).toBe("#7a7060");
  });

  it("all six HL keys are distinct colors", () => {
    const vals = Object.values(HL);
    expect(new Set(vals).size).toBe(vals.length);
  });
});

describe("INIT_HL — init directive color constants", () => {
  it("INIT_HL.bracket is warm amber #c8a870", () => {
    expect(INIT_HL.bracket).toBe("#c8a870");
  });

  it("INIT_HL.content is muted teal-gray #8da89a", () => {
    expect(INIT_HL.content).toBe("#8da89a");
  });

  it("bracket and content are distinct", () => {
    expect(INIT_HL.bracket).not.toBe(INIT_HL.content);
  });

  it("neither INIT_HL color collides with HL.keyword", () => {
    expect(INIT_HL.bracket).not.toBe(HL.keyword);
    expect(INIT_HL.content).not.toBe(HL.keyword);
  });
});

describe("COMMENT_HL — comment line color constants", () => {
  it("COMMENT_HL.text is dimmed warm gray #7a7568", () => {
    expect(COMMENT_HL.text).toBe("#7a7568");
  });

  it("comment color does not collide with INIT_HL.bracket", () => {
    expect(COMMENT_HL.text).not.toBe(INIT_HL.bracket);
  });

  it("comment color does not collide with HL.keyword", () => {
    expect(COMMENT_HL.text).not.toBe(HL.keyword);
  });
});

// ===========================================================================
// highlightPropsSegment
// ===========================================================================

describe("highlightPropsSegment — hex value coloring", () => {
  it("applies HL.hex color to a hex color value", () => {
    const html = hl(highlightPropsSegment("fill:#1e3a5f", "t"));
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#1e3a5f");
  });

  it("applies HL.key color to the property key", () => {
    const html = hl(highlightPropsSegment("fill:#1e3a5f", "t"));
    expect(html).toContain(`color:${HL.key}`);
    expect(html).toContain("fill");
  });

  it("applies HL.punct color to the colon separator", () => {
    const html = hl(highlightPropsSegment("fill:#1e3a5f", "t"));
    expect(html).toContain(`color:${HL.punct}`);
  });
});

describe("highlightPropsSegment — non-hex value coloring", () => {
  it("applies HL.value (not HL.hex) to a non-hex value like 'bold'", () => {
    const html = hl(highlightPropsSegment("font-weight:bold", "t"));
    expect(html).toContain(`color:${HL.value}`);
    expect(html).not.toContain(`color:${HL.hex}`);
  });

  it("applies HL.value to a pixel value like '2px'", () => {
    const html = hl(highlightPropsSegment("stroke-width:2px", "t"));
    expect(html).toContain(`color:${HL.value}`);
  });
});

describe("highlightPropsSegment — multi-property segment", () => {
  it("handles multiple key:value pairs in one segment", () => {
    const html = hl(highlightPropsSegment("fill:#1e3a5f,stroke:#3b82f6,color:#ffffff", "t"));
    expect(html).toContain("fill");
    expect(html).toContain("stroke");
    expect(html).toContain("color");
    expect(html).toContain("#1e3a5f");
    expect(html).toContain("#3b82f6");
    expect(html).toContain("#ffffff");
  });

  it("returns a non-empty nodes array for a valid segment", () => {
    const nodes = highlightPropsSegment("fill:#abc", "t");
    expect(nodes.length).toBeGreaterThan(0);
  });
});

describe("highlightPropsSegment — empty input", () => {
  it("returns an empty array for an empty string", () => {
    expect(highlightPropsSegment("", "t")).toHaveLength(0);
  });
});

// ===========================================================================
// highlightClassDefLine
// ===========================================================================

describe("highlightClassDefLine — standard classDef format", () => {
  it("applies HL.keyword color to the 'classDef' keyword", () => {
    const html = hl(highlightClassDefLine("classDef primary fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.keyword}`);
    expect(html).toContain("classDef");
  });

  it("applies HL.name color to the class name", () => {
    const html = hl(highlightClassDefLine("classDef primary fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.name}`);
    expect(html).toContain("primary");
  });

  it("applies HL.hex color to the hex property value", () => {
    const html = hl(highlightClassDefLine("classDef primary fill:#1e3a5f", 0));
    expect(html).toContain(`color:${HL.hex}`);
    expect(html).toContain("#1e3a5f");
  });

  it("does not apply INIT_HL colors to a classDef line", () => {
    const html = hl(highlightClassDefLine("classDef primary fill:#1e3a5f", 0));
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
    expect(html).not.toContain(`color:${INIT_HL.content}`);
  });
});

describe("highlightClassDefLine — non-standard input fallback", () => {
  it("renders a non-standard line without throwing", () => {
    expect(() => hl(highlightClassDefLine("not-a-classdef-line", 0))).not.toThrow();
  });

  it("renders a non-standard line in dimmed punct color", () => {
    const html = hl(highlightClassDefLine("not-a-classdef-line", 0));
    expect(html).toContain(`color:${HL.punct}`);
  });

  it("renders an empty string without throwing", () => {
    expect(() => hl(highlightClassDefLine("", 0))).not.toThrow();
  });
});

// ===========================================================================
// highlightClassDefBlock
// ===========================================================================

describe("highlightClassDefBlock — multi-line block", () => {
  const block = "classDef primary fill:#1e3a5f\nclassDef secondary fill:#374151";

  it("renders without throwing", () => {
    expect(() => hl(highlightClassDefBlock(block))).not.toThrow();
  });

  it("applies HL.keyword color for both classDef lines", () => {
    const html = hl(highlightClassDefBlock(block));
    const count = (html.match(new RegExp(`color:${HL.keyword}`, "g")) ?? []).length;
    expect(count).toBe(2);
  });

  it("preserves a newline separator between two lines", () => {
    const html = hl(highlightClassDefBlock(block));
    expect((html.match(/\n/g) ?? []).length).toBe(1);
  });

  it("single-line block produces no trailing newline", () => {
    const html = hl(highlightClassDefBlock("classDef a fill:#111"));
    expect(html).not.toContain("\n");
  });
});

// ===========================================================================
// highlightInitDirectiveLine
// ===========================================================================

describe("highlightInitDirectiveLine — well-formed directive", () => {
  const line = `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f"}}}%%`;

  it("renders without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine(line, 0))).not.toThrow();
  });

  it("applies INIT_HL.bracket to %%{ and }%%", () => {
    const html = hl(highlightInitDirectiveLine(line, 0));
    const count = (html.match(new RegExp(`color:${INIT_HL.bracket}`, "g")) ?? []).length;
    expect(count).toBe(2);
  });

  it("applies INIT_HL.content to the directive body", () => {
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.content}`);
  });

  it("does not apply HL.keyword to an init directive line", () => {
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).not.toContain(`color:${HL.keyword}`);
  });

  it("preserves the init keyword text in the body", () => {
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).toContain("init:");
  });
});

describe("highlightInitDirectiveLine — malformed fallback", () => {
  it("falls back to bracket color for a line with no closing }%%", () => {
    const html = hl(highlightInitDirectiveLine("%%{init: {incomplete", 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });

  it("renders an empty string without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine("", 0))).not.toThrow();
  });

  it("renders a bare %%{ without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine("%%{", 0))).not.toThrow();
  });
});

// ===========================================================================
// highlightCommentLine
// ===========================================================================

describe("highlightCommentLine — color and style", () => {
  it("applies COMMENT_HL.text color", () => {
    const html = hl(highlightCommentLine("%% section label", 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("applies font-style:italic", () => {
    const html = hl(highlightCommentLine("%% section label", 0));
    expect(html).toContain("font-style:italic");
  });

  it("does not apply INIT_HL.bracket color", () => {
    const html = hl(highlightCommentLine("%% authored by Jamie", 0));
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
  });

  it("does not apply HL.keyword color", () => {
    const html = hl(highlightCommentLine("%% metadata", 0));
    expect(html).not.toContain(`color:${HL.keyword}`);
  });
});

describe("highlightCommentLine — text preservation", () => {
  it("preserves the full comment text", () => {
    const html = hl(highlightCommentLine("%% section: top-level flow", 0));
    expect(html).toContain("%% section: top-level flow");
  });

  it("preserves an empty-body comment", () => {
    const html = hl(highlightCommentLine("%%", 0));
    expect(html).toContain("%%");
  });

  it("renders without throwing on an empty string", () => {
    expect(() => hl(highlightCommentLine("", 0))).not.toThrow();
  });
});

// ===========================================================================
// highlightMermaidCodeLine — dispatcher round-trips
// ===========================================================================

describe("highlightMermaidCodeLine — round-trip: %%{init}%% route", () => {
  const line = `%%{init: {"theme": "base"}}%%`;

  it("produces the same HTML as highlightInitDirectiveLine for a %%{ line", () => {
    expect(hl(highlightMermaidCodeLine(line, 0))).toBe(hl(highlightInitDirectiveLine(line, 0)));
  });

  it("applies INIT_HL.bracket (not COMMENT_HL.text) to %%{init}%% lines", () => {
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });
});

describe("highlightMermaidCodeLine — round-trip: %% comment route", () => {
  const line = "%% section: entry points";

  it("produces the same HTML as highlightCommentLine for a %% line", () => {
    expect(hl(highlightMermaidCodeLine(line, 0))).toBe(hl(highlightCommentLine(line, 0)));
  });

  it("applies COMMENT_HL.text (not INIT_HL.bracket) to %% comment lines", () => {
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
  });
});

describe("highlightMermaidCodeLine — round-trip: classDef route", () => {
  const line = "classDef primary fill:#1e3a5f,stroke:#3b82f6";

  it("produces the same HTML as highlightClassDefLine for a classDef line", () => {
    expect(hl(highlightMermaidCodeLine(line, 0))).toBe(hl(highlightClassDefLine(line, 0)));
  });

  it("applies HL.keyword (not INIT_HL or COMMENT_HL) to classDef lines", () => {
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${HL.keyword}`);
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });
});

describe("highlightMermaidCodeLine — round-trip: plain diagram line route", () => {
  const line = "flowchart TD";

  it("renders plain diagram text without any highlight colors", () => {
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain("flowchart TD");
    expect(html).not.toContain(`color:${HL.keyword}`);
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });
});

describe("highlightMermaidCodeLine — routing boundary: %%{ vs %% comment", () => {
  it("does NOT route %%{ lines to the comment handler", () => {
    const html = hl(highlightMermaidCodeLine(`%%{init: {"theme": "base"}}%%`, 0));
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });

  it("does NOT route %% comment lines to the init handler", () => {
    const html = hl(highlightMermaidCodeLine("%% plain comment", 0));
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
  });

  it("routes 'classDefSomething' (no trailing space) as a plain line", () => {
    const html = hl(highlightMermaidCodeLine("classDefSomething fill:#ff0000", 0));
    expect(html).not.toContain(`color:${HL.keyword}`);
  });
});

// ===========================================================================
// highlightMermaidCodeBlock — full block
// ===========================================================================

describe("highlightMermaidCodeBlock — multi-line block with all four line types", () => {
  const block = [
    `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f"}}}%%`,
    "%% section: entry points",
    "flowchart TD",
    "  A[Start] --> B[End]",
    "classDef primary fill:#1e3a5f,stroke:#3b82f6",
  ].join("\n");

  it("renders without throwing", () => {
    expect(() => hl(highlightMermaidCodeBlock(block))).not.toThrow();
  });

  it("applies INIT_HL.bracket for the %%{init}%% line", () => {
    expect(hl(highlightMermaidCodeBlock(block))).toContain(`color:${INIT_HL.bracket}`);
  });

  it("applies COMMENT_HL.text for the %% comment line", () => {
    expect(hl(highlightMermaidCodeBlock(block))).toContain(`color:${COMMENT_HL.text}`);
  });

  it("applies HL.keyword for the classDef line", () => {
    expect(hl(highlightMermaidCodeBlock(block))).toContain(`color:${HL.keyword}`);
  });

  it("preserves plain diagram lines", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("flowchart TD");
    expect(html).toContain("A[Start]");
  });

  it("produces 4 newline separators for a 5-line block", () => {
    const count = (hl(highlightMermaidCodeBlock(block)).match(/\n/g) ?? []).length;
    expect(count).toBe(4);
  });
});

describe("highlightMermaidCodeBlock — edge cases", () => {
  it("handles an empty string without throwing", () => {
    expect(() => hl(highlightMermaidCodeBlock(""))).not.toThrow();
  });

  it("handles a single-line block with no trailing newline", () => {
    const html = hl(highlightMermaidCodeBlock("flowchart TD"));
    expect(html).not.toContain("\n");
    expect(html).toContain("flowchart TD");
  });

  it("a 4-line block produces 3 newline separators", () => {
    const lines = [
      `%%{init: {"theme": "base"}}%%`,
      "%% comment",
      "classDef a fill:#111",
      "  A --> B",
    ];
    const html = hl(highlightMermaidCodeBlock(lines.join("\n")));
    expect((html.match(/\n/g) ?? []).length).toBe(3);
  });
});

// ===========================================================================
// Mutation-style wiring tests — assert that each constant is assigned to the
// correct span by position, not merely that it "appears somewhere".
//
// These catch transpositions such as INIT_HL.bracket ↔ INIT_HL.content or
// HL.keyword ↔ HL.name that all previous tests would miss.
//
// Strategy: render to HTML, extract the ordered sequence of inline color
// values via /color:([^;"]+)/g, then assert each position individually.
// ===========================================================================

/** Extract all inline color values from an HTML string in document order. */
function extractColors(html: string): string[] {
  return [...html.matchAll(/color:([^;"]+)/g)].map((m) => m[1]);
}

/**
 * Assert that the color span at `index` in `html` equals `expectedColor`.
 *
 * The `tokenLabel` is embedded in the failure message so a failing test
 * immediately says *which token* was wrong rather than just showing a raw
 * hex code and an index.
 *
 * @example
 * expectSpanColor(html, 0, INIT_HL.bracket, "%%{ opener");
 * // On failure: "span[0] (%%{ opener): expected '#c8a870' toEqual '#8da89a'"
 */
function expectSpanColor(
  html: string,
  index: number,
  expectedColor: string,
  tokenLabel: string
): void {
  const colors = extractColors(html);
  expect(colors[index], `span[${index}] (${tokenLabel})`).toBe(expectedColor);
}

describe("highlightInitDirectiveLine — bracket vs content assignment", () => {
  const LINE = `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f"}}}%%`;

  it("the first color span (%%{ opener) uses INIT_HL.bracket", () => {
    const html = hl(highlightInitDirectiveLine(LINE, 0));
    expectSpanColor(html, 0, INIT_HL.bracket, "%%{ opener");
  });

  it("the second color span (directive body) uses INIT_HL.content, not INIT_HL.bracket", () => {
    const html = hl(highlightInitDirectiveLine(LINE, 0));
    expectSpanColor(html, 1, INIT_HL.content, "directive body");
    expect(extractColors(html)[1]).not.toBe(INIT_HL.bracket);
  });

  it("the third color span (}%% closer) uses INIT_HL.bracket, not INIT_HL.content", () => {
    const html = hl(highlightInitDirectiveLine(LINE, 0));
    expectSpanColor(html, 2, INIT_HL.bracket, "}%% closer");
    expect(extractColors(html)[2]).not.toBe(INIT_HL.content);
  });

  it("exactly three color spans are emitted for a well-formed directive", () => {
    const colors = extractColors(hl(highlightInitDirectiveLine(LINE, 0)));
    expect(colors).toHaveLength(3);
  });
});

describe("highlightClassDefLine — keyword vs name assignment", () => {
  const LINE = "classDef primary fill:#1e3a5f,stroke:#3b82f6";

  it("the first color span ('classDef' word) uses HL.keyword", () => {
    const html = hl(highlightClassDefLine(LINE, 0));
    expectSpanColor(html, 0, HL.keyword, "'classDef' keyword");
  });

  it("the second color span (class name) uses HL.name, not HL.keyword", () => {
    const html = hl(highlightClassDefLine(LINE, 0));
    expectSpanColor(html, 1, HL.name, "class name identifier");
    expect(extractColors(html)[1]).not.toBe(HL.keyword);
  });

  it("HL.keyword and HL.name are distinct so position tests are meaningful", () => {
    expect(HL.keyword).not.toBe(HL.name);
  });
});

describe("highlightCommentLine — color assignment", () => {
  const LINE = "%% This is a theme comment";

  it("the only color applied is COMMENT_HL.text", () => {
    const html = hl(highlightCommentLine(LINE, 0));
    const colors = extractColors(html);
    expect(colors).toHaveLength(1);
    expectSpanColor(html, 0, COMMENT_HL.text, "%% comment line");
  });

  it("COMMENT_HL.text is the color, not INIT_HL.bracket or any HL color", () => {
    const html = hl(highlightCommentLine(LINE, 0));
    const colors = extractColors(html);
    expect(colors[0]).not.toBe(INIT_HL.bracket);
    expect(colors[0]).not.toBe(INIT_HL.content);
    expect(colors[0]).not.toBe(HL.keyword);
    expect(colors[0]).not.toBe(HL.name);
  });

  it("fontStyle italic is present in the rendered output", () => {
    const html = hl(highlightCommentLine(LINE, 0));
    expect(html).toContain("font-style:italic");
  });

  it("COMMENT_HL.text is distinct from every other color constant (position tests are meaningful)", () => {
    expect(COMMENT_HL.text).not.toBe(INIT_HL.bracket);
    expect(COMMENT_HL.text).not.toBe(INIT_HL.content);
    expect(COMMENT_HL.text).not.toBe(HL.keyword);
    expect(COMMENT_HL.text).not.toBe(HL.key);
  });
});

describe("highlightPropsSegment — key vs value vs punct assignment", () => {
  // Input with one hex value, one non-hex value, and comma separators.
  // Span order:
  //   [0] key   — "fill"
  //   [1] punct — ":"
  //   [2] hex   — "#1e3a5f"
  //   [3] punct — ","
  //   [4] key   — "color"
  //   [5] punct — ":"
  //   [6] value — "bold"
  const PROPS = "fill:#1e3a5f,color:bold";

  it("the first color span (key token before colon) uses HL.key", () => {
    const html = hl(highlightPropsSegment(PROPS, "test"));
    expectSpanColor(html, 0, HL.key, "key token 'fill'");
  });

  it("the color span for a hex value uses HL.hex, not HL.value", () => {
    const html = hl(highlightPropsSegment(PROPS, "test"));
    expectSpanColor(html, 2, HL.hex, "hex value '#1e3a5f'");
    expect(extractColors(html)[2]).not.toBe(HL.value);
  });

  it("the color span for a non-hex value uses HL.value, not HL.hex", () => {
    const html = hl(highlightPropsSegment(PROPS, "test"));
    expectSpanColor(html, 6, HL.value, "non-hex value 'bold'");
    expect(extractColors(html)[6]).not.toBe(HL.hex);
  });

  it("the colon separator uses HL.punct, not HL.key or HL.value", () => {
    const html = hl(highlightPropsSegment(PROPS, "test"));
    expectSpanColor(html, 1, HL.punct, "colon after 'fill'");
    const colors = extractColors(html);
    expect(colors[1]).not.toBe(HL.key);
    expect(colors[1]).not.toBe(HL.value);
  });

  it("the comma separator between pairs uses HL.punct, not HL.key or HL.value", () => {
    const html = hl(highlightPropsSegment(PROPS, "test"));
    expectSpanColor(html, 3, HL.punct, "comma between pairs");
    const colors = extractColors(html);
    expect(colors[3]).not.toBe(HL.key);
    expect(colors[3]).not.toBe(HL.hex);
  });

  it("HL.key, HL.hex, HL.value, and HL.punct are all distinct (position tests are meaningful)", () => {
    expect(HL.key).not.toBe(HL.hex);
    expect(HL.key).not.toBe(HL.value);
    expect(HL.key).not.toBe(HL.punct);
    expect(HL.hex).not.toBe(HL.value);
    expect(HL.hex).not.toBe(HL.punct);
    expect(HL.value).not.toBe(HL.punct);
  });
});
