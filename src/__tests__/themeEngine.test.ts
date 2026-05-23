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

  it("includes gitGraph-specific section when diagramFamily is gitGraph", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gitGraph" },
      "both",
    );
    expect(result).toContain("Git graph");
    expect(result).toContain("gitGraph");
    expect(result).toContain("commit");
    expect(result).toContain("branch");
    expect(result).toContain("checkout");
    expect(result).toContain("merge");
  });

  it("does not include classDef library section for gitGraph", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gitGraph" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("gitGraph scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gitGraph" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("gitGraph does not support per-commit or per-branch classDef styling");
  });

  it("gitGraph scaffold mentions git branch color config (git0–git7)", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gitGraph" },
      "both",
    );
    expect(result).toContain("git0");
    expect(result).toContain("git7");
  });

  it("gitGraph scaffold example output contains commit and branch syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "gitGraph" },
      "both",
    );
    expect(result).toContain('id: "');
    expect(result).toContain("tag:");
  });

  it("includes xychart-specific section when diagramFamily is xychart", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "xychart" },
      "both",
    );
    expect(result).toContain("XY chart");
    expect(result).toContain("xychart-beta");
    expect(result).toContain("x-axis");
    expect(result).toContain("y-axis");
    expect(result).toContain("bar");
    expect(result).toContain("line");
  });

  it("does not include classDef library section for xychart", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "xychart" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("xychart scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "xychart" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("xychart-beta does not support per-bar or per-point classDef styling");
  });

  it("xychart scaffold explains bar and line data series syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "xychart" },
      "both",
    );
    expect(result).toContain("bar [v1, v2");
    expect(result).toContain("line [v1, v2");
  });

  it("xychart scaffold mentions renderer validation caveat", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "xychart" },
      "both",
    );
    expect(result).toContain("target renderer");
  });

  it("includes journey-specific section when diagramFamily is journey", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "journey" },
      "both",
    );
    expect(result).toContain("Journey diagram");
    expect(result).toContain("section");
    expect(result).toContain("journey");
  });

  it("does not include classDef library section for journey", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "journey" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("journey scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "journey" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("journey does not support per-task classDef styling");
  });

  it("journey scaffold explains score notation (1–5)", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "journey" },
      "both",
    );
    expect(result).toContain("score");
    expect(result).toContain("1–5");
  });

  it("journey scaffold example output contains task score syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "journey" },
      "both",
    );
    expect(result).toContain(": 5: ");
    expect(result).toContain(": 3: ");
  });

  it("includes timeline-specific section when diagramFamily is timeline", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "timeline" },
      "both",
    );
    expect(result).toContain("Timeline diagram");
    expect(result).toContain("period");
    expect(result).toContain("timeline");
  });

  it("does not include classDef library section for timeline", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "timeline" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("timeline scaffold rules forbid :::className and note styling is theme-only", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "timeline" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("timeline does not support per-event classDef styling");
  });

  it("timeline scaffold explains period and event syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "timeline" },
      "both",
    );
    expect(result).toContain("section");
    expect(result).toContain("title");
  });

  it("timeline scaffold example output contains period : event entries", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "timeline" },
      "both",
    );
    expect(result).toContain("timeline\n");
    expect(result).toContain(": UNIVAC I");
  });

  it("includes quadrant-specific section when diagramFamily is quadrant", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "quadrantChart" },
      "both",
    );
    expect(result).toContain("Quadrant chart");
    expect(result).toContain("x-axis");
    expect(result).toContain("y-axis");
    expect(result).toContain("quadrantChart");
  });

  it("does not include classDef library section for quadrant", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "quadrantChart" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("quadrant scaffold rules forbid :::className and inline styles", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "quadrantChart" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("quadrantChart does not support per-point classDef styling");
  });

  it("quadrant scaffold explains point placement notation [x, y]", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "quadrantChart" },
      "both",
    );
    expect(result).toContain("[x, y]");
    expect(result).toContain("quadrant-1");
    expect(result).toContain("quadrant-4");
  });

  it("quadrant scaffold example output contains point declarations", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "quadrantChart" },
      "both",
    );
    expect(result).toContain("quadrantChart\n");
    expect(result).toContain("Feature A: [0.3, 0.8]");
  });

  it("includes block-specific section when diagramFamily is block", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "block" },
      "both",
    );
    expect(result).toContain("Block diagram");
    expect(result).toContain("columns");
    expect(result).toContain("space");
    expect(result).toContain("block-beta");
  });

  it("includes classDef library section for block (:::className is supported)", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "block" },
      "both",
    );
    expect(result).toContain("## Semantic classDef library");
    expect(result).toContain("classDef");
  });

  it("block scaffold explains shape notation variants", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "block" },
      "both",
    );
    expect(result).toContain('id["label"]');
    expect(result).toContain('id(["label"])');
    expect(result).toContain('id(("label"))');
  });

  it("block scaffold rules confirm :::className is valid for block nodes", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "block" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("block-beta");
    expect(result).not.toContain("block-beta does not support");
  });

  it("block scaffold example output contains block-beta syntax", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "block" },
      "both",
    );
    expect(result).toContain("block-beta\n");
    expect(result).toContain("columns 3");
  });

  it("includes c4Diagram-specific section when diagramFamily is c4Diagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).toContain("C4 diagram");
    expect(result).toContain("Person");
    expect(result).toContain("System");
    expect(result).toContain("Rel");
    expect(result).toContain("C4Context");
  });

  it("does not include classDef library section for c4Diagram", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).not.toContain("## Semantic classDef library");
  });

  it("c4Diagram scaffold rules forbid :::className", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).toContain(":::className");
    expect(result).toContain("c4Diagram does not support per-element classDef styling");
  });

  it("c4Diagram scaffold notes partial themeVariable support", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).toContain("partial");
    expect(result).toContain("themeVariable");
  });

  it("c4Diagram scaffold explains Container and Component element types", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).toContain("Container");
    expect(result).toContain("Component");
    expect(result).toContain("System_Ext");
  });

  it("c4Diagram scaffold example output contains Person/System/Rel declarations", () => {
    const result = generatePromptScaffoldWithFormat(
      palette,
      { ...BASE_OPTIONS, diagramFamily: "c4Diagram" },
      "both",
    );
    expect(result).toContain("C4Context\n");
    expect(result).toContain("Person(user,");
    expect(result).toContain("Rel(user, app,");
  });
});

describe("typography → init directive mapping", () => {
  function extractInitDirective(code: string): string {
    return code.split("\n")[0];
  }

  it("nodeLabel.fontSize sets the fontSize themeVariable in the init directive", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_OPTIONS,
      typography: { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 14, fontFamily: "" } },
    });
    const init = extractInitDirective(result);
    expect(init).toContain('"fontSize": "14px"');
  });

  it("explicit fontSize override wins over typography-derived fontSize", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_OPTIONS,
      typography: { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 14, fontFamily: "" } },
      fontSize: "20px",
    });
    const init = extractInitDirective(result);
    expect(init).toContain('"fontSize": "20px"');
    expect(init).not.toContain('"fontSize": "14px"');
  });

  it("sequence diagram family emits sequence.fontSize in the init block when typography is active", () => {
    const result = generateThemedCode("sequenceDiagram\n  Alice->>Bob: hello", {
      ...BASE_OPTIONS,
      diagramFamily: "sequenceDiagram",
      typography: DEFAULT_TYPOGRAPHY,
    });
    const init = extractInitDirective(result);
    expect(init).toContain('"sequence": {"fontSize": 14}');
  });

  it("sequence.fontSize in init block matches the resolved typography nodeLabel fontSize", () => {
    const customTypography = { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 18, fontFamily: "" } };
    const result = generateThemedCode("sequenceDiagram\n  Alice->>Bob: hello", {
      ...BASE_OPTIONS,
      diagramFamily: "sequenceDiagram",
      typography: customTypography,
    });
    const init = extractInitDirective(result);
    expect(init).toContain('"sequence": {"fontSize": 18}');
  });

  it("non-sequence families do NOT emit the sequence config block", () => {
    const families = ["flowchart", "classDiagram", "erDiagram", "gantt", "pie"] as const;
    for (const family of families) {
      const result = generateThemedCode(SIMPLE_FLOWCHART, {
        ...BASE_OPTIONS,
        diagramFamily: family,
        typography: DEFAULT_TYPOGRAPHY,
      });
      const init = extractInitDirective(result);
      expect(init).not.toContain('"sequence"');
    }
  });

  it("sequence config block is NOT emitted when typography is absent", () => {
    const result = generateThemedCode("sequenceDiagram\n  Alice->>Bob: hello", {
      ...BASE_OPTIONS,
      diagramFamily: "sequenceDiagram",
    });
    const init = extractInitDirective(result);
    expect(init).not.toContain('"sequence"');
  });

  it("nodeLabel.fontFamily populates fontFamily themeVariable when palette has no fontFamily color", () => {
    const paletteWithoutFontFamily = {
      ...palette,
      colors: palette.colors.filter((c) => c.key !== "fontFamily"),
    };
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_OPTIONS,
      palette: paletteWithoutFontFamily,
      typography: { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 14, fontFamily: "Georgia, serif" } },
    });
    const init = extractInitDirective(result);
    expect(init).toContain('"fontFamily": "Georgia, serif"');
  });

  it("palette fontFamily wins over typography nodeLabel.fontFamily", () => {
    const result = generateThemedCode(SIMPLE_FLOWCHART, {
      ...BASE_OPTIONS,
      typography: { ...DEFAULT_TYPOGRAPHY, nodeLabel: { fontSize: 14, fontFamily: "Georgia, serif" } },
    });
    const init = extractInitDirective(result);
    expect(init).toContain("DM Sans");
    expect(init).not.toContain("Georgia, serif");
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

  /**
   * Ordering contract: getClassDefs must return entries in a stable definition
   * order. Both "Copy all" in ClassBrowser and buildClassDefLibrary in the
   * export engine iterate getClassDefs in this order — keeping them aligned
   * ensures the copied block is a drop-in replacement for the exported one.
   * If you intentionally change the order, update this test to match.
   */
  it("returns classDefs in the documented definition order", () => {
    const testPalette = BUILTIN_PALETTES[0];
    const names = getClassDefs(testPalette).map((d) => d.name);
    expect(names).toEqual([
      "primary",
      "secondary",
      "tertiary",
      "platform",
      "boundary",
      "actor",
      "gate",
      "control",
      "log",
      "question",
      "accent",
      "deepBlue",
      "slate",
      "scope",
      "outOfScope",
      "redDash",
    ]);
  });
});
