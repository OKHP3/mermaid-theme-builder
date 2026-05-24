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
    keyIdiom: 'flowchart LR\n  A([Start]) --> B{Decision}\n  B -- Yes --> C[Action]\n  B -- No  --> D[/Input/]\n  C --> E((End))\n  classDef accent fill:#c46a2c,color:#fff\n  class C accent',
    classDefStatus: "yes",
    themingNote:
      "Node fill/border use primaryColor and primaryBorderColor; edge labels use edgeLabelBackground. classDef lets you color individual nodes — append :::styleName after a node id.",
  },
  {
    family: "gantt",
    keyIdiom: "dateFormat YYYY-MM-DD\nsection Phase\n  Task name :done, id, 2024-01-01, 7d",
    classDefStatus: "no",
    themingNote: "Task fill/border via taskBkgColor, taskBorderColor; section bands via sectionBkgColor.",
  },
  {
    family: "pie",
    keyIdiom: 'title Chart Title\n"Slice A" : 40\n"Slice B" : 60',
    classDefStatus: "no",
    themingNote: "Slice colors cycle through pie1–pie12 themeVariables — override up to 12 segments.",
  },
  {
    family: "mindmap",
    keyIdiom: "root((Topic))\n  Branch\n    (Rounded)\n    [Square]\n    ))Cloud((",
    classDefStatus: "no",
    themingNote: "Node fill follows primaryColor; edge label backgrounds follow edgeLabelBackground.",
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
    themingNote: "classDef lets you color individual classes — add :::styleName after a class name.",
  },
  {
    family: "stateDiagram",
    keyIdiom: '[*] --> Active\nActive --> Done : complete\nDone --> [*]\nstate "Long label" as alias',
    classDefStatus: "limited",
    themingNote:
      "Composite states auto-rotate fill colors (fillType0–fillType7) by nesting depth. classDef requires stateDiagram-v2.",
  },
  {
    family: "sequenceDiagram",
    keyIdiom: "participant A as Alice\nA->>B: Hello\nloop Retry\n  B-->>A: Ack\nend",
    classDefStatus: "no",
    themingNote: "Actor styling via actorBkg, actorBorder; activation boxes via activationBkgColor.",
  },
  {
    family: "block",
    keyIdiom: 'block:group\n  A["Step 1"]\n  B["Step 2"]\nend\nA --> B\nclassDef accent fill:#c46a2c',
    classDefStatus: "yes",
    themingNote: "Block is the newest Mermaid layout engine. classDef works the same as flowchart — append :::styleName to a block id.",
  },
  {
    family: "timeline",
    keyIdiom: "title Project Milestones\nsection Q1\n  Kickoff : 2024-01-15\n  Alpha   : 2024-02-28\nsection Q2\n  Beta    : 2024-05-01",
    classDefStatus: "no",
    themingNote: "Period (section) bands cycle through cScale0–cScale11 themeVariables — override up to 12 sections.",
  },
  {
    family: "xychart",
    keyIdiom: 'xychart-beta\n  title "Revenue"\n  x-axis ["Q1", "Q2", "Q3", "Q4"]\n  y-axis "USD" 0 --> 100\n  bar [30, 45, 60, 80]\n  line [25, 40, 55, 75]',
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
    keyIdiom: "sankey-beta\nSource,Target A,10\nSource,Target B,6\nTarget A,Sink,10\nTarget B,Sink,6",
    classDefStatus: "no",
    themingNote:
      "Node and link colors inherit from the palette's primaryColor and lineColor. Individual node color is not configurable via themeVariables — palette selection is the main lever.",
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
