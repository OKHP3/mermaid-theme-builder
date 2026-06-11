import { useState, useEffect, useCallback, useRef } from "react";
import { BUILTIN_PALETTES } from "@/lib/palettes";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { isExtractedPaletteId } from "@/lib/extractor";
import { parsePortablePalette } from "@/lib/exporters";
import type { MyThemeSlot } from "@/lib/my-theme-slots";

const SWATCH_INDICES = [0, 3, 4, 6];

interface PaletteSelectorBarProps {
  allPalettes: Palette[];
  selectedPaletteId: string;
  customColors: Record<string, ThemeColor[]>;
  onSelectPalette: (id: string) => void;
  tileIdPrefix?: string;
  myThemeSlots: MyThemeSlot[];
  activeMyThemeSlotId: string | null;
  onSelectMyThemeSlot: (id: string) => void;
  onAddMyThemeSlot: () => void;
  onDeleteMyThemeSlot: (id: string) => void;
  onExportMyThemeSlot: (id: string) => void;
  onImportMyThemeSlot: (slot: MyThemeSlot) => void;
  onShowToast: (msg: string) => void;
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
  onImportMyThemeSlot,
  onShowToast,
}: PaletteSelectorBarProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pendingDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingDeleteId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingDeleteId]);

  type NavItem = { type: "slot"; id: string } | { type: "palette"; id: string };
  const navItems: NavItem[] = [
    ...myThemeSlots.map((s) => ({ type: "slot" as const, id: s.id })),
    ...allPalettes.map((p) => ({ type: "palette" as const, id: p.id })),
  ];
  const currentNavId = activeMyThemeSlotId ?? selectedPaletteId;
  const navLen = navItems.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = navItems.findIndex((item) => item.id === currentNavId);
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
    // navItems is rebuilt each render so use navLen + currentNavId for dep stability
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentNavId, navLen, onSelectMyThemeSlot, onSelectPalette, tileIdPrefix]
  );

  const pendingSlot = pendingDeleteId ? myThemeSlots.find((s) => s.id === pendingDeleteId) : null;

  return (
    <>
    <div className="flex-none border-b border-border bg-card/30 px-3 py-2 print-hide">
      <div
        role="radiogroup"
        aria-label="Palette selector"
        className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin"
        onKeyDown={handleKeyDown}
      >
        {/* My Theme slot tiles */}
        {myThemeSlots.map((slot) => {
          const swatchColors = SWATCH_INDICES.map((i) => slot.colors[i]?.value ?? "#888");
          const isActive = activeMyThemeSlotId === slot.id;
          const displayName = slot.name.length > 15 ? slot.name.slice(0, 14) + "\u2026" : slot.name;
          return (
            <div key={slot.id} className="relative flex-none group/slot">
              <button
                id={`${tileIdPrefix}-${slot.id}`}
                role="radio"
                aria-checked={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectMyThemeSlot(slot.id)}
                title={slot.name}
                className={`flex flex-col items-center gap-1 px-2 pt-1.5 pb-1.5 pr-5 rounded-lg transition-all border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
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
                <span
                  className={`text-[10px] leading-none whitespace-nowrap font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {displayName}
                </span>
                <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                  Mine
                </span>
              </button>
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
            </div>
          );
        })}

        {/* Add slot button — hidden once 3 slots exist */}
        {myThemeSlots.length < 3 && (
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
            <span className="text-[9px] leading-none font-medium whitespace-nowrap">New</span>
          </button>
        )}

        {/* Import JSON as new slot button */}
        {myThemeSlots.length < 3 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON as new slot"
            aria-label="Import JSON as new slot"
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
            <span className="text-[9px] leading-none font-medium whitespace-nowrap">Import</span>
          </button>
        ) : (
          <span
            className="flex-none flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-border/30 text-muted-foreground/50 cursor-not-allowed"
            title="All 3 slots are in use — delete one to import"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[9px] leading-none font-medium whitespace-nowrap">Import</span>
          </span>
        )}

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
              tabIndex={isSelected ? 0 : -1}
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
                  isSelected ? "text-primary" : "text-muted-foreground"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-xl p-5 w-64 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-foreground mb-1">
              Delete &ldquo;{pendingSlot.name}&rdquo;?
            </p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              This workspace and its colors will be permanently removed.
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
          </div>
        </div>
      )}
    </div>

    {/* Hidden file input for JSON import */}
    <input
      ref={fileInputRef}
      type="file"
      accept=".json,application/json"
      aria-label="Import palette JSON file"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
          const text = await file.text();
          const result = parsePortablePalette(text);
          if (!result.ok) {
            onShowToast(`Import failed: ${result.error}`);
            return;
          }
          // Pass a placeholder slot; the parent handler will assign the
          // correct available slot ID via nextSlotNumber.
          const newSlot: MyThemeSlot = {
            id: "my-theme-1",
            name: result.palette.name,
            colors: result.palette.colors,
            look: "classic",
            fontSize: "",
            typography: {
              diagramTitle: { fontFamily: "", fontSize: 0 },
              subgraphTitle: { fontFamily: "", fontSize: 0 },
              nestedSubgraphTitle: { fontFamily: "", fontSize: 0 },
              nodeLabel: { fontFamily: "", fontSize: 0 },
              edgeLabel: { fontFamily: "", fontSize: 0 },
            },
          };
          onImportMyThemeSlot(newSlot);
          onShowToast(`Imported "${result.palette.name}" as new slot`);
        } catch (err) {
          onShowToast(err instanceof Error ? err.message : "Import failed");
        }
      }}
    />
    </>
  );
}
