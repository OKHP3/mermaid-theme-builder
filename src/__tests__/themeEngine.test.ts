import { describe, it, expect } from "vitest";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  type ExportOptions,
} from "@/lib/themeEngine";
import { BRAND_PALETTES } from "@/lib/palettes";
import { DEFAULT_TYPOGRAPHY } from "@/lib/typography";

const palette = BRAND_PALETTES[0];

const BASE_OPTIONS: ExportOptions = {
  palette,
  diagramFamily: "flowchart",
  includeMetaComments: false,
  includeBadge: false,
};

const SIMPLE_FLOWCHART = "flowchart TD\n  A --> B";

describe("generateThemedCode", () => {
  it("returns a string", () => {
    expect(typeof generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS)).toBe("string");
  });

  it("includes %%{init}%% directive for classic look", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS);
    expect(result).toContain("%%{init:");
  });

  it("preserves original diagram body", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS);
    expect(result).toContain("A --> B");
  });

  it("includes palette theme name", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS);
    expect(result.toLowerCase()).toContain("theme");
  });

  it("includes look: neo when neo look is set", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, { ...BASE_OPTIONS, look: "neo" });
    expect(result).toContain('"look"');
    expect(result).toContain("neo");
  });

  it("includes look: handDrawn when handDrawn is set", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, { ...BASE_OPTIONS, look: "handDrawn" });
    expect(result).toContain("handDrawn");
  });

  it("includes fontSize when specified", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, { ...BASE_OPTIONS, fontSize: "18px" });
    expect(result).toContain("18px");
  });

  it("does not include look key for classic (default)", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, { ...BASE_OPTIONS, look: "classic" });
    expect(result).not.toContain('"look"');
  });

  it("strips existing %%{init}%% from input before re-theming", () => {
    const withInit = '%%{init: {"theme": "dark"}}%%\nflowchart TD\n  A --> B';
    const result = generateThemedCode(withInit, BASE_OPTIONS);
    const initCount = (result.match(/%%{init/g) ?? []).length;
    expect(initCount).toBe(1);
  });
});

describe("generateMarkdownExport", () => {
  it("returns a string containing mermaid code fences", () => {
    const themed = generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS);
    const result = generateMarkdownExport(themed, palette, BASE_OPTIONS);
    expect(result).toContain("```mermaid");
    expect(result).toContain("```");
  });

  it("includes palette name in markdown", () => {
    const themed = generateThemedCode(SIMPLE_FLOWCHART, BASE_OPTIONS);
    const result = generateMarkdownExport(themed, palette, BASE_OPTIONS);
    expect(result).toContain(palette.name);
  });
});

describe("generatePromptScaffoldWithFormat", () => {
  it("returns a non-empty string", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result.length).toBeGreaterThan(100);
  });

  it("includes the palette name", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).toContain(palette.name);
  });

  it("includes the theme directive section", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).toContain("%%{init:");
  });

  it("includes classDef library section for flowchart", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).toContain("classDef");
  });

  it("includes typography section when typography is provided", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, typography: DEFAULT_TYPOGRAPHY },
      "both",
    );
    expect(result).toContain("Typography Hierarchy");
  });

  it("does NOT include typography section when typography is undefined", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).not.toContain("Typography Hierarchy");
  });

  it("uses Format A (%%{init}%%) when formatA is requested", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "formatA");
    expect(result).toContain("%%{init:");
  });

  it("includes update prompt section", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).toContain("Update Prompt");
  });

  it("includes renderer-target section when rendererTarget is provided", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, rendererTarget: "mermaid-live" },
      "both",
    );
    expect(result).toContain("Target Renderer");
  });

  it("includes renderer display name in renderer-target section", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, rendererTarget: "github" },
      "both",
    );
    expect(result).toContain("GitHub");
  });

  it("does NOT include renderer-target section when rendererTarget is undefined", () => {
    const result = generatePromptScaffoldWithFormat(palette, BASE_OPTIONS, "both");
    expect(result).not.toContain("Target Renderer");
  });

  it("includes look compatibility table in renderer-target section", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, rendererTarget: "mermaid-live" },
      "both",
    );
    expect(result).toContain("Look compatibility");
  });

  it("includes look incompatibility warning for unsupported look+renderer combo", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, rendererTarget: "notion", look: "neo" },
      "both",
    );
    expect(result).toContain("Warning");
  });

  it("scaffold includes palette + look + typography + renderer-target when all provided", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      {
        ...BASE_OPTIONS,
        look: "neo",
        typography: DEFAULT_TYPOGRAPHY,
        rendererTarget: "mermaid-live",
      },
      "both",
    );
    expect(result).toContain(palette.name);
    expect(result).toContain("neo");
    expect(result).toContain("Typography Hierarchy");
    expect(result).toContain("Target Renderer");
  });

  it("includes ER-specific section when diagramFamily is erDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "erDiagram" },
      "both",
    );
    expect(result).toContain("ER diagram");
    expect(result).toContain("cardinality");
    expect(result).toContain("erDiagram");
  });

  it("does not include classDef library section for erDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "erDiagram" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("ER scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "erDiagram" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("erDiagram does not support per-entity classDef styling");
  });
});
