import type { DiagramFamily } from "@/data/mermaid-capabilities";

export type ClassDefStatus = "yes" | "no" | "limited";

export interface FamilySyntaxHint {
  family: DiagramFamily;
  keyIdiom: string;
  classDefStatus: ClassDefStatus;
  themingNote: string;
}

const HINTS: FamilySyntaxHint[] = [
  {
    family: "flowchart",
    keyIdiom:
      "flowchart LR\n  A([Start]) --> B{Decision}\n  B -- Yes --> C[Action]\n  B -- No  --> D[/Input/]\n  C --> E((End))\n  classDef accent fill:#c46a2c,color:#fff\n  class C accent",
    classDefStatus: "yes",
    themingNote:
      "Node fill/border use primaryColor and primaryBorderColor; edge labels use edgeLabelBackground. classDef lets you color individual nodes — append :::styleName after a node id.",
  },
  {
    family: "gantt",
    keyIdiom: "dateFormat YYYY-MM-DD\nsection Phase\n  Task name :done, id, 2024-01-01, 7d",
    classDefStatus: "no",
    themingNote:
      "Task fill/border via taskBkgColor, taskBorderColor; section bands via sectionBkgColor.",
  },
  {
    family: "pie",
    keyIdiom: 'title Chart Title\n"Slice A" : 40\n"Slice B" : 60',
    classDefStatus: "no",
    themingNote:
      "Slice colors cycle through pie1–pie12 themeVariables — override up to 12 segments.",
  },
  {
    family: "mindmap",
    keyIdiom: "root((Topic))\n  Branch\n    (Rounded)\n    [Square]\n    ))Cloud((",
    classDefStatus: "no",
    themingNote:
      "Node fill follows primaryColor; edge label backgrounds follow edgeLabelBackground.",
  },
  {
    family: "erDiagram",
    keyIdiom: 'CUSTOMER {\n  string name\n  int id PK\n}\nCUSTOMER ||--o{ ORDER : "places"',
    classDefStatus: "no",
    themingNote: "Entity blocks use primaryColor; relationship lines use lineColor.",
  },
  {
    family: "classDiagram",
    keyIdiom: "class Animal {\n  +String name\n  +speak() void\n}\nAnimal <|-- Dog",
    classDefStatus: "yes",
    themingNote:
      "classDef lets you color individual classes — add :::styleName after a class name.",
  },
  {
    family: "stateDiagram",
    keyIdiom:
      '[*] --> Active\nActive --> Done : complete\nDone --> [*]\nstate "Long label" as alias',
    classDefStatus: "limited",
    themingNote:
      "Composite states auto-rotate fill colors (fillType0–fillType7) by nesting depth. classDef requires stateDiagram-v2.",
  },
  {
    family: "sequenceDiagram",
    keyIdiom: "participant A as Alice\nA->>B: Hello\nloop Retry\n  B-->>A: Ack\nend",
    classDefStatus: "no",
    themingNote:
      "Actor styling via actorBkg, actorBorder; activation boxes via activationBkgColor.",
  },
  {
    family: "block",
    keyIdiom:
      'block:group\n  A["Step 1"]\n  B["Step 2"]\nend\nA --> B\nclassDef accent fill:#c46a2c',
    classDefStatus: "yes",
    themingNote:
      "Block is the newest Mermaid layout engine. classDef works the same as flowchart — append :::styleName to a block id.",
  },
  {
    family: "timeline",
    keyIdiom:
      "title Project Milestones\nsection Q1\n  Kickoff : 2024-01-15\n  Alpha   : 2024-02-28\nsection Q2\n  Beta    : 2024-05-01",
    classDefStatus: "no",
    themingNote:
      "Period (section) bands cycle through cScale0–cScale11 themeVariables — override up to 12 sections.",
  },
  {
    family: "xychart",
    keyIdiom:
      'xychart-beta\n  title "Revenue"\n  x-axis ["Q1", "Q2", "Q3", "Q4"]\n  y-axis "USD" 0 --> 100\n  bar [30, 45, 60, 80]\n  line [25, 40, 55, 75]',
    classDefStatus: "no",
    themingNote:
      "Bar/line colors come from xyChart.plotColorPalette (comma-separated hex list). Background and axis labels use xyChart.backgroundColor and xyChart.plotColorPalette.",
  },
  {
    family: "quadrantChart",
    keyIdiom:
      'quadrantChart\n  title "Priority Matrix"\n  x-axis "Low Effort" --> "High Effort"\n  y-axis "Low Impact" --> "High Impact"\n  quadrant-1 Quick Wins\n  quadrant-2 Major Projects\n  quadrant-3 Fill-ins\n  quadrant-4 Consider\n  Feature A: [0.3, 0.6]',
    classDefStatus: "no",
    themingNote:
      "Quadrant backgrounds use quadrant1–quadrant4 themeVariables; point fill uses quadrantPointFill; axis labels use primaryTextColor.",
  },
  {
    family: "sankey",
    keyIdiom:
      "sankey-beta\nSource,Target A,10\nSource,Target B,6\nTarget A,Sink,10\nTarget B,Sink,6",
    classDefStatus: "no",
    themingNote:
      "Node and link colors inherit from the palette's primaryColor and lineColor. Individual node color is not configurable via themeVariables — palette selection is the main lever.",
  },
  {
    family: "journey",
    keyIdiom:
      "journey\n  title My Working Day\n  section Work\n    Make tea: 5: Me\n    Do work: 1: Me, Cat\n  section Home\n    Relax: 5: Me",
    classDefStatus: "no",
    themingNote:
      "Background and global text colors apply. Task bar fill and section header colors are managed by Mermaid's internal journey renderer — palette selection is the main lever.",
  },
  {
    family: "gitGraph",
    keyIdiom:
      "gitGraph\n  commit\n  branch feature\n  checkout feature\n  commit\n  commit\n  checkout main\n  merge feature",
    classDefStatus: "no",
    themingNote:
      "Background colors apply. Branch lines and commit node colors are managed by Mermaid's gitGraph renderer and do not respond to standard themeVariables.",
  },
  {
    family: "requirementDiagram",
    keyIdiom:
      'requirementDiagram\n  requirement Auth_Req {\n    id: 1\n    text: "System must authenticate users"\n    risk: high\n    verifyMethod: test\n  }\n  element AuthModule {\n    type: simulation\n  }\n  Auth_Req - satisfies -> AuthModule',
    classDefStatus: "no",
    themingNote:
      "Requirement box backgrounds, borders, and text respond to themeVariables. Relationship lines use lineColor.",
  },
  {
    family: "c4Diagram",
    keyIdiom:
      'C4Context\n  title System Context\n  Person(user, "User", "End user")\n  System(sys, "My System", "Core application")\n  Rel(user, sys, "Uses")',
    classDefStatus: "no",
    themingNote:
      "Person and system block colors are partially influenced by themeVariables. Background and text apply reliably. C4-specific boundary colors may require additional CSS.",
  },
  {
    family: "architectureBeta",
    keyIdiom:
      "architecture-beta\n  group api[Backend]\n  service db(database)[Database] in api\n  service server(server)[API Server] in api\n  db:L -- R:server",
    classDefStatus: "no",
    themingNote:
      "Node backgrounds and connector colors apply. Architecture diagram styling is beta and may change in future Mermaid releases.",
  },
  {
    family: "packet",
    keyIdiom:
      'packet-beta\n  title TCP Header\n  0-15: "Source Port"\n  16-31: "Destination Port"\n  32-63: "Sequence Number"',
    classDefStatus: "no",
    themingNote:
      "Background and text colors apply. Packet field-level colors are not individually controlled by themeVariables — palette selection is the main lever.",
  },
  {
    family: "kanban",
    keyIdiom:
      'kanban\n  todo["To Do"]\n    t1["Design tokens"]\n    t2["Write tests"]\n  doing["In Progress"]\n    t3["Theme engine"]\n  done["Done"]\n    t4["Palette setup"]',
    classDefStatus: "no",
    themingNote:
      "Card backgrounds and borders are partially influenced by themeVariables. Column header colors are managed by Mermaid's internal kanban renderer.",
  },
  {
    family: "zenuml",
    keyIdiom:
      'zenuml\n  @Actor Alice\n  @Participant Bob\n  Alice -> Bob: "Hello"\n  Bob -> Alice: return "Hi"\n  while Retry {\n    Alice -> Bob: "Ping"\n  }',
    classDefStatus: "no",
    themingNote:
      "themeVariables apply to background and participant colors. Styling is less granular than standard sequenceDiagram — use actorBkg and primaryColor for best results.",
  },
  {
    family: "radar",
    keyIdiom:
      'radar-beta\n  title Team Skills\n  axis be["Backend"], fe["Frontend"], ux["UX"]\n  curve a["Alice"]{85, 70, 60}\n  curve b["Bob"]{65, 85, 75}\n  max 100\n  min 0',
    classDefStatus: "no",
    themingNote:
      "Background and title colors apply. Radar polygon fill and axis line colors are managed by Mermaid's internal renderer — palette selection is the main lever.",
  },
  {
    family: "treemap",
    keyIdiom:
      'treemap-beta\n  "Category A"\n    "Item A1": 10\n    "Item A2": 20\n  "Category B"\n    "Item B1": 15\n    "Item B2": 25',
    classDefStatus: "no",
    themingNote:
      "Node fill colors use Mermaid's internal color cycling and do not respond to standard themeVariables. Background applies reliably.",
  },
  {
    family: "venn",
    keyIdiom:
      "venn-beta\n  A[Measure]\n  B[Document]\n  C[Diagram]\n  A&B[Auditable Records]\n  A&B&C[Visual Governance]",
    classDefStatus: "no",
    themingNote:
      "Experimental. Circle fill colors and label text respond partially to themeVariables. Background applies reliably. Validate in your target renderer before publication.",
  },
  {
    family: "ishikawa",
    keyIdiom:
      "fishbone\n  title Why Diagrams Fail\n  section Syntax\n    Missing init block : Syntax\n    Wrong keyword : Syntax\n  section Renderer\n    Version mismatch : Renderer",
    classDefStatus: "no",
    themingNote:
      "Experimental. themeVariables apply to background and spine line colors. Branch-level node colors are not individually controllable.",
  },
  {
    family: "wardley",
    keyIdiom:
      "wardley-beta\n  title Evolution Map\n  anchor User [0.95, 0.50]\n  component Service [0.65, 0.45]\n  component Platform [0.35, 0.30]\n  User --> Service\n  Service --> Platform",
    classDefStatus: "no",
    themingNote:
      "Beta. themeVariables apply to background colors. Component node and evolution axis styles are primarily managed by Mermaid's internal Wardley renderer. handDrawn look is not supported.",
  },
  {
    family: "treeView",
    keyIdiom:
      'treeView-beta\n  root["/"]\n    src["src/"]\n      lib["lib/"]\n        themeEngine.ts\n    public["public/"]',
    classDefStatus: "no",
    themingNote:
      "Experimental. Theming support is limited — background and primary text colors apply. This diagram type may not be stable across Mermaid versions.",
  },
  {
    family: "eventModeling",
    keyIdiom:
      "eventmodeling\n  title Order Lifecycle\n  Command PlaceOrder\n  Event OrderPlaced\n  Command ShipOrder\n  Event OrderShipped",
    classDefStatus: "no",
    themingNote:
      "New in Mermaid 11.15.0. Background and primary colors from themeVariables apply; per-element styling is not available. Not available in Mermaid installations older than 11.15.0.",
  },
];

const HINT_MAP = new Map<DiagramFamily, FamilySyntaxHint>(HINTS.map((h) => [h.family, h]));

export function getFamilySyntaxHint(family: DiagramFamily): FamilySyntaxHint | null {
  return HINT_MAP.get(family) ?? null;
}

const STORAGE_PREFIX = "mtb.hint-dismissed.";

function storageKey(family: DiagramFamily): string {
  return `${STORAGE_PREFIX}${family}`;
}

export function isHintDismissed(family: DiagramFamily): boolean {
  try {
    return window.localStorage.getItem(storageKey(family)) === "1";
  } catch {
    return false;
  }
}

export function dismissHint(family: DiagramFamily): void {
  try {
    window.localStorage.setItem(storageKey(family), "1");
  } catch {
    // Storage unavailable — dismissal is session-only
  }
}

export function clearAllDismissals(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — nothing to clear
  }
}
