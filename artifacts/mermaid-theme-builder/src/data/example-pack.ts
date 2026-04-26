import type { DiagramFamily } from "./mermaid-capabilities";

export type ExampleCategory =
  | "native"
  | "beta"
  | "emulated"
  | "showcase"
  | "gap";

export interface ExamplePackEntry {
  filename: string;
  diagramFamily: DiagramFamily;
  category: ExampleCategory;
  title: string;
  description: string;
  pending: boolean;
}

export const EXAMPLE_PACK: ExamplePackEntry[] = [
  {
    filename: "flowchart-overkill-operating-system.mmd",
    diagramFamily: "flowchart",
    category: "native",
    title: "OverKill Operating System",
    description:
      "Full flowchart of the OverKill Hill P³ ideation-to-ship operating system, including AI council stages, brand gravity well, and governance layers.",
    pending: false,
  },
  {
    filename: "sequence-council-to-prototype.mmd",
    diagramFamily: "sequenceDiagram",
    category: "native",
    title: "Council to Prototype",
    description:
      "Sequence diagram showing the OKH council-of-AIs review flow from raw idea submission through prototype approval.",
    pending: false,
  },
  {
    filename: "class-theme-builder-domain-model.mmd",
    diagramFamily: "classDiagram",
    category: "native",
    title: "Theme Builder Domain Model",
    description:
      "Class diagram modeling the core Mermaid Theme Builder domain: Palette, ThemeVariable, DiagramFamily, and ExportOptions.",
    pending: true,
  },
  {
    filename: "state-theme-lifecycle.mmd",
    diagramFamily: "stateDiagram",
    category: "native",
    title: "Theme Lifecycle",
    description:
      "State diagram showing the lifecycle of a theme from creation through customization, export, and archival.",
    pending: false,
  },
  {
    filename: "er-theme-registry.mmd",
    diagramFamily: "erDiagram",
    category: "native",
    title: "Theme Registry",
    description:
      "ER diagram of the conceptual theme registry schema: palette, capability entry, example entry, and their relationships.",
    pending: false,
  },
  {
    filename: "journey-idea-to-shipped-tool.mmd",
    diagramFamily: "journey",
    category: "native",
    title: "Idea to Shipped Tool",
    description:
      "User journey map tracing the OKH product flow from raw idea through AI council, build, and public ship.",
    pending: false,
  },
  {
    filename: "gantt-mermaid-theme-builder-roadmap.mmd",
    diagramFamily: "gantt",
    category: "native",
    title: "Mermaid Theme Builder Roadmap",
    description:
      "Gantt chart of the Mermaid Theme Builder development roadmap covering v0.1 through v1.0 milestones.",
    pending: false,
  },
  {
    filename: "pie-effort-allocation.mmd",
    diagramFamily: "pie",
    category: "native",
    title: "Effort Allocation",
    description:
      "Pie chart showing percentage allocation of time and energy across OverKill Hill P³ product streams.",
    pending: true,
  },
  {
    filename: "quadrant-opportunity-map.mmd",
    diagramFamily: "quadrantChart",
    category: "native",
    title: "Opportunity Map",
    description:
      "Quadrant chart mapping OKH product ideas by effort vs. impact to identify high-leverage opportunities.",
    pending: true,
  },
  {
    filename: "requirement-firewall-and-scope.mmd",
    diagramFamily: "requirementDiagram",
    category: "native",
    title: "Firewall and Scope",
    description:
      "Requirement diagram documenting the OKH/BFS ownership firewall, scope constraints, and verification relationships.",
    pending: true,
  },
  {
    filename: "gitgraph-repo-evolution.mmd",
    diagramFamily: "gitGraph",
    category: "native",
    title: "Repo Evolution",
    description:
      "Git graph showing the branch history and merge strategy of the mermaid-theme-builder repository from init to v0.2-alpha.",
    pending: false,
  },
  {
    filename: "c4-context-overkill-ecosystem.mmd",
    diagramFamily: "c4Diagram",
    category: "native",
    title: "OKH Ecosystem Context",
    description:
      "C4 Context diagram showing the OverKill Hill P³ ecosystem: user, Mermaid Theme Builder, AskJamie, Glee-fully, and external dependencies.",
    pending: true,
  },
  {
    filename: "mindmap-overkill-hill-system.mmd",
    diagramFamily: "mindmap",
    category: "native",
    title: "OverKill Hill System",
    description:
      "Mindmap of the full OKH product system, toolchain, and brand ecosystem decomposed into branches.",
    pending: false,
  },
  {
    filename: "timeline-overkill-theme-builder-history.mmd",
    diagramFamily: "timeline",
    category: "native",
    title: "Theme Builder History",
    description:
      "Chronological timeline of Mermaid Theme Builder milestones from concept through v0.2-alpha.",
    pending: false,
  },
  {
    filename: "zenuml-council-prototype-flow.mmd",
    diagramFamily: "zenuml",
    category: "native",
    title: "Council to Prototype Flow",
    description:
      "ZenUML sequence diagram of the OKH AI council-to-prototype flow using code-first DSL syntax.",
    pending: true,
  },
  {
    filename: "sankey-effort-to-output.mmd",
    diagramFamily: "sankey",
    category: "beta",
    title: "Effort to Output",
    description:
      "Sankey diagram showing how OKH effort categories flow into product outputs and shipped tools.",
    pending: true,
  },
  {
    filename: "xychart-clarity-velocity.mmd",
    diagramFamily: "xychart",
    category: "beta",
    title: "Clarity vs. Velocity",
    description:
      "XY chart plotting OKH sprint clarity scores against delivery velocity over time.",
    pending: true,
  },
  {
    filename: "block-product-modules.mmd",
    diagramFamily: "block",
    category: "beta",
    title: "Product Modules",
    description:
      "Block diagram spatially arranging the OKH product module ecosystem in a grid layout.",
    pending: true,
  },
  {
    filename: "packet-theme-bootstrap-payload.mmd",
    diagramFamily: "packet",
    category: "beta",
    title: "Theme Bootstrap Payload",
    description:
      "Packet diagram showing the bit/byte structure of a Mermaid theme bootstrap payload header.",
    pending: true,
  },
  {
    filename: "kanban-public-alpha-board.mmd",
    diagramFamily: "kanban",
    category: "native",
    title: "Public Alpha Board",
    description:
      "Kanban board showing the Mermaid Theme Builder public alpha tasks across Backlog, In Progress, Review, and Done columns.",
    pending: true,
  },
  {
    filename: "architecture-static-app.mmd",
    diagramFamily: "architectureBeta",
    category: "beta",
    title: "Static App Architecture",
    description:
      "Architecture diagram showing the Mermaid Theme Builder static deployment topology: CDN, browser runtime, and local storage.",
    pending: true,
  },
  {
    filename: "radar-product-maturity.mmd",
    diagramFamily: "radar",
    category: "beta",
    title: "Product Maturity",
    description:
      "Radar chart scoring OKH product maturity across six dimensions: design, implementation, docs, testing, community, and governance.",
    pending: true,
  },
  {
    filename: "treemap-project-value.mmd",
    diagramFamily: "treemap",
    category: "beta",
    title: "Project Value",
    description:
      "Treemap visualizing the relative value contribution of OKH project areas by estimated impact.",
    pending: true,
  },
  {
    filename: "venn-measure-document-diagram.mmd",
    diagramFamily: "venn",
    category: "beta",
    title: "Measure, Document, Diagram",
    description:
      "Venn diagram showing the overlap between measurement, documentation, and diagramming as OKH core practices.",
    pending: true,
  },
  {
    filename: "ishikawa-premature-rendering-root-cause.mmd",
    diagramFamily: "ishikawa",
    category: "beta",
    title: "Premature Rendering Root Cause",
    description:
      "Ishikawa fishbone diagram analyzing root causes of premature diagram rendering in AI-assisted workflows.",
    pending: false,
  },
  {
    filename: "treeview-example-index.mmd",
    diagramFamily: "treeView",
    category: "beta",
    title: "Example Index",
    description:
      "Tree view listing the full OverKill Mermaid Example Pack file tree organized by diagram family.",
    pending: true,
  },
  {
    filename: "overkill-rube-goldberg-showcase.mmd",
    diagramFamily: "flowchart",
    category: "showcase",
    title: "OverKill Rube Goldberg Showcase",
    description:
      "Advanced showcase diagram: ELK layout, 6 subgraphs, 31 semantic classDef classes, clickable nodes, and brand attribution.",
    pending: false,
  },
];

export function getExampleForFamily(family: DiagramFamily): ExamplePackEntry | null {
  return EXAMPLE_PACK.find((e) => e.diagramFamily === family) ?? null;
}

export function getExampleByFilename(filename: string): ExamplePackEntry | null {
  return EXAMPLE_PACK.find((e) => e.filename === filename) ?? null;
}

export const EXAMPLE_CATEGORY_LABELS: Record<ExampleCategory, string> = {
  native: "Native",
  beta: "Beta / Renderer-dependent",
  emulated: "Emulated",
  showcase: "Showcase",
  gap: "Gap / Unsupported",
};
