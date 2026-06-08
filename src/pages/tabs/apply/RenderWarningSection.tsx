import { FamilySyntaxHint } from "@/components/FamilySyntaxHint";
import { getFamilySyntaxHint } from "@/lib/family-syntax-hints";
import type { DiagramFamily } from "@/data/mermaid-capabilities";

interface RenderWarningSectionProps {
  exportAdvisories: string[];
  advisoryDismissed: boolean;
  onDismissAdvisory: () => void;
  family: DiagramFamily;
  hintResetToken: number;
  familyHintDismissed: boolean;
  onFamilyHintDismiss: () => void;
  onResetSyntaxHints: () => void;
}

export function RenderWarningSection({
  exportAdvisories,
  advisoryDismissed,
  onDismissAdvisory,
  family,
  hintResetToken,
  familyHintDismissed,
  onFamilyHintDismiss,
  onResetSyntaxHints,
}: RenderWarningSectionProps) {
  return (
    <>
      {exportAdvisories.length > 0 && !advisoryDismissed && (
        <div className="flex-none border-b border-sky-500/25 bg-sky-500/6 px-3 py-1.5 flex items-center gap-2 print-hide">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 min-w-0 text-[10px] text-sky-800 dark:text-sky-200/80 leading-snug truncate">
            {exportAdvisories[0]}
            {exportAdvisories.length > 1 && (
              <span className="text-sky-600 dark:text-sky-400 ml-1">
                +{exportAdvisories.length - 1} more
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onDismissAdvisory}
            aria-label="Dismiss renderer advisory"
            className="shrink-0 text-sky-500/60 hover:text-sky-500 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      )}
      <FamilySyntaxHint
        family={family}
        resetToken={hintResetToken}
        onDismiss={onFamilyHintDismiss}
      />
      {familyHintDismissed && getFamilySyntaxHint(family) && (
        <div className="flex-none border-b border-border/40 bg-transparent px-3 py-1 print-hide flex items-center justify-end">
          <button
            type="button"
            onClick={onResetSyntaxHints}
            className="text-[10px] text-muted-foreground/50 hover:text-sky-500 dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1"
            aria-label="Show syntax tip for this diagram type"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" aria-hidden="true">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-1.5A.75.75 0 017.25 6h1a.75.75 0 01.75.75v3.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25V7.5h-.25a.75.75 0 01-.75-.75zM8 4a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
            Show syntax tip
          </button>
        </div>
      )}
    </>
  );
}
