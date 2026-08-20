/**
 * ProfileDetailsPanel — modal dialog for viewing and managing a My Theme slot
 * as a first-class GovernanceProfile.
 *
 * Displays: profile name (inline editable), target renderer, output format,
 * look, schema version, status, font size, and creation/update timestamps.
 * Actions: Export JSON, Import JSON (replaces slot data), Duplicate, Delete
 * (with two-step confirmation).
 *
 * Keyboard: Escape closes (or backs out of sub-states), Tab/Shift+Tab is
 * trapped within the dialog, focus is placed on the close button when the
 * panel opens, and the invoking trigger regains focus when the panel closes.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { MyThemeSlot } from "@/lib/my-theme-slots";
import {
  GOVERNANCE_PROFILE_SCHEMA_VERSION,
  parseGovernanceProfile,
  type GovernanceProfile,
} from "@/lib/governance-profile";
import { getRendererById } from "@/data/renderer-parity";
import { formatImportError } from "@/lib/importErrorFormat";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProfileDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  /** The My Theme slot being inspected. Null = panel renders nothing. */
  slot: MyThemeSlot | null;
  /** App-level renderer target ID (e.g. "github"). */
  rendererTarget: string;
  /** App-level output format. */
  outputFormat: "init-directive" | "frontmatter";
  /** True when all 3 My Theme slots are occupied (disables Duplicate). */
  slotsFull: boolean;
  onRename: (id: string, newName: string) => void;
  onExport: (id: string) => void;
  /**
   * Called after the user picks a file and it parses successfully.
   * The panel closes automatically after a successful import.
   */
  onImport: (profile: GovernanceProfile, warnings: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onShowToast: (msg: ReactNode) => void;
  /** Copy a shareable URL for this profile to the clipboard. */
  onCopyShareLink?: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lookLabel(look: string): string {
  if (look === "handDrawn") return "Hand Drawn";
  if (look === "neo") return "Neo";
  return "Classic";
}

function formatLabel(outputFormat: "init-directive" | "frontmatter"): string {
  return outputFormat === "frontmatter" ? "YAML frontmatter" : "%%{init}%% directive";
}

function isoToDisplay(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** CSS selector for elements that can receive keyboard focus. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([type='hidden']):not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileDetailsPanel({
  open,
  onClose,
  slot,
  rendererTarget,
  outputFormat,
  slotsFull,
  onRename,
  onExport,
  onImport,
  onDuplicate,
  onDelete,
  onShowToast,
  onCopyShareLink,
}: ProfileDetailsPanelProps) {
  const [draftName, setDraftName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copyShareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * The element that had focus immediately before the panel opened.
   * Used to restore focus on close.
   */
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // ── Sync name draft whenever the target slot changes ──────────────────────
  useEffect(() => {
    if (slot) setDraftName(slot.name);
    setIsEditingName(false);
    setConfirmingDelete(false);
    if (copyShareTimerRef.current) {
      clearTimeout(copyShareTimerRef.current);
      copyShareTimerRef.current = null;
    }
    setCopiedShareLink(false);
  }, [slot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset animation state and capture previous focus on (re-)open ─────────
  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setConfirmingDelete(false);
      // Capture the element that triggered the panel so we can restore focus.
      if (document.activeElement instanceof HTMLElement) {
        prevFocusRef.current = document.activeElement;
      }
    }
  }, [open]);

  // ── Focus the close button when the panel first opens ────────────────────
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => closeBtnRef.current?.focus());
    }
  }, [open]);

  // ── Animated close (restores focus to the invoking trigger) ───────────────
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setConfirmingDelete(false);
      setIsEditingName(false);
      onClose();
      prevFocusRef.current?.focus();
    }, 150);
  }, [onClose]);

  // ── Escape key: back out of sub-states before closing ────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
      } else if (isEditingName) {
        setDraftName(slot?.name ?? "");
        setIsEditingName(false);
      } else {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmingDelete, isEditingName, handleClose, slot?.name]);

  // ── Focus trap: keep Tab / Shift+Tab within the dialog ───────────────────
  const handleDialogKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const container = dialogRef.current;
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !container.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // ── Name editing ─────────────────────────────────────────────────────────
  const commitName = useCallback(() => {
    if (!slot) return;
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== slot.name) {
      onRename(slot.id, trimmed);
    } else {
      setDraftName(slot.name);
    }
    setIsEditingName(false);
  }, [slot, draftName, onRename]);

  const handleNameKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitName();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        setDraftName(slot?.name ?? "");
        setIsEditingName(false);
      }
    },
    [commitName, slot?.name]
  );

  const startEditing = useCallback(() => {
    setIsEditingName(true);
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });
  }, []);

  // ── File import ───────────────────────────────────────────────────────────
  const handleFileChosen = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const result = parseGovernanceProfile(text);
        if (!result.ok) {
          onShowToast(formatImportError(`Profile import failed: ${result.error}`));
          return;
        }
        onImport(result.profile, result.warnings);
        handleClose();
      } catch (err) {
        onShowToast(
          formatImportError(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
        );
      }
    },
    [onImport, onShowToast, handleClose]
  );

  // ── Early exit ────────────────────────────────────────────────────────────
  if (!open || !slot) return null;

  const renderer = getRendererById(rendererTarget);
  const rendererLabel = renderer?.shortName ?? (rendererTarget || "None");

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-xl shadow-2xl transition-transform duration-150 ${
          isClosing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        onKeyDown={handleDialogKeyDown}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[8px] leading-none px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide shrink-0">
              Mine
            </span>
            <h2 id="pdp-title" className="text-sm font-semibold text-foreground leading-none">
              Profile Details
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Close profile details"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-4 space-y-4">
          {/* Inline name edit */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-1">
              Profile Name
            </p>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={handleNameKeyDown}
                  className="flex-1 text-sm bg-background border border-primary/60 rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  aria-label="Edit profile name"
                  autoComplete="off"
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={commitName}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-left group"
                aria-label={`Edit profile name: ${slot.name}`}
              >
                <span className="text-sm font-medium text-foreground truncate">{slot.name}</span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors"
                  aria-hidden="true"
                >
                  <path
                    d="M11.013 2.513a1.75 1.75 0 012.475 2.474L5.587 12.888l-3.337.556.556-3.337 8.207-8.594z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Renderer
              </p>
              <p className="text-xs text-foreground font-medium">{rendererLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Format
              </p>
              <p className="text-xs text-foreground font-medium">{formatLabel(outputFormat)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Look
              </p>
              <p className="text-xs text-foreground font-medium">{lookLabel(slot.look)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Schema
              </p>
              <p className="text-xs text-foreground font-medium">
                v{GOVERNANCE_PROFILE_SCHEMA_VERSION}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Status
              </p>
              <p className="text-xs text-foreground font-medium">Active workspace</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Font size
              </p>
              <p className="text-xs text-foreground font-medium">{slot.fontSize || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Created
              </p>
              <p className="text-xs text-foreground font-medium">{isoToDisplay(slot.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-0.5">
                Updated
              </p>
              <p className="text-xs text-foreground font-medium">{isoToDisplay(slot.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* ── Actions / Delete confirmation ────────────────────────────────── */}
        {!confirmingDelete ? (
          <div className="px-4 pb-4 pt-2 border-t border-border/60">
            {/* Copy Share Link — full-width, primary action */}
            {onCopyShareLink && (
              <button
                type="button"
                onClick={() => {
                  if (copyShareTimerRef.current) clearTimeout(copyShareTimerRef.current);
                  onCopyShareLink(slot.id);
                  setCopiedShareLink(true);
                  copyShareTimerRef.current = setTimeout(() => setCopiedShareLink(false), 2000);
                }}
                className={`w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border font-medium transition-all mt-3 ${
                  copiedShareLink
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 text-primary"
                }`}
                aria-label="Copy share link for this profile"
              >
                {copiedShareLink ? (
                  <>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="w-3.5 h-3.5 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8l4 4 6-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Link Copied!
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="w-3.5 h-3.5 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 3H6a1 1 0 00-1 1v8a1 1 0 001 1h4M10 3l3 3-3 3M10 3v3h3M13 6v6a1 1 0 01-1 1h-2"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Copy Share Link
                  </>
                )}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 pt-3">
              {/* Export */}
              <button
                type="button"
                onClick={() => onExport(slot.id)}
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/60 hover:border-primary/40 text-foreground font-medium transition-all"
                aria-label="Export profile as JSON"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M8 3v8M5 8l3 3 3-3M3 13h10"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export JSON
              </button>

              {/* Import */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/60 hover:border-primary/40 text-foreground font-medium transition-all"
                aria-label="Import profile from JSON file"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M8 11V3M5 6l3-3 3 3M3 13h10"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Import JSON
              </button>

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => {
                  onDuplicate(slot.id);
                  handleClose();
                }}
                disabled={slotsFull}
                title={
                  slotsFull
                    ? "All 3 My Theme slots are in use — delete one first"
                    : `Duplicate "${slot.name}"`
                }
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-muted/60 hover:border-primary/40 text-foreground font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border"
                aria-label={`Duplicate profile "${slot.name}"`}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M6 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1v-2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="6"
                    y="2"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                Duplicate
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-destructive/30 bg-background hover:bg-destructive/10 hover:border-destructive/60 text-destructive/70 hover:text-destructive font-medium transition-all"
                aria-label={`Delete profile "${slot.name}"`}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M6 2h4M2 4h12M5 4l.6 8h4.8L11 4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ) : (
          /* Delete confirmation */
          <div className="px-4 pb-4 pt-3 border-t border-destructive/20 bg-destructive/5 rounded-b-xl">
            <p className="text-sm font-semibold text-foreground mb-1">
              Delete &ldquo;{slot.name}&rdquo;?
            </p>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              This workspace and its colors will be permanently removed. Export a backup first if
              needed.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onExport(slot.id)}
                className="w-full text-xs px-3 py-2 rounded-md border border-border hover:bg-muted/60 text-foreground font-medium transition-colors text-left"
              >
                Export JSON first
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(slot.id);
                  handleClose();
                }}
                className="w-full text-xs px-3 py-2 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-colors"
              >
                Delete permanently
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="w-full text-xs px-3 py-2 rounded-md hover:bg-muted/60 text-muted-foreground font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input for profile import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import governance profile JSON"
          className="hidden"
          onChange={handleFileChosen}
        />
      </div>
    </div>
  );
}
