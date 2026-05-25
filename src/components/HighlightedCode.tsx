import { type ReactNode } from "react";
import { highlightClassDefLine } from "@/components/ClassBrowser";

// ---------------------------------------------------------------------------
// Syntax highlighting for full themed Mermaid code blocks.
// Handles %%{init:...}%% directive lines, %% comment lines, and classDef lines.
// All other lines fall back to plain text.
// ---------------------------------------------------------------------------

export const INIT_HL = {
  bracket: "#c8a870", // warm amber — %%{ and }%% delimiters
  content: "#8da89a", // muted teal-gray — directive body
} as const;

export const COMMENT_HL = {
  text: "#7a7568", // dimmed warm gray — %% comment lines
} as const;

/**
 * Highlight a single %%{init:...}%% directive line.
 * Uses a warm amber for the %%{ / }%% brackets and muted teal for the body.
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
 * highlightCommentLine, classDef lines to highlightClassDefLine (from ClassBrowser),
 * and all others to plain text.
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

interface HighlightedCodeProps {
  code: string;
  className?: string;
  "aria-label"?: string;
  placeholder?: string;
}

/**
 * Syntax-highlighted read-only code display for themed Mermaid output.
 * Renders as a <pre> with color-coded %%{init}%% directives and classDef lines.
 * Plain diagram lines are rendered as unstyled text.
 */
export function HighlightedCode({
  code,
  className = "",
  "aria-label": ariaLabel,
  placeholder = "Paste a diagram above to see the styled output\u2026",
}: HighlightedCodeProps) {
  if (!code.trim()) {
    return (
      <pre
        className={`forge-code-panel flex-1 min-h-[160px] md:min-h-0 w-full p-3 text-xs font-mono overflow-auto ${className}`}
        aria-label={ariaLabel}
      >
        <span className="text-muted-foreground/40">{placeholder}</span>
      </pre>
    );
  }
  return (
    <pre
      className={`forge-code-panel flex-1 min-h-[160px] md:min-h-0 w-full p-3 text-xs font-mono overflow-auto whitespace-pre ${className}`}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {highlightMermaidCodeBlock(code)}
    </pre>
  );
}
