// Diagram patterns aligned to mermaid v11.15.0 — update when new types ship
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

  // ── Diagram Breaker #1: bare `end` keyword used as a node ID ─────────────
  // In flowchart and sequence diagrams, `end` is a reserved keyword (it closes
  // subgraph/alt/loop blocks). Using it as an unquoted node ID or edge endpoint
  // causes a parse error. Safe uses: a standalone `end` line (subgraph closer),
  // or a quoted label such as A["end"].
  // Detection is line-aware so valid subgraph-closing `end` lines are excluded.
  if (family === "flowchart" || family === "sequenceDiagram") {
    const codeLines = trimmed.split("\n");
    const bareEndAsNode = codeLines.some((line) => {
      const stripped = line.trim();
      // A standalone 'end' on its own line closes a subgraph/alt/loop/opt/par — valid.
      if (stripped === "end") return false;
      // Comment lines — skip.
      if (stripped.startsWith("%%")) return false;

      if (family === "flowchart") {
        // 'end' used as edge source: 'end -->', 'end ---', etc.
        if (/^\s*end\s*(?:-->|---|-.->|==>|~~~)/.test(line)) return true;
        // 'end' used as edge target: '--> end' at line end (nothing after it).
        if (/(?:-->|---|-.->|==>|~~~)\s*end\s*$/.test(line)) return true;
        // 'end' with a shape-defining bracket — node definition: end[, end(, end{
        if (/\bend\s*[\[({]/.test(line)) return true;
        // 'end' with a class assignment: end:::className
        if (/\bend\s*:::/.test(line)) return true;
      }

      if (family === "sequenceDiagram") {
        // 'end' declared as a participant or actor name.
        if (/^\s*(?:participant|actor)\s+end\b/.test(line)) return true;
        // 'end' used as the message source (left side of sequence arrow).
        if (/^\s*end\s*(?:->>|-->|->|-x|-\)|--x|--\))/.test(line)) return true;
        // 'end' used as the message target (right side of sequence arrow).
        if (/(?:->>|-->|->|-x|-\)|--x|--\))\s*end\s*:/.test(line)) return true;
      }

      return false;
    });
    if (bareEndAsNode) {
      warnings.push(
        "Diagram Breaker: 'end' used as a bare node ID. Mermaid reserves 'end' to close subgraph/alt/loop blocks — using it as a node identifier will break the parser. Rename the node or wrap it in quotes: [\"end\"].",
      );
    }
  }

  // ── Diagram Breaker #2: curly braces inside %% comment lines ─────────────
  // Mermaid's parser can misinterpret { or } characters inside %% comment
  // lines as part of an init directive, causing unexpected parse failures.
  // This check excludes legitimate %%{init:...}%% directives.
  const curliesInComment = /^\s*%%(?!\s*\{)[^\n]*[{}]/m.test(trimmed);
  if (curliesInComment) {
    warnings.push(
      "Diagram Breaker: curly brace { or } found inside a %% comment line. Mermaid may interpret {} in comments as a directive fragment, causing parse errors. Move the brace outside the comment or remove it.",
    );
  }

  // ── Diagram Breaker #3: nested node definitions without quotes ────────────
  // Mermaid node label syntax uses [ ] ( ) { } to define shapes. If a label
  // itself contains an unquoted [ or ( character, the parser treats it as the
  // start of a nested node definition and breaks. Fix: wrap the label in
  // double quotes — e.g. A["label with [brackets]"].
  // Detection: a node-like token followed by [ or ( where the interior
  // contains another unquoted [ or ( before the closing delimiter.
  const nestedUnquotedNode =
    /\b\w[\w\s]*\[(?:[^"\]\n]*\[)/.test(trimmed) ||
    /\b\w[\w\s]*\((?:[^"\)\n]*\()/.test(trimmed);
  if (nestedUnquotedNode) {
    warnings.push(
      "Diagram Breaker: possible nested node definition without quotes. If a node label contains [ or ( characters, wrap the entire label in double quotes to prevent parse errors — e.g. A[\"label with [brackets]\"].",
    );
  }

  return { family, label, hasThemeInit, warnings, capability };
}
