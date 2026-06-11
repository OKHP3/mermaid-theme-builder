import { DiffView } from "@/components/DiffView";
import { DiffTabHint } from "@/components/DiffTabHint";
import { OriginalTabHint, ThemedTabHint, CodeTabHint } from "@/components/PreviewTabHints";
import { MermaidPreview } from "@/components/MermaidPreview";
import { HighlightedCode, INIT_HL, COMMENT_HL, HL } from "@/components/HighlightedCode";
import type { TypographySettings } from "@/lib/typography";
import { splitDiagrams } from "@/lib/diagram-split";

export type PreviewMode = "original" | "themed" | "diff" | "code";

type DiagramEntry = ReturnType<typeof splitDiagrams>[number];

interface DiagramPreviewPanelProps {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  codeEditorOverride: string | null;
  onCodeEditorOverrideChange: (value: string | null) => void;
  effectiveExportCode: string;
  activeDiagramCode: string;
  themedCode: string;
  typography: TypographySettings;
  isMultiDiagram: boolean;
  diagrams: DiagramEntry[];
  safeDiagramIdx: number;
  onActiveDiagramIdxChange: (updater: number | ((prev: number) => number)) => void;
}

export function DiagramPreviewPanel({
  previewMode,
  onPreviewModeChange,
  codeEditorOverride,
  onCodeEditorOverrideChange,
  effectiveExportCode,
  activeDiagramCode,
  themedCode,
  typography,
  isMultiDiagram,
  diagrams,
  safeDiagramIdx,
  onActiveDiagramIdxChange,
}: DiagramPreviewPanelProps) {
  const previewCode = previewMode === "themed" ? themedCode : activeDiagramCode;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/20 flex-none flex-wrap print-hide">
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Preview mode"
          onKeyDown={(e) => {
            const modes: PreviewMode[] = ["original", "themed", "diff", "code"];
            const idx = modes.indexOf(previewMode);
            let next: number | null = null;
            if (e.key === "ArrowLeft") next = (idx - 1 + modes.length) % modes.length;
            else if (e.key === "ArrowRight") next = (idx + 1) % modes.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = modes.length - 1;
            if (next !== null) {
              e.preventDefault();
              onPreviewModeChange(modes[next]);
              requestAnimationFrame(() => {
                const btn = document.querySelector<HTMLButtonElement>(
                  `[data-preview-mode="${modes[next!]}"]`
                );
                btn?.focus();
              });
            }
          }}
        >
          {(["original", "themed", "diff", "code"] as PreviewMode[]).map((mode) => {
            const selected = previewMode === mode;
            return (
              <button
                key={mode}
                data-preview-mode={mode}
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onPreviewModeChange(mode)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all capitalize ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
        {previewMode === "code" && codeEditorOverride === null && effectiveExportCode && (
          <button
            type="button"
            onClick={() => onCodeEditorOverrideChange(effectiveExportCode)}
            title="Edit the styled code before copying"
            className="text-[10px] px-2 py-0.5 rounded border border-border/40 bg-muted/50 text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
        {previewMode === "code" && codeEditorOverride !== null && (
          <button
            type="button"
            onClick={() => onCodeEditorOverrideChange(null)}
            title="Discard edits and reset to computed output"
            className="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-500/20 transition-colors"
          >
            Reset
          </button>
        )}
        {previewMode === "code" && codeEditorOverride === null && (
          <span
            className="hidden sm:inline-flex items-center gap-2.5 text-[10px] font-mono select-none pl-1"
            aria-label="Syntax highlighting legend"
            title="%%{init} directives, %% comments, and classDef lines each use distinct colors in the Code view"
          >
            <span style={{ color: INIT_HL.bracket }}>{"%%{init}"}</span>
            <span style={{ color: COMMENT_HL.text, fontStyle: "italic" }}>{"%%\u00a0comment"}</span>
            <span style={{ color: HL.keyword }}>classDef</span>
          </span>
        )}
        {isMultiDiagram && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mr-1">
              Diagram
            </span>
            <button
              type="button"
              onClick={() => onActiveDiagramIdxChange((i) => Math.max(0, i - 1))}
              disabled={safeDiagramIdx === 0}
              className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous diagram"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <select
              value={safeDiagramIdx}
              onChange={(e) => onActiveDiagramIdxChange(Number(e.target.value))}
              className="text-[11px] px-2 py-0.5 rounded border border-border bg-background text-foreground"
              aria-label="Select diagram"
            >
              {diagrams.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onActiveDiagramIdxChange((i) => Math.min(diagrams.length - 1, i + 1))}
              disabled={safeDiagramIdx === diagrams.length - 1}
              className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next diagram"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {previewMode === "original" && <OriginalTabHint />}
      {previewMode === "themed" && <ThemedTabHint />}
      {previewMode === "diff" && <DiffTabHint />}
      {previewMode === "code" && <CodeTabHint />}
      {previewMode === "code" ? (
        codeEditorOverride !== null ? (
          <textarea
            className="forge-code-panel flex-1 min-h-[160px] md:min-h-0 w-full p-3 text-xs font-mono resize-none overflow-auto focus:outline-none"
            value={effectiveExportCode}
            onChange={(e) => onCodeEditorOverrideChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                onCodeEditorOverrideChange(null);
              }
            }}
            spellCheck={false}
            aria-label="Styled code output — edit before copying"
            autoFocus
          />
        ) : (
          <HighlightedCode
            code={effectiveExportCode}
            aria-label="Styled code output"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onCodeEditorOverrideChange(effectiveExportCode);
              }
            }}
          />
        )
      ) : (
        <div className="md:flex-1 overflow-auto p-3 md:p-4 min-h-[260px]" data-print-only>
          {previewMode === "diff" ? (
            <DiffView oldText={activeDiagramCode} newText={themedCode} className="w-full h-full" />
          ) : (
            <MermaidPreview code={previewCode} className="w-full h-full" typography={typography} />
          )}
        </div>
      )}
    </div>
  );
}
