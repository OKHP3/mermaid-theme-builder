export const MERMAID_VERSION_VERIFIED = "11.14.0";

export type DiagramFamily =
  | "flowchart"
  | "sequenceDiagram"
  | "classDiagram"
  | "stateDiagram"
  | "erDiagram"
  | "gantt"
  | "pie"
  | "gitGraph"
  | "mindmap"
  | "timeline"
  | "quadrantChart"
  | "journey"
  | "requirementDiagram"
  | "c4Diagram"
  | "architectureBeta"
  | "block"
  | "sankey"
  | "xychart"
  | "packet"
  | "kanban"
  | "treemap"
  | "venn"
  | "ishikawa"
  | "wardley"
  | "treeView"
  | "unknown";

export type DiagramStability = "stable" | "beta" | "experimental" | "unknown";

export type StyleStrategy = "full" | "partial" | "limited" | "none";

export interface DiagramCapability {
  id: DiagramFamily;
  displayName: string;
  declarations: RegExp;
  stability: DiagramStability;
  styleStrategy: StyleStrategy;
  supportsClassDef: boolean;
  supportsLinkStyle: boolean;
  supportsSubgraphStyle: boolean;
  notes: string | null;
}

export const DIAGRAM_CAPABILITIES: DiagramCapability[] = [
  {
    id: "flowchart",
    displayName: "Flowchart",
    declarations: /^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b/im,
    stability: "stable",
    styleStrategy: "full",
    supportsClassDef: true,
    supportsLinkStyle: true,
    supportsSubgraphStyle: true,
    notes: null,
  },
  {
    id: "sequenceDiagram",
    displayName: "Sequence Diagram",
    declarations: /^\s*sequenceDiagram\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Theming applies to backgrounds, actor boxes, and line colors. Sequence-specific elements (activation boxes, note fill) respond partially to themeVariables.",
  },
  {
    id: "classDiagram",
    displayName: "Class Diagram",
    declarations: /^\s*classDiagram\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: true,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Theming applies to class box backgrounds, borders, and text. classDef is supported for fine-grained node styling. Relationship line labels use the theme's text color.",
  },
  {
    id: "stateDiagram",
    displayName: "State Diagram",
    declarations: /^\s*stateDiagram(-v2)?\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: true,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Theming applies to state box backgrounds, borders, and transition lines. classDef is supported. Composite state backgrounds use clusterBkg.",
  },
  {
    id: "erDiagram",
    displayName: "ER Diagram",
    declarations: /^\s*erDiagram\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Theming applies to entity backgrounds, borders, and text. Relationship lines use lineColor. Attribute text uses primaryTextColor.",
  },
  {
    id: "gantt",
    displayName: "Gantt Chart",
    declarations: /^\s*gantt\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background and grid colors apply. Individual task bar colors are managed by Mermaid's internal Gantt palette and cannot be overridden via themeVariables.",
  },
  {
    id: "pie",
    displayName: "Pie Chart",
    declarations: /^\s*pie\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background and title colors apply. Pie slice colors cycle through Mermaid's internal palette — they are not directly controlled by themeVariables.",
  },
  {
    id: "gitGraph",
    displayName: "Git Graph",
    declarations: /^\s*gitGraph\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background colors apply. Branch and commit colors are managed by Mermaid's gitGraph renderer and do not respond to standard themeVariables.",
  },
  {
    id: "mindmap",
    displayName: "Mindmap",
    declarations: /^\s*mindmap\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background colors apply. Node fill and border colors are managed by Mermaid's mindmap renderer — themeVariables have limited effect on individual node fills.",
  },
  {
    id: "timeline",
    displayName: "Timeline",
    declarations: /^\s*timeline\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background and title colors apply. Section and event colors respond partially to themeVariables. Full color control requires renderer-specific CSS.",
  },
  {
    id: "quadrantChart",
    displayName: "Quadrant Chart",
    declarations: /^\s*quadrantChart\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background, axis labels, and grid lines apply. Quadrant fill colors and data point colors respond partially to themeVariables.",
  },
  {
    id: "journey",
    displayName: "User Journey",
    declarations: /^\s*journey\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Background and global text colors apply. Task bar and section header colors are managed by Mermaid's internal journey renderer.",
  },
  {
    id: "requirementDiagram",
    displayName: "Requirement Diagram",
    declarations: /^\s*requirementDiagram\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Theming applies to requirement box backgrounds, borders, and text. Relationship lines use lineColor.",
  },
  {
    id: "c4Diagram",
    displayName: "C4 Diagram",
    declarations: /^\s*c4(Context|Container|Component|Dynamic|Deployment)\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "C4 container, component, and person colors are partially influenced by themeVariables. Background and text apply reliably. C4-specific boundary and system colors may require additional CSS.",
  },
  {
    id: "architectureBeta",
    displayName: "Architecture",
    declarations: /^\s*architecture-beta\b/im,
    stability: "beta",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Beta diagram type. Node backgrounds and line colors apply. Architecture diagram styling may change in future Mermaid releases.",
  },
  {
    id: "block",
    displayName: "Block Diagram",
    declarations: /^\s*block-beta\b/im,
    stability: "beta",
    styleStrategy: "partial",
    supportsClassDef: true,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Beta diagram type. Theming applies to block backgrounds, borders, and text. classDef is supported for custom block styling.",
  },
  {
    id: "sankey",
    displayName: "Sankey Diagram",
    declarations: /^\s*sankey-beta\b/im,
    stability: "beta",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Beta diagram type. Node and link colors use Mermaid's internal color cycling. themeVariables do not directly control individual flow colors.",
  },
  {
    id: "xychart",
    displayName: "XY Chart",
    declarations: /^\s*xychart-beta\b/im,
    stability: "beta",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Beta diagram type. Background, axis labels, and titles apply. Bar and line series colors respond partially to themeVariables.",
  },
  {
    id: "packet",
    displayName: "Packet Diagram",
    declarations: /^\s*packet-beta\b/im,
    stability: "beta",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Beta diagram type. Background and text colors apply. Packet field-specific colors are not controlled by themeVariables.",
  },
  {
    id: "kanban",
    displayName: "Kanban",
    declarations: /^\s*kanban\b/im,
    stability: "stable",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Card background and border colors are partially influenced by themeVariables. Column header colors are managed by Mermaid's internal kanban renderer.",
  },
  {
    id: "treemap",
    displayName: "Treemap",
    declarations: /^\s*treemap-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type. Node fill colors use Mermaid's internal color cycling and do not respond to standard themeVariables.",
  },
  {
    id: "venn",
    displayName: "Venn Diagram",
    declarations: /^\s*venn-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type. Circle fill colors and labels respond partially to themeVariables. Background applies reliably.",
  },
  {
    id: "ishikawa",
    displayName: "Ishikawa (Fishbone)",
    declarations: /^\s*ishikawa-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type (cause-effect/fishbone). themeVariables apply to background and spine line colors. Branch-level node colors are not individually controllable.",
  },
  {
    id: "wardley",
    displayName: "Wardley Map",
    declarations: /^\s*wardley-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type. themeVariables apply to background colors. Component and evolution axis styles are primarily managed by Mermaid's internal Wardley renderer.",
  },
  {
    id: "treeView",
    displayName: "Tree View",
    declarations: /^\s*treeView-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type. Theming support is limited and this diagram type may not be stable across Mermaid versions.",
  },
];

export function getCapabilityById(id: DiagramFamily): DiagramCapability | null {
  return DIAGRAM_CAPABILITIES.find((c) => c.id === id) ?? null;
}

export const STABILITY_LABELS: Record<DiagramStability, string> = {
  stable: "Stable",
  beta: "Beta",
  experimental: "Experimental",
  unknown: "Unknown",
};
