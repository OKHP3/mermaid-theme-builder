import { describe, it, expect } from "vitest";
import { detectDiagram } from "@/lib/detector";
import { DIAGRAM_CAPABILITIES } from "@/data/mermaid-capabilities";

describe("detectDiagram — family detection", () => {
  it("returns unknown for empty string", () => {
    expect(detectDiagram("").family).toBe("unknown");
  });

  it("returns unknown for whitespace-only string", () => {
    expect(detectDiagram("   \n\n  ").family).toBe("unknown");
  });

  it("detects flowchart (flowchart TD)", () => {
    expect(detectDiagram("flowchart TD\n  A --> B").family).toBe("flowchart");
  });

  it("detects flowchart (graph LR)", () => {
    expect(detectDiagram("graph LR\n  A --> B").family).toBe("flowchart");
  });

  it("detects sequenceDiagram", () => {
    expect(detectDiagram("sequenceDiagram\n  Alice->>Bob: Hello").family).toBe("sequenceDiagram");
  });

  it("detects classDiagram", () => {
    expect(detectDiagram("classDiagram\n  class Animal").family).toBe("classDiagram");
  });

  it("detects stateDiagram-v2", () => {
    expect(detectDiagram("stateDiagram-v2\n  [*] --> A").family).toBe("stateDiagram");
  });

  it("detects erDiagram", () => {
    expect(detectDiagram("erDiagram\n  USER ||--o{ ORDER : places").family).toBe("erDiagram");
  });

  it("detects gantt", () => {
    expect(detectDiagram("gantt\n  title My Project\n  section Setup\n    Task: 2024-01-01, 7d").family).toBe("gantt");
  });

  it("detects pie", () => {
    expect(detectDiagram('pie title Pets\n  "Dogs" : 386').family).toBe("pie");
  });

  it("detects xychart-beta", () => {
    expect(detectDiagram("xychart-beta\n  x-axis [Q1, Q2, Q3]\n  bar [10, 20, 30]").family).toBe("xychart");
  });

  it("detects quadrantChart", () => {
    expect(detectDiagram("quadrantChart\n  title Priority Matrix").family).toBe("quadrantChart");
  });

  it("detects gitGraph", () => {
    expect(detectDiagram("gitGraph\n  commit").family).toBe("gitGraph");
  });

  it("detects journey", () => {
    expect(detectDiagram("journey\n  title User journey\n  section Login").family).toBe("journey");
  });

  it("detects mindmap", () => {
    expect(detectDiagram("mindmap\n  root((Root))").family).toBe("mindmap");
  });

  it("detects sankey-beta", () => {
    expect(detectDiagram("sankey-beta\n  A,B,10").family).toBe("sankey");
  });

  it("detects timeline", () => {
    expect(detectDiagram("timeline\n  title History").family).toBe("timeline");
  });

  it("detects block-beta", () => {
    expect(detectDiagram("block-beta\n  A B").family).toBe("block");
  });

  it("detects architecture-beta (architectureBeta family id)", () => {
    expect(detectDiagram("architecture-beta\n  service API(internet)").family).toBe("architectureBeta");
  });

  it("detects kanban", () => {
    expect(detectDiagram("kanban\n  Todo\n    Task 1").family).toBe("kanban");
  });

  it("detects packet (official v11.0+ syntax)", () => {
    expect(detectDiagram("packet\n  0-7: \"Source Port\"").family).toBe("packet");
  });

  it("detects packet-beta (legacy fallback)", () => {
    expect(detectDiagram("packet-beta\n  0-7: \"Source Port\"").family).toBe("packet");
  });

  it("detects requirementDiagram", () => {
    expect(detectDiagram("requirementDiagram\n  requirement R1 {").family).toBe("requirementDiagram");
  });

  it("detects zenuml", () => {
    expect(detectDiagram("zenuml\n  A.method() {\n    B.method()\n  }").family).toBe("zenuml");
  });

  it("detects C4Context as c4Diagram family", () => {
    expect(detectDiagram("C4Context\n  Person(user, User)").family).toBe("c4Diagram");
  });

  it("detects C4Container as c4Diagram family", () => {
    expect(detectDiagram("C4Container\n  Person(user, User)").family).toBe("c4Diagram");
  });

  it("detects wardley-beta as wardley family", () => {
    expect(detectDiagram("wardley-beta\n  title Online Shopping").family).toBe("wardley");
  });

  it("detects treeView-beta as treeView family", () => {
    expect(detectDiagram("treeView-beta\n  root\n    child1\n    child2").family).toBe("treeView");
  });

  it("detects venn-beta as venn family", () => {
    expect(detectDiagram("venn-beta\n  A[Set A]\n  B[Set B]").family).toBe("venn");
  });

  it("detects ishikawa-beta as ishikawa family", () => {
    expect(detectDiagram("ishikawa-beta\n  root((Root Cause))").family).toBe("ishikawa");
  });

  it("detects radar-beta as radar family", () => {
    expect(detectDiagram("radar-beta\n  axis A,B,C\n  curve Candidate [5,3,4]").family).toBe("radar");
  });

  it("detects treemap-beta as treemap family", () => {
    expect(detectDiagram("treemap-beta\n  root\n    leaf 10").family).toBe("treemap");
  });

  it("detects eventmodeling as eventModeling family", () => {
    expect(detectDiagram("eventmodeling\n  Command AddItem").family).toBe("eventModeling");
  });

  it("strips %%{init:...}%% directive before detecting family", () => {
    const withInit = '%%{init: {"theme": "dark"}}%%\nflowchart LR\n  A --> B';
    expect(detectDiagram(withInit).family).toBe("flowchart");
  });

  it("strips %% comments before detecting family", () => {
    const withComment = "%% A comment\nsequenceDiagram\n  A->>B: hi";
    expect(detectDiagram(withComment).family).toBe("sequenceDiagram");
  });
});

describe("DIAGRAM_CAPABILITIES registry", () => {
  it("has at least 27 entries", () => {
    expect(DIAGRAM_CAPABILITIES.length).toBeGreaterThanOrEqual(27);
  });

  it("every entry has a unique id", () => {
    const ids = DIAGRAM_CAPABILITIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every entry has a non-empty displayName", () => {
    for (const cap of DIAGRAM_CAPABILITIES) {
      expect(cap.displayName, `${cap.id} should have a displayName`).toBeTruthy();
    }
  });

  it("every entry has a non-empty description", () => {
    for (const cap of DIAGRAM_CAPABILITIES) {
      expect(cap.description, `${cap.id} should have a description`).toBeTruthy();
    }
  });

  it("erDiagram supportedLooks includes neo (Mermaid 11.14+)", () => {
    const er = DIAGRAM_CAPABILITIES.find((c) => c.id === "erDiagram");
    expect(er?.supportedLooks).toContain("neo");
  });

  it("requirementDiagram supportedLooks includes neo (Mermaid 11.14+)", () => {
    const req = DIAGRAM_CAPABILITIES.find((c) => c.id === "requirementDiagram");
    expect(req?.supportedLooks).toContain("neo");
  });

  it("mindmap supportedLooks includes neo (Mermaid 11.14+)", () => {
    const mm = DIAGRAM_CAPABILITIES.find((c) => c.id === "mindmap");
    expect(mm?.supportedLooks).toContain("neo");
  });

  it("packet minMermaidVersion is 11.0.0", () => {
    const packet = DIAGRAM_CAPABILITIES.find((c) => c.id === "packet");
    expect(packet?.minMermaidVersion).toBe("11.0.0");
  });

  it("radar minMermaidVersion is 11.6.0", () => {
    const radar = DIAGRAM_CAPABILITIES.find((c) => c.id === "radar");
    expect(radar?.minMermaidVersion).toBe("11.6.0");
  });

  it("architectureBeta minMermaidVersion is 11.1.0", () => {
    const arch = DIAGRAM_CAPABILITIES.find((c) => c.id === "architectureBeta");
    expect(arch?.minMermaidVersion).toBe("11.1.0");
  });

  it("venn minMermaidVersion is 11.12.3", () => {
    const venn = DIAGRAM_CAPABILITIES.find((c) => c.id === "venn");
    expect(venn?.minMermaidVersion).toBe("11.12.3");
  });

  it("ishikawa minMermaidVersion is 11.12.3", () => {
    const ish = DIAGRAM_CAPABILITIES.find((c) => c.id === "ishikawa");
    expect(ish?.minMermaidVersion).toBe("11.12.3");
  });

  it("sankey themeConfidence is medium (Mermaid 11.15 improvements)", () => {
    const sankey = DIAGRAM_CAPABILITIES.find((c) => c.id === "sankey");
    expect(sankey?.themeConfidence).toBe("medium");
  });

  it("sankey styleStrategy is partial (Mermaid 11.15 improvements)", () => {
    const sankey = DIAGRAM_CAPABILITIES.find((c) => c.id === "sankey");
    expect(sankey?.styleStrategy).toBe("partial");
  });

  it("wardley stability is beta", () => {
    const wardley = DIAGRAM_CAPABILITIES.find((c) => c.id === "wardley");
    expect(wardley).toBeDefined();
    expect(wardley?.stability).toBe("beta");
  });

  it("wardley examplePending is false", () => {
    const wardley = DIAGRAM_CAPABILITIES.find((c) => c.id === "wardley");
    expect(wardley?.examplePending).toBe(false);
  });

  it("eventModeling is in the registry", () => {
    const em = DIAGRAM_CAPABILITIES.find((c) => c.id === "eventModeling");
    expect(em).toBeDefined();
  });

  it("all entries with supportedLooks have valid look values", () => {
    const validLooks = new Set(["classic", "neo", "handDrawn"]);
    for (const cap of DIAGRAM_CAPABILITIES) {
      if (cap.supportedLooks) {
        for (const look of cap.supportedLooks) {
          expect(validLooks.has(look), `${cap.id}.supportedLooks has invalid look: ${look}`).toBe(true);
        }
      }
      if (cap.unsupportedLooks) {
        for (const look of cap.unsupportedLooks) {
          expect(validLooks.has(look), `${cap.id}.unsupportedLooks has invalid look: ${look}`).toBe(true);
        }
      }
    }
  });
});
