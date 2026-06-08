import {
  HL,
  INIT_HL,
  COMMENT_HL,
  highlightInitDirectiveLine,
  highlightCommentLine,
  highlightMermaidCodeLine,
  highlightMermaidCodeBlock,
} from "@/lib/syntax-highlight";

// Re-export so that consumers and tests that import from HighlightedCode continue
// to resolve without any import-path changes.
export {
  HL,
  INIT_HL,
  COMMENT_HL,
  highlightInitDirectiveLine,
  highlightCommentLine,
  highlightMermaidCodeLine,
  highlightMermaidCodeBlock,
};

interface HighlightedCodeProps {
  code: string;
  className?: string;
  "aria-label"?: string;
  placeholder?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLPreElement>;
}

/**
 * Syntax-highlighted read-only code display for themed Mermaid output.
 * Renders as a <pre> with color-coded %%{init}%% directives, %% comment lines,
 * and classDef lines. Plain diagram lines are rendered as unstyled text.
 */
export function HighlightedCode({
  code,
  className = "",
  "aria-label": ariaLabel,
  placeholder = "Paste a diagram above to see the styled output\u2026",
  onKeyDown,
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
      onKeyDown={onKeyDown}
    >
      {highlightMermaidCodeBlock(code)}
    </pre>
  );
}
