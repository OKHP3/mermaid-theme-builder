import { useState, useEffect, useCallback } from "react";
import type { ScaffoldFormat } from "@/lib/themeEngine";

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
}

export function PromptScaffoldModal({ open, onClose, onCopy }: PromptScaffoldModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<ScaffoldFormat | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  const handleCopy = useCallback(
    async (format: ScaffoldFormat) => {
      await onCopy(format);
      setCopiedFormat(format);
      setTimeout(() => {
        setCopiedFormat(null);
        handleClose();
      }, 1200);
    },
    [onCopy, handleClose],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  if (!open) return null;

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
              Choose a theme directive format
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

        <div className="p-3 space-y-2">
          {FORMAT_OPTIONS.map((opt) => {
            const copied = copiedFormat === opt.format;
            return (
              <button
                key={opt.format}
                onClick={() => handleCopy(opt.format)}
                disabled={copiedFormat !== null}
                className={`w-full text-left rounded-lg border p-3 transition-all group ${
                  copied
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/40 active:bg-muted/70"
                } ${copiedFormat !== null && !copied ? "opacity-40 pointer-events-none" : ""}`}
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
                        className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                      >
                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
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
