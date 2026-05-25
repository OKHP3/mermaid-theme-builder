/**
 * Tests for HighlightedCode highlight utilities.
 *
 * Covers:
 *   - highlightInitDirectiveLine  — %%{init:...}%% directive coloring
 *   - highlightMermaidCodeLine    — dispatcher routing
 *   - highlightMermaidCodeBlock   — full block rendering
 *
 * Runs in the node environment (no DOM) using react-dom/server renderToString,
 * matching the pattern used in classBrowser.test.ts.
 */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  INIT_HL,
  COMMENT_HL,
  highlightInitDirectiveLine,
  highlightCommentLine,
  highlightMermaidCodeLine,
  highlightMermaidCodeBlock,
} from "@/components/HighlightedCode";

/** Render a ReactNode to HTML string for assertion. */
function hl(node: import("react").ReactNode): string {
  return renderToString(createElement("span", null, node));
}

// ---------------------------------------------------------------------------
// INIT_HL color constants
// ---------------------------------------------------------------------------

describe("INIT_HL constants", () => {
  it("exports a bracket color", () => {
    expect(INIT_HL.bracket).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("exports a content color", () => {
    expect(INIT_HL.content).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("bracket and content colors are distinct", () => {
    expect(INIT_HL.bracket).not.toBe(INIT_HL.content);
  });

  it("bracket color is distinct from classDef rust-orange keyword color", () => {
    expect(INIT_HL.bracket).not.toBe("#c46a2c");
  });
});

// ---------------------------------------------------------------------------
// highlightInitDirectiveLine — bracket coloring
// ---------------------------------------------------------------------------

describe("highlightInitDirectiveLine — bracket color on %%{", () => {
  it("applies bracket color to the %%{ opening delimiter", () => {
    const line = `%%{init: {"theme": "base", "themeVariables": {}}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
    expect(html).toContain("%%{");
  });

  it("applies bracket color to the }%% closing delimiter", () => {
    const line = `%%{init: {"theme": "base", "themeVariables": {}}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).toContain("}%%");
  });

  it("applies content color to the directive body", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.content}`);
    expect(html).toContain(`init: {&quot;theme&quot;: &quot;base&quot;}`);
  });
});

describe("highlightInitDirectiveLine — bracket/content split", () => {
  it("produces at least 2 differently-colored spans", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    const bracketMatches = (html.match(new RegExp(`color:${INIT_HL.bracket}`, "g")) ?? []).length;
    const contentMatches = (html.match(new RegExp(`color:${INIT_HL.content}`, "g")) ?? []).length;
    // Two bracket spans (open + close) plus one content span
    expect(bracketMatches).toBeGreaterThanOrEqual(1);
    expect(contentMatches).toBeGreaterThanOrEqual(1);
  });

  it("bracket color appears for both %%{ and }%%", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    const colorCount = (html.match(new RegExp(`color:${INIT_HL.bracket}`, "g")) ?? []).length;
    expect(colorCount).toBe(2);
  });

  it("does not bleed classDef keyword color into init directive", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightInitDirectiveLine(line, 0));
    expect(html).not.toContain("color:#c46a2c");
  });
});

describe("highlightInitDirectiveLine — malformed input fallback", () => {
  it("falls back to amber bracket color for a line with no closing }%%", () => {
    const line = "%%{init: {incomplete";
    const html = hl(highlightInitDirectiveLine(line, 0));
    // Fallback renders the whole line in bracket color
    expect(html).toContain(`color:${INIT_HL.bracket}`);
    expect(html).toContain("%%{init");
  });

  it("renders empty string without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine("", 0))).not.toThrow();
  });

  it("renders a plain %%{ with no content without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine("%%{", 0))).not.toThrow();
  });
});

describe("highlightInitDirectiveLine — realistic themeEngine output", () => {
  const realLine = `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f", "edgeLabelBackground": "#f5f0e8"}}}%%`;

  it("renders without throwing", () => {
    expect(() => hl(highlightInitDirectiveLine(realLine, 0))).not.toThrow();
  });

  it("applies the bracket color at least once", () => {
    const html = hl(highlightInitDirectiveLine(realLine, 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });

  it("applies the content color at least once", () => {
    const html = hl(highlightInitDirectiveLine(realLine, 0));
    expect(html).toContain(`color:${INIT_HL.content}`);
  });

  it("contains the init keyword text in the output", () => {
    const html = hl(highlightInitDirectiveLine(realLine, 0));
    expect(html).toContain("init:");
  });

  it("preserves hex values from the JSON body in the rendered HTML", () => {
    const html = hl(highlightInitDirectiveLine(realLine, 0));
    expect(html).toContain("#1e3a5f");
  });
});

// ---------------------------------------------------------------------------
// highlightMermaidCodeLine — dispatcher routing
// ---------------------------------------------------------------------------

describe("highlightMermaidCodeLine — routes %%{...}%% lines to init highlighter", () => {
  it("applies init bracket color to lines starting with %%{", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });

  it("applies init content color to lines starting with %%{", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.content}`);
  });
});

describe("highlightMermaidCodeLine — routes classDef lines to classDef highlighter", () => {
  it("applies classDef rust-orange to keyword on classDef lines", () => {
    const line = "classDef primary fill:#1e3a5f,stroke:#ffffff";
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain("color:#c46a2c");
    expect(html).toContain("classDef");
  });

  it("does NOT apply init bracket color to classDef lines", () => {
    const line = "classDef primary fill:#1e3a5f";
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
  });
});

describe("highlightMermaidCodeLine — plain diagram lines", () => {
  it("renders plain diagram lines without special coloring", () => {
    const line = "flowchart TD";
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain("flowchart TD");
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
    expect(html).not.toContain("color:#c46a2c");
  });

  it("renders node definition lines as plain text", () => {
    const line = "  A[Start] --> B[End]";
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain("A[Start]");
  });

  it("renders empty lines without throwing", () => {
    expect(() => hl(highlightMermaidCodeLine("", 0))).not.toThrow();
  });

  it("does not misroute a 'classDeflike' line that lacks a trailing space", () => {
    // 'classDefSomething' without space after 'classDef' is not a directive
    const line = "classDefSomething fill:#ff0000";
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).not.toContain("color:#c46a2c");
  });
});

describe("highlightMermaidCodeLine — classDef with tab separator is still routed", () => {
  it("routes a classDef line with a tab to the classDef highlighter", () => {
    const line = "classDef\tprimary fill:#1e3a5f";
    const html = hl(highlightMermaidCodeLine(line, 0));
    // /^classDef\s/ matches tab, so it is routed to classDef highlighter
    expect(html).toContain("color:#c46a2c");
  });
});

// ---------------------------------------------------------------------------
// highlightMermaidCodeBlock — full block rendering
// ---------------------------------------------------------------------------

describe("highlightMermaidCodeBlock — multi-line block", () => {
  const block = [
    `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f"}}}%%`,
    "flowchart TD",
    "  A[Start] --> B[End]",
    "classDef primary fill:#1e3a5f,stroke:#ffffff",
  ].join("\n");

  it("renders without throwing", () => {
    expect(() => hl(highlightMermaidCodeBlock(block))).not.toThrow();
  });

  it("applies init bracket color for the %%{init}%% line", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });

  it("applies classDef rust-orange for the classDef line", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("color:#c46a2c");
  });

  it("preserves plain diagram lines in the output", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("flowchart TD");
    expect(html).toContain("A[Start]");
  });

  it("preserves newlines between lines as text nodes", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    // The block has 4 lines so there should be 3 newline separators
    const newlineCount = (html.match(/\n/g) ?? []).length;
    expect(newlineCount).toBe(3);
  });
});

describe("highlightMermaidCodeBlock — edge cases", () => {
  it("handles a single-line block without adding extra newlines", () => {
    const html = hl(highlightMermaidCodeBlock("flowchart TD"));
    expect(html).not.toContain("\n");
    expect(html).toContain("flowchart TD");
  });

  it("handles an empty string without throwing", () => {
    expect(() => hl(highlightMermaidCodeBlock(""))).not.toThrow();
  });

  it("handles a block of only classDef lines", () => {
    const block = "classDef a fill:#111\nclassDef b fill:#222";
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("color:#c46a2c");
    // Two classDef keyword spans
    const kwMatches = (html.match(/color:#c46a2c/g) ?? []).length;
    expect(kwMatches).toBe(2);
  });

  it("handles a block of only init directive lines", () => {
    const block = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });

  it("handles mixed init + classDef + plain lines in correct order", () => {
    const block = [
      `%%{init: {"theme": "base"}}%%`,
      "sequenceDiagram",
      "  Alice->>Bob: Hello",
      "classDef highlight fill:#ff0",
    ].join("\n");
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
    expect(html).toContain("color:#c46a2c");
    // renderToString HTML-escapes > as &gt;
    expect(html).toContain("Alice-&gt;&gt;Bob");
  });
});

// ---------------------------------------------------------------------------
// COMMENT_HL color constant
// ---------------------------------------------------------------------------

describe("COMMENT_HL constants", () => {
  it("exports a text color that is a valid 6-digit hex", () => {
    expect(COMMENT_HL.text).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("comment color is distinct from init bracket color", () => {
    expect(COMMENT_HL.text).not.toBe(INIT_HL.bracket);
  });

  it("comment color is distinct from init content color", () => {
    expect(COMMENT_HL.text).not.toBe(INIT_HL.content);
  });

  it("comment color is distinct from classDef rust-orange keyword color", () => {
    expect(COMMENT_HL.text).not.toBe("#c46a2c");
  });
});

// ---------------------------------------------------------------------------
// highlightCommentLine — color, italic, and text preservation
// ---------------------------------------------------------------------------

describe("highlightCommentLine — applies comment color", () => {
  it("renders the comment color on a bare %% line", () => {
    const html = hl(highlightCommentLine("%% section label", 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("renders the comment color when the line has leading %% with no space", () => {
    const html = hl(highlightCommentLine("%%no-space-comment", 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("does not apply init bracket color to comment lines", () => {
    const html = hl(highlightCommentLine("%% authored by Jamie", 0));
    expect(html).not.toContain(`color:${INIT_HL.bracket}`);
  });

  it("does not apply classDef rust-orange to comment lines", () => {
    const html = hl(highlightCommentLine("%% metadata", 0));
    expect(html).not.toContain("color:#c46a2c");
  });
});

describe("highlightCommentLine — italic style", () => {
  it("applies font-style:italic to comment lines", () => {
    const html = hl(highlightCommentLine("%% a comment", 0));
    expect(html).toContain("font-style:italic");
  });
});

describe("highlightCommentLine — text preservation", () => {
  it("preserves the full comment text in the output", () => {
    const html = hl(highlightCommentLine("%% section: top-level flow", 0));
    expect(html).toContain("%% section: top-level flow");
  });

  it("preserves an empty-body comment (%% only)", () => {
    const html = hl(highlightCommentLine("%%", 0));
    expect(html).toContain("%%");
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("renders without throwing on an empty string", () => {
    expect(() => hl(highlightCommentLine("", 0))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// highlightMermaidCodeLine — comment routing in the dispatcher
// ---------------------------------------------------------------------------

describe("highlightMermaidCodeLine — routes %% comment lines to comment highlighter", () => {
  it("applies comment color to a %% comment line", () => {
    const html = hl(highlightMermaidCodeLine("%% section label", 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("applies italic style to a %% comment line", () => {
    const html = hl(highlightMermaidCodeLine("%% authored by Jamie", 0));
    expect(html).toContain("font-style:italic");
  });

  it("preserves the comment text through the dispatcher", () => {
    const html = hl(highlightMermaidCodeLine("%% flowchart header", 0));
    expect(html).toContain("%% flowchart header");
  });

  it("routes %% with no following space as a comment", () => {
    const html = hl(highlightMermaidCodeLine("%%inline-comment", 0));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });
});

describe("highlightMermaidCodeLine — does NOT route %%{ lines to comment highlighter", () => {
  it("does not apply comment color to a %%{init}%% line", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });

  it("still applies init bracket color to a %%{init}%% line", () => {
    const line = `%%{init: {"theme": "base"}}%%`;
    const html = hl(highlightMermaidCodeLine(line, 0));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
  });
});

describe("highlightMermaidCodeLine — comment lines do not bleed into other routes", () => {
  it("plain diagram lines are not treated as comments", () => {
    const html = hl(highlightMermaidCodeLine("flowchart TD", 0));
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });

  it("classDef lines are not treated as comments", () => {
    const html = hl(highlightMermaidCodeLine("classDef primary fill:#1e3a5f", 0));
    expect(html).not.toContain(`color:${COMMENT_HL.text}`);
  });
});

// ---------------------------------------------------------------------------
// highlightMermaidCodeBlock — comment lines in a mixed block
// ---------------------------------------------------------------------------

describe("highlightMermaidCodeBlock — comment lines in a mixed block", () => {
  const block = [
    `%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#1e3a5f"}}}%%`,
    "%% section: entry points",
    "flowchart TD",
    "  A[Start] --> B[End]",
    "classDef primary fill:#1e3a5f,stroke:#ffffff",
  ].join("\n");

  it("renders without throwing", () => {
    expect(() => hl(highlightMermaidCodeBlock(block))).not.toThrow();
  });

  it("applies comment color for the %% comment line", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("preserves init bracket color alongside comment color in the same block", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain(`color:${INIT_HL.bracket}`);
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("preserves classDef rust-orange alongside comment color in the same block", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("color:#c46a2c");
    expect(html).toContain(`color:${COMMENT_HL.text}`);
  });

  it("preserves the comment text in the block output", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("%% section: entry points");
  });

  it("preserves plain diagram lines alongside comments", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    expect(html).toContain("flowchart TD");
    expect(html).toContain("A[Start]");
  });

  it("produces the correct newline count (4 separators for a 5-line block)", () => {
    const html = hl(highlightMermaidCodeBlock(block));
    const newlineCount = (html.match(/\n/g) ?? []).length;
    expect(newlineCount).toBe(4);
  });
});
