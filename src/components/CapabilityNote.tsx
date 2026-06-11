import {
  STABILITY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_STYLES,
  THEME_CONFIDENCE_LABELS,
  THEME_CONFIDENCE_STYLES,
  type DiagramCapability,
} from "@/data/mermaid-capabilities";

interface CapabilityNoteProps {
  capability: DiagramCapability;
}

export function CapabilityNote({ capability }: CapabilityNoteProps) {
  const hasContent = capability.notes || capability.warning;
  if (!hasContent) return null;

  const stabilityStyle =
    capability.stability === "beta"
      ? "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/50"
      : capability.stability === "experimental"
        ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50"
        : capability.stability === "stable"
          ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50"
          : "bg-muted text-muted-foreground border-border";

  const supportStyle = SUPPORT_STATUS_STYLES[capability.supportStatus];
  const confidenceStyle = THEME_CONFIDENCE_STYLES[capability.themeConfidence];
  const isLimited = capability.styleStrategy === "limited";

  return (
    <div className="rounded-lg border border-sky-300/60 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-700/40 px-4 py-3">
      <div className="flex gap-2">
        <svg
          className="w-4 h-4 mt-0.5 shrink-0 text-sky-600 dark:text-sky-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-xs font-medium text-sky-800 dark:text-sky-300">
              {isLimited ? "Limited theme support" : "Partial theme support"}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${stabilityStyle}`}
            >
              {STABILITY_LABELS[capability.stability]}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${supportStyle}`}
            >
              {SUPPORT_STATUS_LABELS[capability.supportStatus]}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${confidenceStyle}`}>
              Theme: {THEME_CONFIDENCE_LABELS[capability.themeConfidence]}
            </span>
          </div>
          {capability.warning && (
            <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed mb-1">
              {capability.warning}
            </p>
          )}
          {capability.notes && capability.notes !== capability.warning && (
            <p className="text-xs text-sky-600/80 dark:text-sky-500 leading-relaxed">
              {capability.notes}
            </p>
          )}
          {capability.exampleFile && !capability.examplePending && (
            <p className="text-[10px] text-sky-600/70 dark:text-sky-500/70 mt-1 font-mono">
              Example: {capability.exampleFile}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
