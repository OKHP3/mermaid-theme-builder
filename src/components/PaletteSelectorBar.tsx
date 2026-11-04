import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { BUILTIN_PALETTES } from "@/lib/palettes";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { isExtractedPaletteId } from "@/lib/extractor";
import { parsePortablePalette } from "@/lib/exporters";
import { formatImportError } from "@/lib/importErrorFormat";
import { ThemeDialog } from "./ThemeLibraryStatus";

const SWATCH_INDICES = [0, 3, 4, 6];

interface PaletteSelectorBarProps {
  allPalettes: Palette[];
  selectedPaletteId: string;
  customColors: Record<string, ThemeColor[]>;
  onSelectPalette: (id: string) => void;
  tileIdPrefix?: string;
  myThemeSlots: { id: string; name: string; colors: ThemeColor[] }[];
  activeMyThemeSlotId: string | null;
  onSelectMyThemeSlot: (id: string) => void;
  onAddMyThemeSlot: () => void;
  onDeleteMyThemeSlot: (id: string) => void;
  onExportMyThemeSlot: (id: string) => void;
  onImportAsNewSlot?: (
    palette: Palette,
    warnings: {
      invalidValues: Array<{ key: string; value: string }>;
      warnValues: Array<{ key: string; value: string }>;
    }
  ) => void;
  onImportThemeFile?: (json: string) => void;
  onShowToast: (msg: ReactNode) => void;
  onDuplicateMyThemeSlot?: (id: string) => string | null | void;
  onRenameMyThemeSlot?: (id: string, newName: string) => void;
  onMoveMyThemeSlotUp?: (id: string) => void;
  onMoveMyThemeSlotDown?: (id: string) => void;
  /** Open the Profile Details panel for the given slot id. */
  onShowProfileDetails?: (id: string) => void;
}

export function PaletteSelectorBar({
  allPalettes,
  selectedPaletteId,
  customColors,
  onSelectPalette,
  tileIdPrefix = "palette-tile",
  myThemeSlots,
  activeMyThemeSlotId,
  onSelectMyThemeSlot,
  onAddMyThemeSlot,
  onDeleteMyThemeSlot,
  onExportMyThemeSlot,
  onImportAsNewSlot,
  onImportThemeFile,
  onShowToast,
  onDuplicateMyThemeSlot,
  onRenameMyThemeSlot,
  onMoveMyThemeSlotUp,
  onMoveMyThemeSlotDown,
  onShowProfileDetails,
}: PaletteSelectorBarProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [themeSearch, setThemeSearch] = useState("");
  const visibleThemes = myThemeSlots.filter((theme) =>
    theme.name.toLocaleLowerCase("en-US").includes(themeSearch.trim().toLocaleLowerCase("en-US"))
  );
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const deletedThemeFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingDeleteId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingDeleteId]);

  const startRename = useCallback((slot: { id: string; name: string }) => {
    setPendingRenameId(null);
    setEditingSlotId(slot.id);
    setEditingName(slot.name);
  }, []);

  const focusTile = useCallback(
    (id: string) => {
      requestAnimationFrame(() => {
        document.getElementById(`${tileIdPrefix}-${id}`)?.focus();
      });
    },
    [tileIdPrefix]
  );

  const commitRename = useCallback(
    (id: string, returnFocus = false) => {
      const trimmed = editingName.trim();
      if (trimmed) onRenameMyThemeSlot?.(id, trimmed);
      setEditingSlotId(null);
      setEditingName("");
      if (returnFocus) focusTile(id);
    },
    [editingName, focusTile, onRenameMyThemeSlot]
  );

  const cancelRename = useCallback(
    (id: string, returnFocus = false) => {
      setEditingSlotId(null);
      setEditingName("");
      if (returnFocus) focusTile(id);
    },
    [focusTile]
  );

  useEffect(() => {
    if (!pendingRenameId) return;
    const slot = myThemeSlots.find((s) => s.id === pendingRenameId);
    if (!slot) return;
    setPendingRenameId(null);
    startRename(slot);
  }, [myThemeSlots, pendingRenameId, startRename]);

  useEffect(() => {
    if (!editingSlotId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [editingSlotId]);

  type NavItem = { type: "slot"; id: string } | { type: "palette"; id: string };
  const navItems: NavItem[] = [
    ...visibleThemes.map((s) => ({ type: "slot" as const, id: s.id })),
    ...allPalettes.map((p) => ({ type: "palette" as const, id: p.id })),
  ];
  const currentNavId = activeMyThemeSlotId ?? selectedPaletteId;
  const navLen = navItems.length;
  const tabStopId = navItems.some((item) => item.id === currentNavId)
    ? currentNavId
    : navItems[0]?.id;

  useEffect(() => {
    const deletedId = deletedThemeFocusRef.current;
    if (!deletedId || myThemeSlots.some((slot) => slot.id === deletedId)) return;
    // Deletion may finish after the dialog closes. Recover only lost focus,
    // without interrupting a user who has already moved to another control.
    const frame = requestAnimationFrame(() => {
      if (deletedThemeFocusRef.current !== deletedId) return;
      deletedThemeFocusRef.current = null;
      if (document.activeElement === document.body && tabStopId) {
        document.getElementById(`${tileIdPrefix}-${tabStopId}`)?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [myThemeSlots, tabStopId, tileIdPrefix]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const radio = (e.target as HTMLElement).closest('[role="radio"]');
      if (
        !radio?.id.startsWith(`${tileIdPrefix}-`) ||
        radio.closest('[role="radiogroup"]') !== e.currentTarget
      )
        return;
      const focusedId = radio.id.slice(tileIdPrefix.length + 1);
      const idx = navItems.findIndex((item) => item.id === focusedId);
      if (idx < 0) return;
      let nextIdx: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIdx = (idx + 1) % navLen;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        nextIdx = (idx - 1 + navLen) % navLen;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = navLen - 1;
      }
      if (nextIdx !== null) {
        e.preventDefault();
        const next = navItems[nextIdx];
        if (next) {
          if (next.type === "slot") {
            onSelectMyThemeSlot(next.id);
          } else {
            onSelectPalette(next.id);
          }
          requestAnimationFrame(() => {
            const el = document.getElementById(`${tileIdPrefix}-${next.id}`);
            el?.focus();
            el?.scrollIntoView({ block: "nearest", inline: "nearest" });
          });
        }
      }
    },
    [navItems, navLen, onSelectMyThemeSlot, onSelectPalette, tileIdPrefix]
  );

  const pendingSlot = pendingDeleteId ? myThemeSlots.find((s) => s.id === pendingDeleteId) : null;

  return (
    <>
      <div className="flex-none border-b border-border bg-card/30 px-3 py-2 print-hide">
        <div
          className={`mb-2 ${myThemeSlots.length > 3 ? "flex" : "hidden md:flex"} flex-wrap items-center gap-2 text-xs`}
        >
          <span className="font-semibold">My themes ({myThemeSlots.length})</span>
          <input
            aria-label="Search my themes"
            type="search"
            value={themeSearch}
            onChange={(event) => setThemeSearch(event.target.value)}
            placeholder="Search my themes"
            className="min-w-0 max-w-full rounded-md border border-border bg-background px-2 py-1"
          />
          {themeSearch && !visibleThemes.length && <span role="status">No matching themes</span>}
        </div>
        <div
          role="radiogroup"
          aria-label="Palette selector"
          className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin"
          onKeyDown={handleKeyDown}
        >
          {/* My Theme slot tiles */}
          {visibleThemes.map((slot) => {
            const slotIndex = myThemeSlots.findIndex((item) => item.id === slot.id);
            const swatchColors = SWATCH_INDICES.map((i) => slot.colors[i]?.value ?? "#888");
            const isActive = activeMyThemeSlotId === slot.id;
            const displayName =
              slot.name.length > 15 ? slot.name.slice(0, 14) + "\u2026" : slot.name;
            const isFirst = slotIndex === 0;
            const isLast = slotIndex === myThemeSlots.length - 1;
            const isEditing = editingSlotId === slot.id;
            return (
              <div key={slot.id} className="relative flex-none group/slot">
                <button
                  id={`${tileIdPrefix}-${slot.id}`}
                  role="radio"
                  aria-label={`${slot.name} Mine`}
                  aria-checked={isActive}
                  tabIndex={tabStopId === slot.id ? 0 : -1}
                  onClick={() => onSelectMyThemeSlot(slot.id)}
                  title={slot.name}
                  className={`flex flex-col items-center gap-1 px-2 pt-1.5 pb-5 pr-5 rounded-lg transition-all border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive
                      ? "border-primary/60 bg-primary/8 shadow-sm"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex gap-0.5">
                    {swatchColors.map((color, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {isEditing ? (
                    <span className="h-2.5" aria-hidden="true" />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startRename(slot);
                      }}
                      className={`text-[10px] leading-none whitespace-nowrap font-medium cursor-text ${
                        isActive ? "text-accent-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {displayName}
                    </span>
                  )}
                  <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/10 text-accent-foreground font-semibold uppercase tracking-wide">
                    Mine
                  </span>
                </button>
                {isEditing && (
                  <input
                    ref={renameInputRef}
                    value={editingName}
                    aria-label={`Rename ${slot.name}`}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(slot.id)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename(slot.id, true);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelRename(slot.id, true);
                      }
                    }}
                    className="absolute bottom-[18px] left-1 right-5 h-4 min-w-0 rounded border border-primary/60 bg-background px-1 text-[10px] leading-none text-foreground outline-none ring-1 ring-primary/20"
                  />
                )}
                {/* Trash icon — revealed on hover, always visible on touch devices */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDeleteId(slot.id);
                  }}
                  aria-label={`Delete ${slot.name}`}
                  className="absolute top-1 right-0.5 opacity-0 group-hover/slot:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive focus-visible:outline focus-visible:outline-1 focus-visible:outline-destructive"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                    <path
                      d="M6 2h4M2 4h12M5 4l.6 8h4.8L11 4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {/* Lifecycle action bar — Move Up, Move Down, Duplicate (revealed on hover / focus) */}
                <div
                  className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5 opacity-0 group-hover/slot:opacity-100 focus-within:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity pointer-events-none group-hover/slot:pointer-events-auto focus-within:pointer-events-auto"
                  aria-hidden="false"
                >
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveMyThemeSlotUp?.(slot.id);
                    }}
                    disabled={isFirst}
                    aria-label={`Move ${slot.name} up`}
                    title={`Move ${slot.name} up`}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                      <path
                        d="M4 10l4-4 4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveMyThemeSlotDown?.(slot.id);
                    }}
                    disabled={isLast}
                    aria-label={`Move ${slot.name} down`}
                    title={`Move ${slot.name} down`}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSlotId = onDuplicateMyThemeSlot?.(slot.id);
                      if (typeof newSlotId === "string") setPendingRenameId(newSlotId);
                    }}
                    aria-label={`Duplicate ${slot.name}`}
                    title={`Duplicate ${slot.name}`}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
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
                  </button>
                  {/* Rename */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(slot);
                    }}
                    aria-label={`Rename ${slot.name}`}
                    title={`Rename ${slot.name}`}
                    className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                      <path
                        d="M3 11.5V13h1.5l7.25-7.25-1.5-1.5L3 11.5zM9.75 4.75l1.5 1.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {/* Profile details */}
                  {onShowProfileDetails && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowProfileDetails(slot.id);
                      }}
                      aria-label={`Profile details for ${slot.name}`}
                      title={`Profile details for ${slot.name}`}
                      className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary transition-colors"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                        <path
                          d="M8 7.5v4M8 5.5v.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Create a draft without an arbitrary collection limit. */}
          {
            <button
              type="button"
              onClick={onAddMyThemeSlot}
              title="Add My Theme workspace"
              aria-label="Add My Theme workspace"
              className="flex-none flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[9px] leading-none font-medium whitespace-nowrap">Add</span>
            </button>
          }

          {/* Import files through the complete-theme review flow. */}
          {
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON as new slot"
              aria-label="Import JSON as new slot"
              className="flex-none flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                <path
                  d="M8 11V3M5 6l3-3 3 3M3 13h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[9px] leading-none font-medium whitespace-nowrap">Import</span>
            </button>
          }

          {/* Faint divider between My Theme section and built-in presets */}
          {myThemeSlots.length > 0 && (
            <div className="w-px bg-border/50 self-stretch mx-1 flex-none" aria-hidden="true" />
          )}

          {/* Built-in / saved palette tiles */}
          {allPalettes.map((p) => {
            const builtin = BUILTIN_PALETTES.find((b) => b.id === p.id);
            const baseColors = builtin?.colors ?? p.colors;
            const effectiveColors = customColors[p.id]
              ? baseColors.map((c) => {
                  const override = customColors[p.id].find((o) => o.key === c.key);
                  return override ?? c;
                })
              : p.colors;
            const swatchColors = SWATCH_INDICES.map((i) => effectiveColors[i]?.value ?? "#888");
            const isSelected = activeMyThemeSlotId === null && selectedPaletteId === p.id;
            const isUserExtracted = isExtractedPaletteId(p.id);
            const isUserSaved = !builtin && !isUserExtracted;
            return (
              <button
                key={p.id}
                id={`${tileIdPrefix}-${p.id}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={tabStopId === p.id ? 0 : -1}
                onClick={() => onSelectPalette(p.id)}
                title={p.description}
                className={`flex-none flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? "border-primary/60 bg-primary/8 shadow-sm"
                    : "border-transparent hover:border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex gap-0.5">
                  {swatchColors.map((color, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span
                  className={`text-[10px] leading-none whitespace-nowrap font-medium ${
                    isSelected ? "text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.name.length > 12 ? p.name.slice(0, 11) + "\u2026" : p.name}
                </span>
                {isUserExtracted && (
                  <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide">
                    Extracted
                  </span>
                )}
                {isUserSaved && (
                  <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide">
                    Saved
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Delete confirmation dialog */}
        {pendingSlot && (
          <ThemeDialog
            title={`Delete "${pendingSlot.name}"?`}
            onClose={() => setPendingDeleteId(null)}
          >
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              This theme and its draft will be removed from the current library. Export JSON first
              to keep a copy. Diagram text will not change.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onExportMyThemeSlot(pendingSlot.id)}
                className="w-full text-xs px-3 py-2 rounded-md border border-border hover:bg-muted/60 text-foreground font-medium transition-colors text-left"
              >
                Export JSON first
              </button>
              <button
                type="button"
                onClick={() => {
                  deletedThemeFocusRef.current = pendingSlot.id;
                  onDeleteMyThemeSlot(pendingSlot.id);
                  setPendingDeleteId(null);
                }}
                className="w-full text-xs px-3 py-2 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="w-full text-xs px-3 py-2 rounded-md hover:bg-muted/60 text-muted-foreground font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </ThemeDialog>
        )}
      </div>

      {/* Hidden file input for "Import as new slot" */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        aria-label="Import palette JSON as new slot"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 5_000_000) {
            onShowToast("The theme file is too large. Keep the original for recovery.");
            return;
          }
          try {
            const text = await file.text();
            if (onImportThemeFile) {
              onImportThemeFile(text);
              return;
            }
            const result = parsePortablePalette(text);
            if (!result.ok) {
              onShowToast(`Import failed: ${result.error}`);
              return;
            }
            onImportAsNewSlot?.(result.palette, {
              invalidValues: result.invalidValues,
              warnValues: result.warnValues,
            });
          } catch (err) {
            onShowToast(
              formatImportError(
                `Import failed: ${err instanceof Error ? err.message : String(err)}`
              )
            );
          }
        }}
      />
    </>
  );
}
