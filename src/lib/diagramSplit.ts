/**
 * Split a single Mermaid input buffer into multiple diagrams.
 *
 * Heuristic: a "next diagram" boundary is recognized when a line at indent 0
 * matches a known top-level Mermaid diagram declaration keyword AND there has
 * already been at least one diagram-content line above it. The first diagram
 * always starts at the first non-blank line (or the start of YAML frontmatter
 * if present).
 *
 * Returns a single-entry array when the input contains zero or one diagrams.
 */

const DIAGRAM_KEYWORDS = [
  "flowchart",
  "graph",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "journey",
  "gantt",
  "pie",
  "quadrantChart",
  "requirementDiagram",
  "gitGraph",
  "mindmap",
  "timeline",
  "zenuml",
  "sankey-beta",
  "xychart-beta",
  "block-beta",
  "packet-beta",
  "kanban",
  "architecture-beta",
  "radar-beta",
  "treemap-beta",
  "C4Context",
  "C4Container",
  "C4Component",
  "C4Dynamic",
  "C4Deployment",
  "wardley-beta",
];

const KEYWORD_RE = new RegExp(
  `^(?:${DIAGRAM_KEYWORDS.map((k) => k.replace(/[-]/g, "\\-")).join("|")})\\b`,
);

export interface SplitDiagram {
  index: number;
  label: string;
  content: string;
}

export function splitDiagrams(code: string): SplitDiagram[] {
  if (!code.trim()) return [{ index: 0, label: "Diagram 1", content: code }];
  // Normalise CRLF / lone CR so the indent-detection (`raw.length === trimmed.length`)
  // is not fooled by trailing `\r` characters from pasted content.
  const normalised = code.replace(/\r\n?/g, "\n");
  const lines = normalised.split("\n");
  const boundaries: number[] = [];

  let inFrontmatter = false;
  let seenContentSinceLastBoundary = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Track YAML frontmatter so its `---` fences don't trigger boundaries.
    if (trimmed === "---") {
      if (i === 0 || !inFrontmatter) {
        // Opening frontmatter is only valid at the very start of a diagram.
        if (boundaries.length === 0 && !seenContentSinceLastBoundary) {
          inFrontmatter = true;
          continue;
        }
      } else if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }
    if (inFrontmatter) continue;

    // Skip blank lines for the "seen content" check. Comments DO count as
    // content so a block of `%%` lines between two diagrams still triggers
    // a fresh boundary on the next top-level keyword.
    if (!trimmed) continue;
    if (trimmed.startsWith("%%")) {
      if (boundaries.length > 0) seenContentSinceLastBoundary = true;
      continue;
    }

    // Detect a top-level diagram declaration at indent 0.
    if (raw.length === trimmed.length && KEYWORD_RE.test(trimmed)) {
      if (boundaries.length === 0) {
        boundaries.push(i);
        seenContentSinceLastBoundary = false;
      } else if (seenContentSinceLastBoundary) {
        boundaries.push(i);
        seenContentSinceLastBoundary = false;
      }
      continue;
    }

    if (boundaries.length > 0) seenContentSinceLastBoundary = true;
  }

  if (boundaries.length <= 1) {
    return [{ index: 0, label: "Diagram 1", content: normalised }];
  }

  const out: SplitDiagram[] = [];
  for (let b = 0; b < boundaries.length; b++) {
    const start = boundaries[b];
    const end = b + 1 < boundaries.length ? boundaries[b + 1] : lines.length;
    const slice = lines.slice(start, end).join("\n").replace(/\s+$/, "");
    const firstLine = slice.split("\n")[0]?.trim() ?? "";
    const keyword = firstLine.split(/\s+/)[0] ?? `Diagram ${b + 1}`;
    out.push({
      index: b,
      label: `${b + 1}. ${keyword}`,
      content: slice,
    });
  }
  return out;
}
