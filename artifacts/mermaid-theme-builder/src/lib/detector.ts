import {
  DIAGRAM_CAPABILITIES,
  getCapabilityById,
  type DiagramFamily,
  type DiagramCapability,
} from "@/data/mermaid-capabilities";

export type { DiagramFamily } from "@/data/mermaid-capabilities";
export type { DiagramCapability } from "@/data/mermaid-capabilities";

export interface DetectionResult {
  family: DiagramFamily;
  label: string;
  hasThemeInit: boolean;
  warnings: string[];
  capability: DiagramCapability | null;
}

export function detectDiagram(code: string): DetectionResult {
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    return { family: "unknown", label: "Unknown", hasThemeInit: false, warnings: [], capability: null };
  }

  const hasThemeInit = /%%\s*\{.*?init.*?\}.*?%%/s.test(trimmed);
  const hasYamlFrontmatter = /^---\s*\n[\s\S]*?\n---/.test(trimmed);

  let family: DiagramFamily = "unknown";
  let label = "Unknown";

  for (const cap of DIAGRAM_CAPABILITIES) {
    if (cap.declarations.test(trimmed)) {
      family = cap.id;
      label = cap.displayName;
      break;
    }
  }

  const capability = family !== "unknown" ? getCapabilityById(family) : null;

  if (family === "unknown") {
    warnings.push("Could not detect diagram type. Paste a valid Mermaid diagram to enable theming.");
  }

  if (hasThemeInit) {
    warnings.push("Existing %%{init:...}%% directive detected — applying this theme will replace it.");
  }

  if (hasYamlFrontmatter) {
    warnings.push("YAML frontmatter detected — config directives (layout, theme) will be replaced when this palette theme is applied.");
  }

  const hasUnsupportedChars = /[\u0000-\u001F]/.test(trimmed.replace(/\n/g, ""));
  if (hasUnsupportedChars) {
    warnings.push("Non-printable characters detected — these may cause render failures.");
  }

  const longLabel = trimmed.split("\n").find((line) => line.length > 200);
  if (longLabel) {
    warnings.push("One or more labels exceed 200 characters — long labels may cause layout issues.");
  }

  return { family, label, hasThemeInit, warnings, capability };
}
