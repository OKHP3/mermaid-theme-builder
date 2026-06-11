import { useEffect, useRef } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { ColorSwatch } from "@/components/ColorSwatch";

interface ColorEditorPanelProps {
  selectedPalette: Palette;
  selectedPaletteId: string;
  customColors: Record<string, ThemeColor[]>;
  hasCustomizations: boolean;
  onColorChange: (key: string, value: string) => void;
  onResetPalette: () => void;
  onResetColor: (key: string) => void;
  onClose: () => void;
  onSwitchToCompose: () => void;
}

export function ColorEditorPanel({
  selectedPalette,
  selectedPaletteId,
  customColors,
  hasCustomizations,
  onColorChange,
  onResetPalette,
  onResetColor,
  onClose,
  onSwitchToCompose,
}: ColorEditorPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap + initial focus + restore for the dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openerRef.current = previouslyFocused instanceof HTMLButtonElement ? previouslyFocused : null;

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("aria-hidden"));

    const list = focusable();
    if (list.length) list[0].focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener("keydown", onKey);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      try {
        openerRef.current?.focus();
      } catch {
        // ignore
      }
    };
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        ref={dialogRef}
        className="fixed right-0 top-0 z-50 h-full w-full md:w-80 bg-card border-l border-border flex flex-col shadow-2xl print-hide"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit colors for ${selectedPalette.name}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-none">
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              {selectedPalette.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Edit color tokens</p>
          </div>
          <div className="flex items-center gap-2">
            {hasCustomizations && (
              <button
                type="button"
                onClick={onResetPalette}
                aria-label="Reset all color overrides to default"
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close color editor"
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {selectedPalette.description}
          </p>
          <div className="space-y-0.5">
            {selectedPalette.colors.map((color) => {
              const override = customColors[selectedPaletteId]?.find((c) => c.key === color.key);
              const isOverridden = !!override && override.value !== color.value;
              return (
                <ColorSwatch
                  key={color.key}
                  color={override ?? color}
                  onChange={onColorChange}
                  isOverridden={isOverridden}
                  onReset={onResetColor}
                />
              );
            })}
          </div>
        </div>
        <div className="flex-none border-t border-border px-3 py-2">
          <button
            onClick={onSwitchToCompose}
            className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1.5 transition-colors"
          >
            More options in Compose →
          </button>
        </div>
      </aside>
    </>
  );
}
