import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ThemeColor } from "@/lib/palettes";

interface ColorSwatchProps {
  color: ThemeColor;
  onChange: (key: string, value: string) => void;
  /** When true, this swatch differs from the original palette and a reset
   *  affordance is rendered. Optional; falls back to `false`. */
  isOverridden?: boolean;
  /** Reset just this swatch back to its base palette value. */
  onReset?: (key: string) => void;
}

export function ColorSwatch({ color, onChange, isOverridden = false, onReset }: ColorSwatchProps) {
  const [localValue, setLocalValue] = useState(color.value);
  const hiddenPickerRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const labelSpanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setLocalValue(color.value);
  }, [color.value]);

  const isHexColor = /^#[0-9a-fA-F]{3,8}$/.test(localValue);
  const isFontValue = color.key === "fontFamily";

  const handleColorPicker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      onChange(color.key, val);
    },
    [color.key, onChange],
  );

  const handleTextInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      onChange(color.key, val);
    },
    [color.key, onChange],
  );

  const openPicker = useCallback(() => {
    const row = rowRef.current;
    const picker = hiddenPickerRef.current;
    if (!row || !picker) return;
    const rect = row.getBoundingClientRect();
    // The portal renders the input directly in document.body, so position:fixed
    // is always relative to the true viewport — no ancestor CSS transforms can
    // shift it. Set coords imperatively right before .click() so the browser
    // anchors the native picker popup here.
    //
    // Horizontal: right edge of the label text span (inline element, so
    // getBoundingClientRect().right = end of actual characters, not container edge).
    // Fall back to rect.right if the span ref isn't populated yet.
    const labelRight = labelSpanRef.current?.getBoundingClientRect().right ?? rect.right;
    picker.style.left = `${labelRight}px`;
    picker.style.top = `${rect.top + rect.height / 2 - 120}px`;
    picker.click();
  }, []);

  if (isFontValue) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
        <div className="w-7 h-7 rounded border border-border bg-secondary flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground" aria-hidden="true">Aa</span>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-foreground" htmlFor={`swatch-font-${color.key}`}>
            {color.label}
          </label>
          <input
            id={`swatch-font-${color.key}`}
            type="text"
            value={localValue}
            onChange={handleTextInput}
            aria-label={`Font family for ${color.label}`}
            className="text-xs text-muted-foreground bg-transparent border-0 p-0 w-full focus:outline-none focus:text-foreground"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="relative flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
      {/* Visual swatch button */}
      <button
        type="button"
        onClick={isHexColor ? openPicker : undefined}
        title={isHexColor ? `Pick color for ${color.label}` : undefined}
        aria-label={isHexColor ? `Color picker for ${color.label}` : undefined}
        className={`relative w-7 h-7 shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary${isHexColor ? " cursor-pointer" : ""}`}
      >
        <span
          className="absolute inset-0 rounded border border-border"
          style={{ backgroundColor: isHexColor ? localValue : "#e5e7eb" }}
        />
      </button>

      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-foreground" htmlFor={`swatch-text-${color.key}`}>
          <span ref={labelSpanRef}>{color.label}</span>
        </label>
        <input
          id={`swatch-text-${color.key}`}
          type="text"
          value={localValue}
          onChange={handleTextInput}
          aria-label={`Hex value for ${color.label}`}
          className="text-xs text-muted-foreground bg-transparent border-0 p-0 w-full focus:outline-none focus:text-foreground font-mono"
          placeholder="#000000"
        />
      </div>

      {isOverridden && onReset && (
        <button
          type="button"
          onClick={() => onReset(color.key)}
          title={`Reset ${color.label} to default`}
          aria-label={`Reset ${color.label} to default`}
          className="shrink-0 p-1 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary transition-opacity"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Portaled color input — rendered directly in document.body so no
          ancestor CSS transform can displace position:fixed coordinates.
          Position is set imperatively in openPicker() before .click(). */}
      {isHexColor && createPortal(
        <input
          ref={hiddenPickerRef}
          type="color"
          value={localValue.length === 7 ? localValue : "#1a4f8a"}
          onChange={handleColorPicker}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "fixed",
            top: 0,
            left: "-9999px",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />,
        document.body,
      )}
    </div>
  );
}
