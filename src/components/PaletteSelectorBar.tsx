import { BUILTIN_PALETTES } from "@/lib/palettes";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { isExtractedPaletteId } from "@/lib/extractor";

const SWATCH_INDICES = [0, 3, 4, 6];

interface PaletteSelectorBarProps {
  allPalettes: Palette[];
  selectedPaletteId: string;
  customColors: Record<string, ThemeColor[]>;
  onSelectPalette: (id: string) => void;
  tileIdPrefix?: string;
}

export function PaletteSelectorBar({
  allPalettes,
  selectedPaletteId,
  customColors,
  onSelectPalette,
  tileIdPrefix = "palette-tile",
}: PaletteSelectorBarProps) {
  return (
    <div className="flex-none border-b border-border bg-card/30 px-3 py-2 print-hide">
      <div
        role="radiogroup"
        aria-label="Palette selector"
        className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin"
        onKeyDown={(e) => {
          const idx = allPalettes.findIndex((p) => p.id === selectedPaletteId);
          if (idx < 0) return;
          let nextIdx: number | null = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            nextIdx = (idx + 1) % allPalettes.length;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            nextIdx = (idx - 1 + allPalettes.length) % allPalettes.length;
          } else if (e.key === "Home") {
            nextIdx = 0;
          } else if (e.key === "End") {
            nextIdx = allPalettes.length - 1;
          }
          if (nextIdx !== null) {
            e.preventDefault();
            const next = allPalettes[nextIdx];
            if (next) {
              onSelectPalette(next.id);
              requestAnimationFrame(() => {
                const el = document.getElementById(`${tileIdPrefix}-${next.id}`);
                el?.focus();
                el?.scrollIntoView({ block: "nearest", inline: "nearest" });
              });
            }
          }
        }}
      >
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
          const isSelected = selectedPaletteId === p.id;
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
                {p.name.length > 12 ? p.name.slice(0, 11) + "…" : p.name}
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
    </div>
  );
}
