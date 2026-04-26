export const MERMAID_VERSION_VERIFIED = "11.14.0";

export const DEPENDENCY_GOVERNANCE = {
  reviewedMermaidVersion: "11.14.0",
  reviewedDate: "2026-04-25",
  dependencyRange: "^11.14.0",
  lastCapabilityRegistryUpdate: "2026-04-26",
} as const;

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
  | "zenuml"
  | "radar"
  | "unknown";

export type DiagramStability = "stable" | "beta" | "experimental" | "unknown";
export type StyleStrategy = "full" | "partial" | "limited" | "none";

export type SupportStatus = "native" | "partial" | "emulatable" | "gap" | "external";
export type ThemeConfidence = "high" | "medium" | "generic-only" | "low" | "not-applicable";
export type NotationCompliance =
  | "mermaid-native"
  | "approximation-only"
  | "not-supported"
  | "external-tool-recommended";

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
  supportStatus: SupportStatus;
  themeConfidence: ThemeConfidence;
  notationCompliance: NotationCompliance;
  description: string;
  bestUsedFor: string;
  warning: string | null;
  exampleFile: string | null;
  examplePending: boolean;
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
    supportStatus: "native",
    themeConfidence: "high",
    notationCompliance: "mermaid-native",
    description:
      "General-purpose directed graph with nodes, edges, subgraphs, and rich styling. The best-supported Mermaid diagram family for full theme control.",
    bestUsedFor:
      "Process flows, decision trees, system architecture, data pipelines, workflow diagrams.",
    warning:
      "Best-supported family for rich theme styling, classDef, subgraphs, links, and visual governance.",
    exampleFile: "flowchart-overkill-operating-system.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "UML-style sequence diagrams showing interactions between participants over time, including loops, alt blocks, and activation boxes.",
    bestUsedFor:
      "API call flows, system interactions, protocol documentation, user story sequence analysis.",
    warning:
      "Supported natively, but styling surface is narrower than flowchart; classDef/linkStyle patterns may not apply.",
    exampleFile: "sequence-council-to-prototype.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "UML class diagrams showing entities, attributes, methods, and relationships (inheritance, composition, aggregation).",
    bestUsedFor: "Domain modeling, data models, OOP design, software architecture documentation.",
    warning: null,
    exampleFile: "class-theme-builder-domain-model.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "UML state diagrams showing states, transitions, forks, joins, and composite states for modeling lifecycle behavior.",
    bestUsedFor:
      "Application state machines, UI flow modeling, lifecycle documentation, auth/session flows.",
    warning: null,
    exampleFile: "state-theme-lifecycle.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "Entity-relationship diagrams showing database tables, attributes, and relationship cardinalities (one-to-many, many-to-many).",
    bestUsedFor: "Database schema design, data modeling, API data contract documentation.",
    warning: null,
    exampleFile: "er-theme-registry.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "User journey maps showing steps, actors, and satisfaction scores across phases of a user experience.",
    bestUsedFor:
      "UX research documentation, product experience mapping, customer journey analysis.",
    warning: null,
    exampleFile: "journey-idea-to-shipped-tool.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Project timeline charts showing tasks, durations, dependencies, and milestones across a time axis.",
    bestUsedFor: "Project planning, roadmap visualization, sprint scheduling, release tracking.",
    warning: null,
    exampleFile: "gantt-mermaid-theme-builder-roadmap.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Simple proportional pie/donut charts showing categorical distribution with labeled slices.",
    bestUsedFor: "Effort allocation, budget breakdowns, categorical composition, quick data snapshots.",
    warning: null,
    exampleFile: "pie-effort-allocation.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "2×2 matrix charts for plotting items by two axes — ideal for prioritization, risk analysis, and strategic mapping.",
    bestUsedFor:
      "Opportunity mapping, priority matrices, effort-vs-impact analysis, competitive positioning.",
    warning: null,
    exampleFile: "quadrant-opportunity-map.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "SysML-inspired requirement diagrams showing requirements, test cases, and verification relationships.",
    bestUsedFor:
      "Product requirements documentation, compliance traceability, system specification.",
    warning: null,
    exampleFile: "requirement-firewall-and-scope.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Git branch and commit history visualization showing merges, branches, and cherry-picks.",
    bestUsedFor: "Branching strategy documentation, repo evolution storytelling, release history.",
    warning: null,
    exampleFile: "gitgraph-repo-evolution.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "C4 model diagrams for software architecture: Context, Container, Component, and Deployment views.",
    bestUsedFor:
      "Software architecture documentation, system context mapping, microservice topology.",
    warning:
      "Mermaid C4 support may vary by renderer and version. Treat as partial unless verified.",
    exampleFile: "c4-context-overkill-ecosystem.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Hierarchical mind maps with a root node and branching child/leaf nodes for ideation and knowledge structuring.",
    bestUsedFor:
      "Brainstorming, knowledge mapping, topic decomposition, learning outlines, project scoping.",
    warning: null,
    exampleFile: "mindmap-overkill-hill-system.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Chronological event timelines organized in sections with labeled events along a time axis.",
    bestUsedFor: "Project history, product evolution, release notes storytelling, event timelines.",
    warning: null,
    exampleFile: "timeline-overkill-theme-builder-history.mmd",
    examplePending: false,
  },
  {
    id: "zenuml",
    displayName: "ZenUML",
    declarations: /^\s*zenuml\b/im,
    stability: "stable",
    styleStrategy: "partial",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "ZenUML uses a code-like DSL for sequence-style diagrams. themeVariables apply to background and participant colors. Styling is less granular than standard sequenceDiagram.",
    supportStatus: "native",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "ZenUML is a code-first DSL for sequence diagrams embedded in Mermaid, allowing programmatic control over interaction flows.",
    bestUsedFor:
      "Developer-centric sequence docs, API choreography, code-driven interaction modeling.",
    warning: null,
    exampleFile: "zenuml-council-prototype-flow.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Flow diagrams showing proportional transfer of quantities between source and target nodes.",
    bestUsedFor: "Resource flow visualization, effort-to-output mapping, budget allocation analysis.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "sankey-effort-to-output.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "Bar and line charts with labeled axes for visualizing quantitative data series.",
    bestUsedFor: "Metric dashboards, velocity tracking, performance comparisons, trend charts.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "xychart-clarity-velocity.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "medium",
    notationCompliance: "mermaid-native",
    description:
      "Grid-based block diagrams for UI wireframes, system module layouts, and spatial component arrangements.",
    bestUsedFor: "UI layout wireframes, product module maps, spatial system diagrams.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "block-product-modules.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Network packet diagrams showing protocol header fields and their bit/byte layouts.",
    bestUsedFor:
      "Network protocol documentation, data packet structure visualization, payload mapping.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "packet-theme-bootstrap-payload.mmd",
    examplePending: false,
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
    supportStatus: "native",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Kanban boards with columns and cards for visualizing work-in-progress across workflow stages.",
    bestUsedFor: "Sprint boards, backlog visualization, WIP tracking, task status boards.",
    warning: null,
    exampleFile: "kanban-public-alpha-board.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Cloud-style architecture diagrams with service icons, groups, and directional edges.",
    bestUsedFor:
      "Infrastructure topology, cloud architecture docs, service mesh visualization.",
    warning:
      "Architecture diagrams may be beta or renderer-dependent depending on Mermaid version.",
    exampleFile: "architecture-static-app.mmd",
    examplePending: false,
  },
  {
    id: "radar",
    displayName: "Radar Chart",
    declarations: /^\s*radar-beta\b/im,
    stability: "experimental",
    styleStrategy: "limited",
    supportsClassDef: false,
    supportsLinkStyle: false,
    supportsSubgraphStyle: false,
    notes:
      "Experimental diagram type. Background and title colors apply. Radar polygon and axis colors are managed by Mermaid's internal renderer.",
    supportStatus: "partial",
    themeConfidence: "generic-only",
    notationCompliance: "mermaid-native",
    description:
      "Spider/radar charts for multi-dimensional comparison of values across named axes.",
    bestUsedFor:
      "Skill assessment, product maturity scoring, multi-criteria analysis, team capability mapping.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "radar-product-maturity.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "low",
    notationCompliance: "mermaid-native",
    description:
      "Hierarchical area charts where nested rectangles represent proportional values.",
    bestUsedFor: "Project value breakdown, budget visualization, code size analysis, portfolio maps.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "treemap-project-value.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "low",
    notationCompliance: "mermaid-native",
    description:
      "Overlapping circle diagrams showing set relationships and intersections.",
    bestUsedFor: "Concept overlap analysis, feature comparison, skill set mapping, taxonomy.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "venn-measure-document-diagram.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "low",
    notationCompliance: "mermaid-native",
    description:
      "Cause-and-effect fishbone diagrams showing contributing factors to a root problem or effect.",
    bestUsedFor:
      "Root cause analysis, quality control, incident post-mortems, engineering failure modes.",
    warning:
      "Beta or renderer-dependent. Validate in target renderer before publication.",
    exampleFile: "ishikawa-premature-rendering-root-cause.mmd",
    examplePending: false,
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
    supportStatus: "partial",
    themeConfidence: "low",
    notationCompliance: "mermaid-native",
    description:
      "Strategic mapping of components on visibility vs. evolution axes for competitive landscape analysis.",
    bestUsedFor: "Strategic positioning, technology evolution planning, build-vs-buy decisions.",
    warning:
      "Experimental. Rendering behavior may vary significantly across Mermaid versions.",
    exampleFile: null,
    examplePending: true,
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
    supportStatus: "partial",
    themeConfidence: "low",
    notationCompliance: "mermaid-native",
    description:
      "Hierarchical tree/directory view for representing nested structures such as file trees or taxonomies.",
    bestUsedFor: "File structure docs, taxonomy display, org chart approximation, content hierarchy.",
    warning:
      "Experimental. May not render consistently across all Mermaid-compatible environments.",
    exampleFile: "treeview-example-index.mmd",
    examplePending: false,
  },
];

export function getCapabilityById(id: DiagramFamily): DiagramCapability | null {
  return DIAGRAM_CAPABILITIES.find((c) => c.id === id) ?? null;
}

export type GapSupportStatus = "emulatable" | "gap" | "external";

export interface GapEntry {
  id: string;
  displayName: string;
  supportStatus: GapSupportStatus;
  themeConfidence: ThemeConfidence;
  notationCompliance: NotationCompliance;
  description: string;
  bestUsedFor: string;
  warning: string;
  approximatedBy: DiagramFamily | null;
  exampleFile: null;
  examplePending: boolean;
}

export const CAPABILITY_GAPS: GapEntry[] = [
  {
    id: "bpmn",
    displayName: "BPMN 2.0",
    supportStatus: "gap",
    themeConfidence: "not-applicable",
    notationCompliance: "not-supported",
    description:
      "Business Process Model and Notation 2.0 — an OMG standard for formal process modeling with swim lanes, gateways, events, and tasks.",
    bestUsedFor:
      "Formal business process documentation, ISO/IEC compliance workflows, enterprise BPM tooling.",
    warning:
      "Mermaid flowcharts can approximate BPMN-like visual flows, but they do not implement BPMN 2.0 semantics. Use dedicated BPMN tools (Camunda Modeler, bpmn.io) for formal compliance. This is high-leverage but outside V1 scope.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "archimate",
    displayName: "ArchiMate",
    supportStatus: "external",
    themeConfidence: "not-applicable",
    notationCompliance: "external-tool-recommended",
    description:
      "Open Group enterprise architecture modeling language covering business, application, and technology layers.",
    bestUsedFor:
      "Enterprise architecture documentation, TOGAF compliance, EA governance frameworks.",
    warning:
      "ArchiMate notation is not supported in Mermaid. Use Archi, Sparx EA, or other ArchiMate-certified tools. Flowcharts can approximate high-level EA narratives only.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "sysml",
    displayName: "SysML",
    supportStatus: "external",
    themeConfidence: "not-applicable",
    notationCompliance: "external-tool-recommended",
    description:
      "Systems Modeling Language — a UML profile for systems engineering covering structure, behavior, requirements, and parametrics.",
    bestUsedFor:
      "Systems engineering documentation, hardware-software integration, requirements traceability.",
    warning:
      "SysML notation is not supported in Mermaid. Use Cameo Systems Modeler, MagicDraw, or other SysML tools. Mermaid's requirementDiagram approximates requirements views only.",
    approximatedBy: "requirementDiagram",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "value-stream-map",
    displayName: "Value Stream Map",
    supportStatus: "emulatable",
    themeConfidence: "low",
    notationCompliance: "approximation-only",
    description:
      "Lean manufacturing/service diagrams showing value-add and waste steps across a production or delivery process.",
    bestUsedFor: "Lean process improvement, waste identification, delivery pipeline optimization.",
    warning:
      "Mermaid flowcharts can approximate VSM-style flows using classDef to differentiate value-add vs. waste steps, but dedicated VSM symbols (push arrows, kaizen bursts, inventory icons) are not available.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "service-blueprint",
    displayName: "Service Blueprint",
    supportStatus: "emulatable",
    themeConfidence: "low",
    notationCompliance: "approximation-only",
    description:
      "Service design diagrams showing frontstage/backstage actions, support processes, and physical evidence across customer journey stages.",
    bestUsedFor: "Service design, CX operations mapping, omni-channel experience documentation.",
    warning:
      "Mermaid sequence or flowchart diagrams can approximate service blueprints, but swim-lane separation and the line of visibility are not natively supported.",
    approximatedBy: "sequenceDiagram",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "okr-alignment-map",
    displayName: "OKR Alignment Map",
    supportStatus: "emulatable",
    themeConfidence: "low",
    notationCompliance: "approximation-only",
    description:
      "Hierarchical alignment diagrams showing Objectives, Key Results, and their organizational linkage across teams.",
    bestUsedFor: "Strategic alignment documentation, OKR rollout visualization, goal hierarchy mapping.",
    warning:
      "OKR alignment maps can be approximated using Mermaid flowcharts or mindmaps, but dedicated OKR tooling (Lattice, Betterworks) provides richer semantic modeling.",
    approximatedBy: "mindmap",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "dfd",
    displayName: "Data Flow Diagram",
    supportStatus: "emulatable",
    themeConfidence: "low",
    notationCompliance: "approximation-only",
    description:
      "Gane-Sarson or Yourdon/DeMarco DFD notation showing data stores, processes, external entities, and data flows.",
    bestUsedFor:
      "System analysis, security threat modeling, data privacy documentation, legacy system analysis.",
    warning:
      "DFD notation (circles for processes, rectangles for external entities, parallel lines for data stores) can be approximated using Mermaid flowcharts, but formal DFD symbols are not available.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "decision-tree",
    displayName: "Decision Tree",
    supportStatus: "emulatable",
    themeConfidence: "medium",
    notationCompliance: "approximation-only",
    description:
      "Tree-structured diagrams showing decision points, branches, probabilities, and outcome leaves.",
    bestUsedFor:
      "Decision analysis, ML model documentation, troubleshooting guides, policy rule visualization.",
    warning:
      "Decision trees map naturally to Mermaid flowcharts using diamond gate nodes for decisions and leaf nodes for outcomes. Full probability annotations are not natively supported.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "org-chart",
    displayName: "Org Chart",
    supportStatus: "emulatable",
    themeConfidence: "medium",
    notationCompliance: "approximation-only",
    description:
      "Hierarchical organization charts showing reporting relationships, teams, and roles.",
    bestUsedFor: "Organizational structure documentation, team hierarchy, stakeholder mapping.",
    warning:
      "Org charts can be approximated using Mermaid flowcharts with TD layout. Dedicated org chart tools (OrgChartJS, Lucidchart) provide more specialized rendering with photo/avatar support.",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
  {
    id: "threat-model-dfd",
    displayName: "Threat Model DFD",
    supportStatus: "emulatable",
    themeConfidence: "low",
    notationCompliance: "approximation-only",
    description:
      "STRIDE/PASTA-style threat model data flow diagrams showing trust boundaries, data stores, processes, and threat vectors.",
    bestUsedFor:
      "Security threat modeling, privacy impact assessment, system security documentation.",
    warning:
      "Threat model DFDs (STRIDE, PASTA) can be approximated using Mermaid flowcharts with dashed trust boundaries and classDef threat annotations, but formal threat modeling semantics require dedicated tools (Threat Dragon, OWASP Threat Dragon, IriusRisk).",
    approximatedBy: "flowchart",
    exampleFile: null,
    examplePending: true,
  },
];

export const STABILITY_LABELS: Record<DiagramStability, string> = {
  stable: "Stable",
  beta: "Beta",
  experimental: "Experimental",
  unknown: "Unknown",
};

export const SUPPORT_STATUS_LABELS: Record<SupportStatus | GapSupportStatus, string> = {
  native: "Native",
  partial: "Partial",
  emulatable: "Emulatable",
  gap: "Gap",
  external: "External",
};

export const THEME_CONFIDENCE_LABELS: Record<ThemeConfidence, string> = {
  high: "High",
  medium: "Medium",
  "generic-only": "Generic Only",
  low: "Low",
  "not-applicable": "N/A",
};

export const NOTATION_COMPLIANCE_LABELS: Record<NotationCompliance, string> = {
  "mermaid-native": "Mermaid-native",
  "approximation-only": "Approximation only",
  "not-supported": "Not supported",
  "external-tool-recommended": "External tool recommended",
};

export const SUPPORT_STATUS_STYLES: Record<SupportStatus | GapSupportStatus, string> = {
  native:
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50",
  partial:
    "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/50",
  emulatable:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50",
  gap: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50",
  external:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50",
};

export const THEME_CONFIDENCE_STYLES: Record<ThemeConfidence, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  "generic-only": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "not-applicable": "bg-muted text-muted-foreground",
};
