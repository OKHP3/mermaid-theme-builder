import { useState, useEffect } from "react";
import type { DiagramFamily } from "@/data/mermaid-capabilities";
import {
  getFamilySyntaxHint,
  isHintDismissed,
  dismissHint,
  type ClassDefStatus,
} from "@/lib/familySyntaxHints";

interface FamilySyntaxHintProps {
  family: DiagramFamily;
}

const CLASSDEF_LABEL: Record<ClassDefStatus, string> = {
  yes: "Yes",
  no: "No",
  limited: "Limited",
};

const CLASSDEF_CLASSES: Record<ClassDefStatus, string> = {
  yes: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  no: "bg-muted/60 text-muted-foreground border-border",
  limited: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/30",
};

export function FamilySyntaxHint({ family }: FamilySyntaxHintProps) {
  const hint = getFamilySyntaxHint(family);

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (!hint) return true;
    return isHintDismissed(family);
  });

  useEffect(() => {
    if (!hint) return;
    setDismissed(isHintDismissed(family));
  }, [family, hint]);

  if (!hint || dismissed) return null;

  const handleDismiss = () => {
    dismissHint(family);
    setDismissed(true);
  };

  return (
    <div
      className="flex-none border-b border-sky-400/25 bg-sky-500/6 dark:bg-sky-500/8 px-3 py-2 print-hide"
      role="note"
      aria-label={`Syntax tips for ${hint.family}`}
    >
      <div className="flex items-start gap-2.5">
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-1.5A.75.75 0 017.25 6h1a.75.75 0 01.75.75v3.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25V7.5h-.25a.75.75 0 01-.75-.75zM8 4a1 1 0 110 2 1 1 0 010-2z" />
        </svg>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="forge-eyebrow text-sky-700 dark:text-sky-300/80 mb-1">
              {hint.family} syntax
            </p>
            <pre className="text-[10px] leading-relaxed text-foreground/80 font-mono whitespace-pre overflow-x-auto scrollbar-thin">
              {hint.keyIdiom}
            </pre>
          </div>

          <div className="flex flex-row sm:flex-col gap-3 sm:gap-1.5 sm:shrink-0 sm:min-w-[160px]">
            <div className="flex items-center gap-1.5">
              <span className="forge-eyebrow text-muted-foreground/70 shrink-0">classDef</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${CLASSDEF_CLASSES[hint.classDefStatus]}`}
              >
                {CLASSDEF_LABEL[hint.classDefStatus]}
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground leading-snug sm:max-w-[200px]">
              {hint.themingNote}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={`Dismiss ${hint.family} syntax tip`}
          className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-0.5"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" aria-hidden="true">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
