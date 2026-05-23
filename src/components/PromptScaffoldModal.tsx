import { useState, useEffect, useCallback, useMemo } from "react";
import type { ScaffoldFormat } from "@/lib/themeEngine";
import { SCAFFOLD_FORMAT_KEY, resolveScaffoldFormat, saveScaffoldFormat } from "@/lib/scaffoldPrefs";
import { RENDERER_PROFILES } from "@/data/renderer-parity";
import type { RendererProfile } from "@/data/renderer-parity";

/** Derives a compact list of constraint strings from a renderer profile. */
function getRendererConstraints(profile: RendererProfile): string[] {
  const items: string[] = [];
  if (profile.initDirectiveSupport === "none") items.push("%%{init}%% not supported");
  else if (profile.initDirectiveSupport === "partial") items.push("%%{init}%% support partial");
  if (profile.themeVariableSupport === "none") items.push("theme variables not supported");
  else if (profile.themeVariableSupport === "partial") items.push("theme variables partial");
  if (profile.cssInjectionSupport === "none") items.push("CSS injection not supported");
  else if (profile.cssInjectionSupport === "partial") items.push("CSS injection partial");
  if (profile.customFontSupport === "none") items.push("custom fonts blocked");
  else if (profile.customFontSupport === "partial") items.push("custom fonts limited");
  return items;
}

const PREVIEW_LINES = 25;

/**
 * Returns the stored scaffold format preference, or null when nothing is stored.
 * null → no "last used" badge should be shown in the modal.
 */
function readLastFormat(): ScaffoldFormat | null {
  try {
    const raw = localStorage.getItem(SCAFFOLD_FORMAT_KEY);
    if (raw === null) return null;
    return resolveScaffoldFormat(raw);
  } catch {
    return null;
  }
}

interface FormatOption {
  format: ScaffoldFormat;
  label: string;
  badge: string;
  description: string;
  renderer: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "formatA",
    label: "%%{init}%% directive",
    badge: "Format A",
    description: "Universal compatibility — works with Mermaid v9+, Microsoft Loop, Notion, and most renderers.",
    renderer: "Loop · Notion · older renderers",
  },
  {
    format: "formatB",
    label: "YAML frontmatter",
    badge: "Format B",
    description: "Preferred modern format — Mermaid v10.5+ standard. Deprecates %%{init}%%.",
    renderer: "Mermaid Live Editor · VS Code · GitHub",
  },
  {
    format: "both",
    label: "Both formats",
    badge: "All",
    description: "Includes both Format A and Format B with instructions for choosing between them.",
    renderer: "Full scaffold — choose your renderer manually",
  },
];

interface PromptScaffoldModalProps {
  open: boolean;
  onClose: () => void;
  onCopy: (format: ScaffoldFormat) => Promise<void>;
  generatePreview: (format: ScaffoldFormat) => string;
  rendererTarget: string;
  onRendererTargetChange: (v: string) => void;
}

export function PromptScaffoldModal({ open, onClose, onCopy, generatePreview, rendererTarget, onRendererTargetChange }: PromptScaffoldModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<ScaffoldFormat | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [lastUsedFormat, setLastUsedFormat] = useState<ScaffoldFormat | null>(null);
  const [openPreview, setOpenPreview] = useState<ScaffoldFormat | null>(null);

  // Load saved preference whenever the modal opens; reset preview state
  useEffect(() => {
    if (open) {
      setLastUsedFormat(readLastFormat());
      setOpenPreview(null);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setOpenPreview(null);
      onClose();
    }, 150);
  }, [onClose]);

  const handleCopy = useCallback(
    async (format: ScaffoldFormat) => {
      await onCopy(format);
      saveScaffoldFormat(format);
      setLastUsedFormat(format);
      setCopiedFormat(format);
      setTimeout(() => {
        setCopiedFormat(null);
        handleClose();
      }, 1200);
    },
    [onCopy, handleClose],
  );

  const togglePreview = useCallback(
    (format: ScaffoldFormat, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenPreview((prev) => (prev === format ? null : format));
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  const previews = useMemo(
    () => ({
      formatA: generatePreview("formatA"),
      formatB: generatePreview("formatB"),
      both: generatePreview("both"),
    }),
    [generatePreview],
  );

  if (!open) return null;

  const hasPreference = lastUsedFormat !== null;
  const selectedRendererProfile = RENDERER_PROFILES.find((r) => r.id === rendererTarget);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-xl shadow-2xl transition-transform duration-150 ${
          isClosing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scaffold-modal-title"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div>
            <h2 id="scaffold-modal-title" className="text-sm font-semibold text-foreground leading-none">
              Copy Prompt Scaffold
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {hasPreference ? "Your last-used format is highlighted" : "Choose a theme directive format"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Target Renderer selector */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
          <label
            htmlFor="scaffold-renderer-select"
            className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold shrink-0"
          >
            Target
          </label>
          <select
            id="scaffold-renderer-select"
            value={rendererTarget}
            onChange={(e) => onRendererTargetChange(e.target.value)}
            className="flex-1 text-[10px] bg-background border border-border rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            aria-label="Select target renderer for scaffold"
          >
            <option value="">Generic (most compatible)</option>
            {RENDERER_PROFILES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>
          {selectedRendererProfile ? (
            <span className="text-[10px] text-muted-foreground/50 shrink-0 hidden sm:block">
              {selectedRendererProfile.mermaidVersionApprox}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 shrink-0 hidden sm:block">
              conservative output
            </span>
          )}
        </div>

        <div className="p-3 space-y-2">
          {FORMAT_OPTIONS.map((opt) => {
            const copied = copiedFormat === opt.format;
            const isLastUsed = lastUsedFormat === opt.format && copiedFormat === null;
            const isPreviewing = openPreview === opt.format;
            const isDimmed = copiedFormat !== null && !copied;

            return (
              <div
                key={opt.format}
                className={`rounded-lg border overflow-hidden transition-all ${
                  copied
                    ? "border-emerald-500/60"
                    : isLastUsed
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : isPreviewing
                    ? "border-primary/40"
                    : "border-border"
                } ${isDimmed ? "opacity-40 pointer-events-none" : ""}`}
              >
                {/* Copy button — main card body */}
                <button
                  onClick={() => handleCopy(opt.format)}
                  disabled={copiedFormat !== null}
                  className={`w-full text-left p-3 transition-all group ${
                    copied
                      ? "bg-emerald-500/10"
                      : isLastUsed
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "bg-background hover:bg-muted/40 active:bg-muted/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                            opt.format === "formatA"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : opt.format === "formatB"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {opt.badge}
                        </span>
                        <span className="text-xs font-semibold text-foreground font-mono">{opt.label}</span>
                        {isLastUsed && (
                          <span className="text-[9px] font-medium text-primary/70 bg-primary/8 border border-primary/20 px-1.5 py-0.5 rounded-full leading-none">
                            last used
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        {opt.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 leading-none">
                        {opt.renderer}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {copied ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Copied
                        </span>
                      ) : (
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`w-4 h-4 transition-colors ${
                            isLastUsed
                              ? "text-primary/50 group-hover:text-primary"
                              : "text-muted-foreground/40 group-hover:text-muted-foreground"
                          }`}
                        >
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>

                {/* Renderer constraint callout — shown when a specific renderer is selected */}
                {selectedRendererProfile && (() => {
                  const constraints = getRendererConstraints(selectedRendererProfile);
                  if (constraints.length === 0) return null;
                  return (
                    <div className="px-3 py-2 border-t border-amber-500/20 bg-amber-500/5 flex items-start gap-1.5">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3 shrink-0 text-amber-500/80 mt-px"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400/90 leading-snug">
                        <span className="font-semibold">{selectedRendererProfile.shortName}:</span>{" "}
                        {constraints.join(" · ")}
                      </p>
                    </div>
                  );
                })()}

                {/* Preview toggle — thin bar below the copy button */}
                <button
                  onClick={(e) => togglePreview(opt.format, e)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 border-t text-[10px] font-medium transition-colors ${
                    copied
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : isPreviewing
                      ? "border-primary/20 bg-primary/5 text-primary/80 hover:bg-primary/10"
                      : "border-border/60 bg-muted/20 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40"
                  }`}
                  aria-expanded={isPreviewing}
                  aria-label={isPreviewing ? `Hide preview for ${opt.badge}` : `Preview ${opt.badge} scaffold`}
                >
                  <span>{isPreviewing ? "Hide preview" : "Preview"}</span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-3 h-3 transition-transform duration-150 ${isPreviewing ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Preview panel */}
                {isPreviewing && (() => {
                  const previewLines = previews[opt.format].split("\n");
                  return (
                  <div className="border-t border-border/40">
                    <pre
                      className="overflow-y-auto max-h-48 px-3 py-2.5 text-[10px] leading-relaxed font-mono whitespace-pre bg-[#0f1f1c] text-[#d4c9b5] select-text"
                      aria-label={`Scaffold preview for ${opt.label}`}
                    >
                      {previewLines
                        .slice(0, PREVIEW_LINES)
                        .join("\n")}
                      {previewLines.length > PREVIEW_LINES && (
                        `\n…  (${previewLines.length - PREVIEW_LINES} more lines)`
                      )}
                    </pre>
                    <div className="flex justify-end px-2 py-1.5 bg-[#0f1f1c] border-t border-white/10">
                      <button
                        onClick={() => handleCopy(opt.format)}
                        disabled={copiedFormat !== null}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors disabled:pointer-events-none ${
                          copied
                            ? "bg-emerald-500/20 text-emerald-300 disabled:opacity-100"
                            : "bg-white/8 text-[#d4c9b5] hover:bg-white/14 active:bg-white/20 disabled:opacity-40"
                        }`}
                        aria-label={copied ? `Copied ${opt.badge} scaffold` : `Copy ${opt.badge} scaffold`}
                      >
                        {copied ? (
                          <>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                              <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                              <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                            </svg>
                            Copy this format
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-4 pt-1">
          <p className="text-[10px] text-muted-foreground/50 text-center leading-snug">
            The scaffold never leaves your browser — all processing is local.
          </p>
        </div>
      </div>
    </div>
  );
}
