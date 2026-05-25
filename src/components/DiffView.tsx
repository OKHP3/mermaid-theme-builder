import { useMemo } from "react";
import { diffLines, diffSummary } from "@/lib/diff";

interface DiffViewProps {
  oldText: string;
  newText: string;
  className?: string;
}

export function DiffView({ oldText, newText, className }: DiffViewProps) {
  const lines = useMemo(() => diffLines(oldText, newText), [oldText, newText]);
  const summary = useMemo(() => diffSummary(lines), [lines]);

  if (!oldText.trim() && !newText.trim()) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <div className="flex flex-col items-center gap-3 max-w-xs text-center px-4">
          {/* Pencil / diagram icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-muted-foreground/40"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">
            Paste a Mermaid diagram to see the diff
          </p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            After pasting, pick a palette from the row above — the diff will appear here showing
            exactly what the theme directive adds to your diagram code.
          </p>
          {/* Upward nudge arrow */}
          <svg
            viewBox="0 0 16 24"
            fill="currentColor"
            className="w-3 h-4 text-muted-foreground/30 -mt-1"
            aria-hidden="true"
          >
            <path d="M8 1 L14 10 H10 V23 H6 V10 H2 Z" />
          </svg>
        </div>
      </div>
    );
  }

  if (summary.added === 0 && summary.removed === 0) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <div className="flex flex-col items-center gap-3 max-w-xs text-center px-4">
          {/* Palette icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-muted-foreground/40"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="8" cy="10" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="12" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
            <circle cx="16" cy="10" r="1.25" fill="currentColor" stroke="none" />
            <path d="M7 15.5c1.333-1 5.667-1 7 0" />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">No changes to show</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Pick a palette from the row above — the diff will appear here showing exactly what the
            theme directive adds to your diagram code.
          </p>
          {/* Upward nudge arrow */}
          <svg
            viewBox="0 0 16 24"
            fill="currentColor"
            className="w-3 h-4 text-muted-foreground/30 -mt-1"
            aria-hidden="true"
          >
            <path d="M8 1 L14 10 H10 V23 H6 V10 H2 Z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="flex-none flex items-center gap-3 px-3 py-1.5 border-b border-border bg-card/20 text-[11px] font-mono">
        <span
          className="text-emerald-600 dark:text-emerald-400 font-semibold"
          aria-label={`${summary.added} lines added`}
        >
          +{summary.added}
        </span>
        <span
          className="text-rose-600 dark:text-rose-400 font-semibold"
          aria-label={`${summary.removed} lines removed`}
        >
          −{summary.removed}
        </span>
        <span className="text-muted-foreground">original → themed</span>
      </div>
      <div className="flex-1 overflow-auto bg-background">
        <table
          className="w-full text-[11px] font-mono leading-snug"
          role="table"
          aria-label="Unified diff between original and themed Mermaid code"
        >
          <tbody>
            {lines.map((line, i) => {
              const bg =
                line.op === "add"
                  ? "bg-emerald-500/8"
                  : line.op === "del"
                    ? "bg-rose-500/8"
                    : "bg-transparent";
              const marker = line.op === "add" ? "+" : line.op === "del" ? "−" : " ";
              const markerColor =
                line.op === "add"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : line.op === "del"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground/40";
              return (
                <tr key={i} className={bg}>
                  <td className="select-none w-8 text-right pr-1 text-muted-foreground/40 align-top">
                    {line.oldNum ?? ""}
                  </td>
                  <td className="select-none w-8 text-right pr-1 text-muted-foreground/40 align-top">
                    {line.newNum ?? ""}
                  </td>
                  <td className={`select-none w-4 text-center align-top ${markerColor}`}>
                    {marker}
                  </td>
                  <td className="whitespace-pre-wrap break-all pl-2 pr-3 text-foreground/90 align-top">
                    {line.text || "\u00A0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
