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
  | "block"
  | "sankey"
  | "xychart"
  | "unknown";

export interface DetectionResult {
  family: DiagramFamily;
  label: string;
  hasThemeInit: boolean;
  warnings: string[];
}

const DIAGRAM_PATTERNS: Array<{ pattern: RegExp; family: DiagramFamily; label: string }> = [
  { pattern: /^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL|LR)\b/im, family: "flowchart", label: "Flowchart" },
  { pattern: /^\s*sequenceDiagram\b/im, family: "sequenceDiagram", label: "Sequence Diagram" },
  { pattern: /^\s*classDiagram\b/im, family: "classDiagram", label: "Class Diagram" },
  { pattern: /^\s*stateDiagram(-v2)?\b/im, family: "stateDiagram", label: "State Diagram" },
  { pattern: /^\s*erDiagram\b/im, family: "erDiagram", label: "ER Diagram" },
  { pattern: /^\s*gantt\b/im, family: "gantt", label: "Gantt Chart" },
  { pattern: /^\s*pie\b/im, family: "pie", label: "Pie Chart" },
  { pattern: /^\s*gitGraph\b/im, family: "gitGraph", label: "Git Graph" },
  { pattern: /^\s*mindmap\b/im, family: "mindmap", label: "Mindmap" },
  { pattern: /^\s*timeline\b/im, family: "timeline", label: "Timeline" },
  { pattern: /^\s*quadrantChart\b/im, family: "quadrantChart", label: "Quadrant Chart" },
  { pattern: /^\s*journey\b/im, family: "journey", label: "User Journey" },
  { pattern: /^\s*block-beta\b/im, family: "block", label: "Block Diagram" },
  { pattern: /^\s*sankey-beta\b/im, family: "sankey", label: "Sankey Diagram" },
  { pattern: /^\s*xychart-beta\b/im, family: "xychart", label: "XY Chart" },
];

export function detectDiagram(code: string): DetectionResult {
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    return { family: "unknown", label: "Unknown", hasThemeInit: false, warnings: [] };
  }

  const hasThemeInit = /%%\s*\{.*?init.*?\}.*?%%/s.test(trimmed);

  let family: DiagramFamily = "unknown";
  let label = "Unknown";

  for (const { pattern, family: f, label: l } of DIAGRAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      family = f;
      label = l;
      break;
    }
  }

  if (family === "unknown") {
    warnings.push("Could not detect diagram type. Paste a valid Mermaid diagram to enable theming.");
  }

  if (hasThemeInit) {
    warnings.push("Existing %%{init:...}%% directive detected — applying this theme will replace it.");
  }

  const hasUnsupportedChars = /[\u0000-\u001F]/.test(trimmed.replace(/\n/g, ""));
  if (hasUnsupportedChars) {
    warnings.push("Non-printable characters detected — these may cause render failures.");
  }

  const longLabel = trimmed.split("\n").find((line) => line.length > 200);
  if (longLabel) {
    warnings.push("One or more labels exceed 200 characters — long labels may cause layout issues.");
  }

  return { family, label, hasThemeInit, warnings };
}
