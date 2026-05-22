import { describe, it, expect } from "vitest";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  buildClassDefString,
  getClassDefs,
  type ExportOptions,
} from "@/lib/themeEngine";
import { BRAND_PALETTES, BUILTIN_PALETTES } from "@/lib/palettes";
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

  it("includes class-diagram-specific section when diagramFamily is classDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "classDiagram" },
      "both",
    );
    expect(result).toContain("Class diagram");
    expect(result).toContain("Relationship arrow types");
    expect(result).toContain("classDiagram");
  });

  it("includes classDef library for classDiagram (:::className is supported)", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "classDiagram" },
      "both",
    );
    expect(result).toContain("## Semantic classDef library");
    expect(result).toContain("classDef");
  });

  it("does not include subgraph tier patterns for classDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "classDiagram" },
      "both",
    );
    expect(result).not.toContain("Subgraph tier patterns");
  });

  it("includes state-diagram-specific section when diagramFamily is stateDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "stateDiagram" },
      "both",
    );
    expect(result).toContain("State diagram");
    expect(result).toContain("stateDiagram-v2");
    expect(result).toContain("[*]");
  });

  it("includes limited classDef support note for stateDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "stateDiagram" },
      "both",
    );
    expect(result).toContain("limited renderer support");
  });

  it("does not include subgraph tier patterns for stateDiagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "stateDiagram" },
      "both",
    );
    expect(result).not.toContain("Subgraph tier patterns");
  });

  it("includes gantt-specific section when diagramFamily is gantt", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gantt" },
      "both",
    );
    expect(result).toContain("Gantt diagram");
    expect(result).toContain("dateFormat");
    expect(result).toContain("section");
    expect(result).toContain("gantt");
  });

  it("does not include classDef library section for gantt", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gantt" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("gantt scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gantt" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("gantt does not support per-task classDef styling");
  });

  it("gantt scaffold includes milestone and dateFormat syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gantt" },
      "both",
    );
    expect(result).toContain("milestone");
    expect(result).toContain("YYYY-MM-DD");
  });

  it("includes pie-specific section when diagramFamily is pie", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "pie" },
      "both",
    );
    expect(result).toContain("Pie chart");
    expect(result).toContain("pie title");
    expect(result).toContain("pie");
  });

  it("does not include classDef library section for pie", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "pie" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("pie scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "pie" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("pie does not support per-slice classDef styling");
  });

  it("pie scaffold explains label:value slice syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "pie" },
      "both",
    );
    expect(result).toContain('"Label" : value');
  });

  it("includes mindmap-specific section when diagramFamily is mindmap", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "mindmap" },
      "both",
    );
    expect(result).toContain("Mindmap");
    expect(result).toContain("indented");
    expect(result).toContain("mindmap");
  });

  it("does not include classDef library section for mindmap", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "mindmap" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("mindmap scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "mindmap" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("mindmap does not support per-node classDef styling");
  });

  it("mindmap scaffold explains shape notation", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "mindmap" },
      "both",
    );
    expect(result).toContain("((text))");
    expect(result).toContain("[text]");
    expect(result).toContain("(text)");
  });
});

describe("buildClassDefString", () => {
  it("returns a line starting with 'classDef '", () => {
    const def = { name: "primary", fill: "#111827", stroke: "#888888", color: "#f0f0f0", extra: "", description: "" };
    expect(buildClassDefString(def)).toMatch(/^classDef /);
  });

  it("formats name, fill, stroke, and color in the correct order", () => {
    const def = { name: "accent", fill: "#aabbcc", stroke: "#112233", color: "#ffffff", extra: "", description: "" };
    expect(buildClassDefString(def)).toBe("classDef accent fill:#aabbcc,stroke:#112233,color:#ffffff");
  });

  it("appends extra when present", () => {
    const def = { name: "boundary", fill: "#111", stroke: "#222", color: "#333", extra: "stroke-dasharray:5", description: "" };
    expect(buildClassDefString(def)).toBe("classDef boundary fill:#111,stroke:#222,color:#333,stroke-dasharray:5");
  });

  it("appends fontSizeRule when provided", () => {
    const def = { name: "primary", fill: "#111", stroke: "#222", color: "#333", extra: "", description: "" };
    expect(buildClassDefString(def, "font-size:14px")).toBe("classDef primary fill:#111,stroke:#222,color:#333,font-size:14px");
  });

  it("appends both extra and fontSizeRule when both are present", () => {
    const def = { name: "actor", fill: "#111", stroke: "#222", color: "#333", extra: "font-weight:bold", description: "" };
    expect(buildClassDefString(def, "font-size:18px")).toBe("classDef actor fill:#111,stroke:#222,color:#333,font-weight:bold,font-size:18px");
  });

  it("omits fontSizeRule when not provided", () => {
    const def = { name: "slate", fill: "#eee", stroke: "#ccc", color: "#111", extra: "", description: "" };
    expect(buildClassDefString(def)).not.toContain("font-size");
  });

  it("produces no leading whitespace (copy format is indent-free)", () => {
    const def = { name: "primary", fill: "#111827", stroke: "#888888", color: "#f0f0f0", extra: "", description: "" };
    expect(buildClassDefString(def)).not.toMatch(/^\s/);
  });

  it("is consistent with getClassDefs output on a real palette", () => {
    const testPalette = BUILTIN_PALETTES[0];
    const defs = getClassDefs(testPalette);
    for (const def of defs) {
      const line = buildClassDefString(def);
      expect(line).toMatch(/^classDef \S+ fill:#[0-9a-fA-F]{3,8}/);
    }
  });
});
