import { type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Single source of truth for all syntax-highlight color constants and pure
// highlight functions used across the Code tab (HighlightedCode) and the
// classDef preview panel (ClassBrowser).
//
// Both components import from here. ClassBrowser and HighlightedCode re-export
// these symbols so that existing import paths in consumers and tests continue
// to resolve without change.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

/** Colors for classDef syntax highlighting (rustOrange/teal/sky/cream palette). */
export const HL = {
  keyword: "#c46a2c", // rust-orange — "classDef"
  name: "#e8d9c0", // bright cream — class name identifier
  key: "#5fa89a", // forge teal — property keys (fill, stroke, color…)
  hex: "#9ecfe8", // sky blue — hex color values
  value: "#c8b89a", // warm beige — non-hex values (bold, 2px, normal…)
  punct: "#7a7060", // dimmed — commas, colons, punctuation
} as const;

/** Colors for %%{init:...}%% directive syntax highlighting. */
export const INIT_HL = {
  bracket: "#c8a870", // warm amber — %%{ and }%% delimiters
  content: "#8da89a", // muted teal-gray — directive body
} as const;

/** Color for %% comment line syntax highlighting. */
export const COMMENT_HL = {
  text: "#7a7568", // dimmed warm gray — %% comment lines
} as const;

// ---------------------------------------------------------------------------
// classDef highlight functions
// ---------------------------------------------------------------------------

/**
 * Highlight the key:value properties segment of a classDef line.
 * Returns an array of colored spans for keys, colons, values, and punctuation.
 * Exported for testing.
 */
export function highlightPropsSegment(props: string, baseKey: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match key:value pairs separated by commas; values may include non-hex tokens
  const re = /([\w-]+)(:)(#[0-9a-fA-F]{3,8}|[\w.%-]+(?:\s+[\w.%-]+)*)/g;
  let last = 0;
  let idx = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(props)) !== null) {
    // anything between the last match and this one (commas, spaces)
    if (m.index > last) {
      nodes.push(
        <span key={`${baseKey}-p${idx}`} style={{ color: HL.punct }}>
          {props.slice(last, m.index)}
        </span>
      );
    }
    const isHex = m[3].startsWith("#");
    nodes.push(
      <span key={`${baseKey}-k${idx}`} style={{ color: HL.key }}>
        {m[1]}
      </span>,
      <span key={`${baseKey}-c${idx}`} style={{ color: HL.punct }}>
        {m[2]}
      </span>,
      <span key={`${baseKey}-v${idx}`} style={{ color: isHex ? HL.hex : HL.value }}>
        {m[3]}
      </span>
    );
    last = re.lastIndex;
    idx++;
  }

  if (last < props.length) {
    nodes.push(
      <span key={`${baseKey}-tail`} style={{ color: HL.punct }}>
        {props.slice(last)}
      </span>
    );
  }
  return nodes;
}

/**
 * Highlight a single classDef line.
 * Applies rust-orange keyword, cream name, teal/sky/beige property tokens.
 * Exported for testing.
 */
export function highlightClassDefLine(line: string, lineIdx: number): ReactNode {
  try {
    // Expected format: classDef <name> key:val,key:val,...
    const m = line.match(/^(classDef)(\s+)(\S+)(\s+)(.+)$/);
    if (!m) {
      // Not a standard classDef line — render dimmed
      return (
        <span key={lineIdx} style={{ color: HL.punct }}>
          {line}
        </span>
      );
    }
    const [, keyword, sp1, name, sp2, props] = m;
    return (
      <span key={lineIdx}>
        <span style={{ color: HL.keyword }}>{keyword}</span>
        {sp1}
        <span style={{ color: HL.name, fontWeight: 600 }}>{name}</span>
        {sp2}
        {highlightPropsSegment(props, String(lineIdx))}
      </span>
    );
  } catch {
    return <span key={lineIdx}>{line}</span>;
  }
}

/**
 * Highlight a full block of classDef lines.
 * Exported for testing.
 */
export function highlightClassDefBlock(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {highlightClassDefLine(line, i)}
      {i < lines.length - 1 && "\n"}
    </span>
  ));
}

// ---------------------------------------------------------------------------
// %%{init}%% and %% comment highlight functions
// ---------------------------------------------------------------------------

/**
 * Highlight a single %%{init:...}%% directive line.
 * Uses warm amber for the %%{ / }%% brackets and muted teal for the body.
 * Exported for testing.
 */
export function highlightInitDirectiveLine(line: string, lineIdx: number): ReactNode {
  try {
    // Match %%{ ... }%% — brackets are the delimiters, content is everything inside
    const m = line.match(/^(%%\{)(.*?)(\}%%)$/);
    if (!m) {
      // Not a well-formed directive — color the whole line in bracket amber as a fallback
      return (
        <span key={lineIdx} style={{ color: INIT_HL.bracket }}>
          {line}
        </span>
      );
    }
    const [, open, content, close] = m;
    return (
      <span key={lineIdx}>
        <span style={{ color: INIT_HL.bracket }}>{open}</span>
        <span style={{ color: INIT_HL.content }}>{content}</span>
        <span style={{ color: INIT_HL.bracket }}>{close}</span>
      </span>
    );
  } catch {
    return <span key={lineIdx}>{line}</span>;
  }
}

/**
 * Highlight a single %% comment line (i.e. %% not followed by {).
 * Renders in a muted warm-gray italic — the conventional comment treatment.
 * Exported for testing.
 */
export function highlightCommentLine(line: string, lineIdx: number): ReactNode {
  return (
    <span key={lineIdx} style={{ color: COMMENT_HL.text, fontStyle: "italic" }}>
      {line}
    </span>
  );
}

/**
 * Dispatch a single line of themed Mermaid output to the appropriate highlighter.
 * Routes %%{...}%% lines to highlightInitDirectiveLine, %% comment lines to
 * highlightCommentLine, classDef lines to highlightClassDefLine, and all others
 * to plain text.
 * Exported for testing.
 */
export function highlightMermaidCodeLine(line: string, lineIdx: number): ReactNode {
  if (line.startsWith("%%{")) {
    return highlightInitDirectiveLine(line, lineIdx);
  }
  if (/^%%(?!\{)/.test(line)) {
    return highlightCommentLine(line, lineIdx);
  }
  if (/^classDef\s/.test(line)) {
    return highlightClassDefLine(line, lineIdx);
  }
  return <span key={lineIdx}>{line}</span>;
}

/**
 * Highlight a full block of themed Mermaid code, line by line.
 * Exported for testing.
 */
export function highlightMermaidCodeBlock(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {highlightMermaidCodeLine(line, i)}
      {i < lines.length - 1 && "\n"}
    </span>
  ));
}
