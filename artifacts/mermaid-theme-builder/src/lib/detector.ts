import capabilitiesData from "@/data/mermaid-capabilities.json";

export type StyleSupport = "high" | "medium" | "generic-theme-only" | "unsupported" | "unknown";
export type DiagramStatus = "stable" | "beta" | "experimental" | "unknown";

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
  | "venn"
  | "ishikawa"
  | "wardley"
  | "unknown";

export interface DiagramCapability {
  id: string;
  status: DiagramStatus;
  styleSupport: StyleSupport;
  supportsThemeVariables: boolean;
  supportsClassDef: boolean;
  supportsLinkStyle: boolean;
  supportsClickableNodes: boolean;
  notes: string;
}

export interface DetectionResult {
  family: DiagramFamily;
  label: string;
  hasThemeInit: boolean;
  warnings: string[];
  capability: DiagramCapability | null;
  reviewedMermaidVersion: string;
}

const DIAGRAM_PATTERNS: Array<{ pattern: RegExp; family: DiagramFamily; label: string }> = [
  { pattern: /^\s*(flowchart|graph)\s+(TD|TB|BT|LR|RL)\b/im, family: "flowchart", label: "Flowchart" },
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
  { pattern: /^\s*venn-beta\b/im, family: "venn", label: "Venn Diagram" },
  { pattern: /^\s*ishikawa-beta\b/im, family: "ishikawa", label: "Ishikawa Diagram" },
  { pattern: /^\s*wardley-beta\b/im, family: "wardley", label: "Wardley Map" },
];

/** Look up capability metadata from the registry by diagram family id. */
function lookupCapability(family: DiagramFamily): DiagramCapability | null {
  if (family === "unknown") return null;
  const entry = capabilitiesData.diagramTypes.find(
    (d) =>
      d.id === family ||
      d.aliases.includes(family) ||
      // handle alias patterns like "sankey-beta" matching family "sankey"
      d.aliases.some((a) => a.replace(/-beta$/, "") === family),
  );
  if (!entry) return null;
  return {
    id: entry.id,
    status: entry.status as DiagramStatus,
    styleSupport: entry.styleSupport as StyleSupport,
    supportsThemeVariables: entry.supportsThemeVariables,
    supportsClassDef: entry.supportsClassDef,
    supportsLinkStyle: entry.supportsLinkStyle,
    supportsClickableNodes: entry.supportsClickableNodes,
    notes: entry.notes,
  };
}

export const REVIEWED_MERMAID_VERSION = capabilitiesData.reviewedMermaidVersion;

export function detectDiagram(code: string): DetectionResult {
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    return {
      family: "unknown",
      label: "Unknown",
      hasThemeInit: false,
      warnings: [],
      capability: null,
      reviewedMermaidVersion: REVIEWED_MERMAID_VERSION,
    };
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

  const capability = lookupCapability(family);

  if (family === "unknown") {
    warnings.push("Could not detect diagram type. Paste a valid Mermaid diagram to enable theming.");
  } else if (capability) {
    if (capability.status === "experimental") {
      warnings.push(
        `${label} is an experimental diagram type. Theme variable support is unreliable and the API may change in future Mermaid versions.`,
      );
    } else if (capability.status === "beta") {
      warnings.push(
        `${label} is a beta diagram type. The API may change in future Mermaid versions.`,
      );
    }

    if (capability.styleSupport === "unsupported") {
      warnings.push(
        `Theme variables have no reliable effect on ${label}. The init directive will be added but visual theming is not supported.`,
      );
    } else if (capability.styleSupport === "generic-theme-only") {
      warnings.push(
        `${label} only responds to generic theme variables (background, primary). Per-element color control is limited.`,
      );
    }
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

  return { family, label, hasThemeInit, warnings, capability, reviewedMermaidVersion: REVIEWED_MERMAID_VERSION };
}
