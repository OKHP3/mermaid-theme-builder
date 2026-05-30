import { useState } from "react";

const STORAGE_KEY = "mtb.hint-dismissed.diff-tab";

function isHintDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissHint(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage unavailable — dismissal is session-only
  }
}

export function DiffTabHint() {
  const [dismissed, setDismissed] = useState<boolean>(isHintDismissed);

  if (dismissed) return null;

  const handleDismiss = () => {
    dismissHint();
    setDismissed(true);
  };

  return (
    <div
      className="flex-none border-b border-sky-400/25 bg-sky-500/6 dark:bg-sky-500/8 px-3 py-2 print-hide"
      role="note"
      aria-label="How to use the Diff tab"
    >
      <div className="flex items-start gap-2.5">
        {/* Info icon */}
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-1.5A.75.75 0 017.25 6h1a.75.75 0 01.75.75v3.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25V7.5h-.25a.75.75 0 01-.75-.75zM8 4a1 1 0 110 2 1 1 0 010-2z" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="forge-eyebrow text-sky-700 dark:text-sky-300/80 mb-1.5">
            How to use the Diff tab
          </p>
          <ol className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            {(
              [
                ["1", "Paste your Mermaid diagram into the input above"],
                ["2", "Pick a palette from the row above the preview"],
                ["3", "This tab shows exactly what the theme directive adds"],
              ] as [string, string][]
            ).map(([num, label]) => (
              <li key={num} className="flex items-baseline gap-1.5 text-[11px] text-foreground/70">
                <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[9px] font-bold flex items-center justify-center leading-none">
                  {num}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Diff tab hint"
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
