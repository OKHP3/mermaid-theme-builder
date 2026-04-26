import { useState, useCallback, useEffect } from "react";
import type { ThemeColor } from "@/lib/palettes";

interface ColorSwatchProps {
  color: ThemeColor;
  onChange: (key: string, value: string) => void;
}

export function ColorSwatch({ color, onChange }: ColorSwatchProps) {
  const [localValue, setLocalValue] = useState(color.value);

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

  if (isFontValue) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
        <div className="w-7 h-7 rounded border border-border bg-secondary flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground">Aa</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">{color.label}</p>
          <input
            type="text"
            value={localValue}
            onChange={handleTextInput}
            className="text-xs text-muted-foreground bg-transparent border-0 p-0 w-full focus:outline-none focus:text-foreground"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
      <div className="relative w-7 h-7 shrink-0">
        <div
          className="absolute inset-0 rounded border border-border"
          style={{ backgroundColor: isHexColor ? localValue : "#e5e7eb" }}
        />
        {isHexColor && (
          <input
            type="color"
            value={localValue.length === 7 ? localValue : "#1a4f8a"}
            onChange={handleColorPicker}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded"
            title={`Pick color for ${color.label}`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{color.label}</p>
        <input
          type="text"
          value={localValue}
          onChange={handleTextInput}
          className="text-xs text-muted-foreground bg-transparent border-0 p-0 w-full focus:outline-none focus:text-foreground font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
