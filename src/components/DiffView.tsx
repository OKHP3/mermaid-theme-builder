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
      <div className={`flex items-center justify-center text-muted-foreground ${className ?? ""}`}>
        <p className="text-sm">Paste a Mermaid diagram to see the diff</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="flex-none flex items-center gap-3 px-3 py-1.5 border-b border-border bg-card/20 text-[11px] font-mono">
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold" aria-label={`${summary.added} lines added`}>
          +{summary.added}
        </span>
        <span className="text-rose-600 dark:text-rose-400 font-semibold" aria-label={`${summary.removed} lines removed`}>
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
                  <td className={`select-none w-4 text-center align-top ${markerColor}`}>{marker}</td>
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
