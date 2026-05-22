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
