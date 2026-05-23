import { useState, useCallback, useMemo, useRef } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { BRAND_PALETTES, UTILITY_PALETTES, BUILTIN_PALETTES } from "@/lib/palettes";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  type ExportOptions,
  type ScaffoldFormat,
  type MermaidLook,
} from "@/lib/themeEngine";
import { MermaidPreview } from "@/components/MermaidPreview";
import { ColorSwatch } from "@/components/ColorSwatch";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { GENERIC_EXAMPLE } from "@/data/examples";
import { isExtractedPaletteId } from "@/lib/extractor";
import {
  paletteToPortableJson,
  parsePortablePalette,
  downloadTextFile,
  makeFilename,
} from "@/lib/exporters";
import {
  encodeShareableTheme,
  paletteToShareablePayload,
} from "@/lib/persistence";
import {
  type TypographySettings,
  type TypographyTierKey,
  TIER_ORDER,
  TIER_META,
  DEFAULT_TYPOGRAPHY,
  enforceHierarchy,
  isDefaultTypography,
} from "@/lib/typography";

const FONT_FAMILY_OPTIONS = [
  { label: "DM Sans (default)", value: "DM Sans, system-ui, sans-serif" },
  { label: "Alfa Slab One (display)", value: "Alfa Slab One, Georgia, serif" },
  { label: "JetBrains Mono (code)", value: "JetBrains Mono, Courier New, monospace" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, Cambria, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, Calibri, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "system-ui", value: "system-ui, -apple-system, sans-serif" },
];

function FontFamilySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isPreset = FONT_FAMILY_OPTIONS.some((o) => o.value === value);
  const selectValue = isPreset ? value : "__custom__";
  return (
    <div className="space-y-1">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__custom__") return; // keep current custom value
          onChange(v);
        }}
        className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        aria-label="Font family preset"
      >
        {FONT_FAMILY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="__custom__">Custom…</option>
      </select>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="font-family value"
        className="w-full text-[11px] font-mono bg-background border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        aria-label="Custom font family value"
      />
    </div>
  );
}

async function writeToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

interface ComposeTabProps {
  selectedPalette: Palette;
  selectedPaletteId: string;
  onSelectPalette: (id: string) => void;
  customColors: Record<string, ThemeColor[]>;
  onColorChange: (key: string, value: string) => void;
  onResetPalette: () => void;
  hasCustomizations: boolean;
  includeMetaComments: boolean;
  onIncludeMetaCommentsChange: (v: boolean) => void;
  includeBadge: boolean;
  onIncludeBadgeChange: (v: boolean) => void;
  customThemeName: string;
  onCustomThemeNameChange: (v: string) => void;
  effectiveThemeName: string;
  userPalettes: Palette[];
  onSavePalette: (name: string) => void;
  onImportPalette: (palette: Palette) => void;
  onDeleteUserPalette: (id: string) => void;
  onShowToast: (msg: string) => void;
  look: MermaidLook;
  onLookChange: (v: MermaidLook) => void;
  fontSize: string;
  onFontSizeChange: (v: string) => void;
  typography: TypographySettings;
  onTypographyChange: (t: TypographySettings) => void;
  rendererTarget: string;
  onRendererTargetChange: (v: string) => void;
}

export function ComposeTab({
  selectedPalette,
  selectedPaletteId,
  onSelectPalette,
  customColors,
  onColorChange,
  onResetPalette,
  hasCustomizations,
  includeMetaComments,
  onIncludeMetaCommentsChange,
  includeBadge,
  onIncludeBadgeChange,
  customThemeName,
  onCustomThemeNameChange,
  effectiveThemeName,
  userPalettes,
  onSavePalette,
  onImportPalette,
  onDeleteUserPalette,
  onShowToast,
  look,
  onLookChange,
  fontSize,
  onFontSizeChange,
  typography,
  onTypographyChange,
  rendererTarget,
  onRendererTargetChange,
}: ComposeTabProps) {
  const [copiedBootstrap, setCopiedBootstrap] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [savePaletteName, setSavePaletteName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tierDraftSizes, setTierDraftSizes] = useState<Partial<Record<TypographyTierKey, string>>>({});
  const [clampedTiers, setClampedTiers] = useState<Set<TypographyTierKey>>(new Set());
  const clampTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleTypographyChangeWithClamp = useCallback(
    (proposed: TypographySettings) => {
      const enforced = enforceHierarchy(proposed);
      onTypographyChange(enforced);
      const newlyClamped = (TIER_ORDER as TypographyTierKey[]).filter(
        (k) => enforced[k].fontSize < proposed[k].fontSize,
      );
      if (newlyClamped.length > 0) {
        setClampedTiers((prev) => new Set([...prev, ...newlyClamped]));
        for (const k of newlyClamped) {
          if (clampTimers.current[k]) clearTimeout(clampTimers.current[k]);
          clampTimers.current[k] = setTimeout(() => {
            setClampedTiers((prev) => {
              const next = new Set(prev);
              next.delete(k);
              return next;
            });
          }, 2000);
        }
      }
    },
    [onTypographyChange],
  );

  const handleTierSizeBlur = useCallback(
    (key: TypographyTierKey, rawValue: string, _maxSize: number) => {
      setTierDraftSizes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      const parsed = parseInt(rawValue, 10);
      if (isNaN(parsed) || parsed < 8) return;
      handleTypographyChangeWithClamp({ ...typography, [key]: { ...typography[key], fontSize: parsed } });
    },
    [typography, handleTypographyChangeWithClamp],
  );

  const exportOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: "flowchart",
      includeMetaComments,
      includeBadge: false,
      customThemeName:
        effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
      look,
      fontSize: fontSize || undefined,
      typography,
      rendererTarget,
    }),
    [selectedPalette, includeMetaComments, effectiveThemeName, look, fontSize, typography, rendererTarget],
  );

  const sampleThemedCode = useMemo(
    () => generateThemedCode(GENERIC_EXAMPLE, exportOptions),
    [exportOptions],
  );

  const handleCopyBootstrap = useCallback(async () => {
    const text = generateMarkdownExport(sampleThemedCode, selectedPalette, exportOptions);
    await writeToClipboard(text);
    setCopiedBootstrap(true);
    setTimeout(() => setCopiedBootstrap(false), 2000);
  }, [sampleThemedCode, selectedPalette, exportOptions]);

  const handleScaffoldCopy = useCallback(
    async (format: ScaffoldFormat) => {
      const text = generatePromptScaffoldWithFormat(selectedPalette, exportOptions, format);
      await writeToClipboard(text);
    },
    [selectedPalette, exportOptions],
  );

  const handleScaffoldPreview = useCallback(
    (format: ScaffoldFormat) => generatePromptScaffoldWithFormat(selectedPalette, exportOptions, format),
    [selectedPalette, exportOptions],
  );

  const handleCopyShareLink = useCallback(async () => {
    const payload = paletteToShareablePayload(selectedPalette, customThemeName);
    const token = encodeShareableTheme(payload);
    const url = new URL(window.location.href);
    url.searchParams.set("theme", token);
    await writeToClipboard(url.toString());
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  }, [selectedPalette, customThemeName]);

  const handleExportJson = useCallback(() => {
    downloadTextFile(
      makeFilename(effectiveThemeName, "theme", "json"),
      paletteToPortableJson(selectedPalette),
      "application/json;charset=utf-8",
    );
    onShowToast("Downloaded .theme.json file.");
  }, [selectedPalette, effectiveThemeName, onShowToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChosen = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        onImportPalette(result.palette);
      } catch (err) {
        onShowToast(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [onImportPalette, onShowToast],
  );

  const handleConfirmSave = useCallback(() => {
    const trimmed = savePaletteName.trim();
    if (!trimmed) return;
    onSavePalette(trimmed);
    setSavePaletteName("");
    setShowSaveDialog(false);
  }, [savePaletteName, onSavePalette]);

  const SWATCH_INDICES = [0, 3, 4, 6];
  const allPalettes = useMemo(
    () => [...BRAND_PALETTES, ...UTILITY_PALETTES, ...userPalettes],
    [userPalettes],
  );
  const isCurrentUserPalette = userPalettes.some((p) => p.id === selectedPaletteId);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="flex flex-col w-full md:w-[35%] border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0">
        <div className="flex-none border-b border-border bg-card/30 px-3 py-2">
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
                    const el = document.getElementById(`compose-palette-tile-${next.id}`);
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
              const effectiveColors =
                customColors[p.id]
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
                  id={`compose-palette-tile-${p.id}`}
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

        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="forge-eyebrow">
              Colors
            </p>
            {hasCustomizations && (
              <button
                onClick={onResetPalette}
                aria-label={`Reset ${selectedPalette.name} colors to defaults`}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            {selectedPalette.description}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-x-1">
            {selectedPalette.colors.map((color) => (
              <ColorSwatch
                key={color.key}
                color={
                  customColors[selectedPaletteId]?.find((c) => c.key === color.key) ?? color
                }
                onChange={onColorChange}
              />
            ))}
          </div>
        </div>

        <div className="p-3 border-b border-border">
          <p className="forge-eyebrow mb-2">
            Settings
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Look</label>
              <div className="flex gap-1" role="group" aria-label="Look style">
                {(
                  [
                    { value: "classic" as MermaidLook, label: "Classic", desc: "Standard rendering" },
                    { value: "neo" as MermaidLook, label: "Neo", desc: "Mermaid v11+ rounder shapes" },
                    { value: "handDrawn" as MermaidLook, label: "Hand Drawn", desc: "Rough.js sketch style" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onLookChange(opt.value)}
                    title={opt.desc}
                    aria-pressed={look === opt.value}
                    className={`flex-1 text-[11px] px-1 py-1.5 rounded-md border font-medium transition-all ${
                      look === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {look !== "classic" && (
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  {look === "neo"
                    ? "Neo look — requires Mermaid v11+. Rounder nodes, cleaner lines."
                    : "Hand-drawn sketch style via Rough.js. Great for informal diagrams."}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Theme name</label>
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => onCustomThemeNameChange(e.target.value)}
                placeholder={selectedPalette.name}
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {effectiveThemeName !== selectedPalette.name && customThemeName.trim() && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Output: {effectiveThemeName}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetaComments}
                onChange={(e) => onIncludeMetaCommentsChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground">Include metadata comments</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBadge}
                onChange={(e) => onIncludeBadgeChange(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground">Include attribution watermark</span>
            </label>
          </div>
        </div>

        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1.5">
            <p className="forge-eyebrow">Typography</p>
            {!isDefaultTypography(typography) && (
              <button
                type="button"
                onClick={() => onTypographyChange(DEFAULT_TYPOGRAPHY)}
                aria-label="Reset typography to defaults"
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-foreground block mb-1">Diagram body font</label>
            <FontFamilySelect
              value={
                customColors[selectedPaletteId]?.find((c) => c.key === "fontFamily")?.value ??
                selectedPalette.colors.find((c) => c.key === "fontFamily")?.value ??
                "DM Sans, system-ui, sans-serif"
              }
              onChange={(v) => onColorChange("fontFamily", v)}
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Sets the <code className="font-mono bg-muted rounded px-0.5">fontFamily</code> themeVariable in the init directive. Per-tier overrides below.
            </p>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Global base size
              <span className="text-[10px] text-muted-foreground font-normal ml-1">(Mermaid <code className="font-mono bg-muted rounded px-0.5">fontSize</code>)</span>
            </label>
            <div className="flex gap-1 mb-1.5" role="group" aria-label="Global base font size preset">
              {(
                [
                  { label: "XS", value: "12px", desc: "Extra small — 12px" },
                  { label: "S", value: "14px", desc: "Small — 14px" },
                  { label: "M", value: "16px", desc: "Medium — 16px (default)" },
                  { label: "L", value: "18px", desc: "Large — 18px" },
                  { label: "XL", value: "20px", desc: "Extra large — 20px" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFontSizeChange(fontSize === opt.value ? "" : opt.value)}
                  aria-pressed={(fontSize || "16px") === opt.value}
                  title={opt.desc}
                  className={`flex-1 text-xs py-1 rounded-md border font-medium transition-all ${
                    (fontSize || "16px") === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value)}
              placeholder="16px (Mermaid default)"
              className="w-full text-[11px] font-mono bg-background border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label="Custom font size"
            />
          </div>

          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60 font-semibold mb-2">Tier hierarchy</p>
          <div className="space-y-2">
            {(TIER_ORDER as TypographyTierKey[]).map((key, idx) => {
              const tier = typography[key];
              const meta = TIER_META[key];
              const parentKey = idx > 0 ? (TIER_ORDER as TypographyTierKey[])[idx - 1] : null;
              const maxSize = parentKey ? typography[parentKey].fontSize : 48;
              const draftValue = tierDraftSizes[key];
              const displayValue = draftValue !== undefined ? draftValue : String(tier.fontSize);
              const isClamped = clampedTiers.has(key);
              return (
                <div
                  key={key}
                  className={`rounded-md border px-2.5 py-2 space-y-1.5 transition-colors ${
                    isClamped
                      ? "border-amber-400/60 bg-amber-50/40 dark:bg-amber-900/10"
                      : "border-border/60 bg-muted/20"
                  }`}
                  style={{ marginLeft: `${idx * 4}px` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-medium text-foreground leading-tight truncate"
                        style={{ fontSize: `${Math.min(tier.fontSize, 18)}px` }}
                      >
                        {meta.label}
                      </span>
                      {isClamped && (
                        <span
                          role="status"
                          aria-live="polite"
                          className="shrink-0 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded px-1 py-0.5 leading-tight"
                        >
                          clamped to max
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={tier.fontSize <= 8}
                        onClick={() => {
                          handleTypographyChangeWithClamp({ ...typography, [key]: { ...tier, fontSize: tier.fontSize - 1 } });
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-30 text-xs font-bold leading-none"
                        aria-label={`Decrease ${meta.label} size`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={8}
                        max={maxSize}
                        value={displayValue}
                        onChange={(e) => {
                          setTierDraftSizes((prev) => ({ ...prev, [key]: e.target.value }));
                        }}
                        onBlur={(e) => handleTierSizeBlur(key, e.target.value, maxSize)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        className="w-10 text-[10px] font-mono text-center bg-background border border-border rounded px-1 py-0.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label={`${meta.label} font size in pixels`}
                      />
                      <span className="text-[9px] text-muted-foreground/60">px</span>
                      <button
                        type="button"
                        disabled={tier.fontSize >= maxSize}
                        onClick={() => {
                          handleTypographyChangeWithClamp({ ...typography, [key]: { ...tier, fontSize: tier.fontSize + 1 } });
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-30 text-xs font-bold leading-none"
                        aria-label={`Increase ${meta.label} size`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] bg-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/50 rounded-full transition-all duration-150"
                        style={{ width: `${(tier.fontSize / Math.max(typography.diagramTitle.fontSize, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="h-7 w-9 overflow-hidden flex items-end shrink-0" aria-hidden="true" title={`${tier.fontSize}px sample`}>
                      <span
                        className="text-muted-foreground/45 font-semibold leading-none"
                        style={{ fontSize: `${tier.fontSize}px` }}
                      >
                        Aa
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60 leading-snug">{meta.description}</p>
                  <input
                    type="text"
                    value={tier.fontFamily}
                    onChange={(e) => {
                      handleTypographyChangeWithClamp({ ...typography, [key]: { ...tier, fontFamily: e.target.value } });
                    }}
                    placeholder="(inherit palette font)"
                    className="w-full text-[10px] font-mono bg-background border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    aria-label={`${meta.label} font family override`}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Hierarchy enforced: each tier cannot exceed the tier above. Node Body size maps to the Mermaid <code className="font-mono bg-muted rounded px-0.5">fontSize</code> themeVariable. Other tiers and per-tier font overrides are included in the Prompt Scaffold export.
          </p>
        </div>

        <div className="p-3 border-b border-border">
          <p className="forge-eyebrow mb-1">
            My Palettes
          </p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Save the current colors as a named palette, share it via URL, or import/export JSON.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="text-xs px-2 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all"
            >
              Save as palette
            </button>
            <button
              onClick={handleCopyShareLink}
              className={`text-xs px-2 py-1.5 rounded-md border font-medium transition-all ${
                copiedShare
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-background hover:bg-muted hover:border-primary/40"
              }`}
            >
              {copiedShare ? "Link copied!" : "Copy share link"}
            </button>
            <button
              onClick={handleExportJson}
              className="text-xs px-2 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all"
            >
              Export JSON
            </button>
            <button
              onClick={handleImportClick}
              className="text-xs px-2 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all"
            >
              Import JSON
            </button>
          </div>
          {isCurrentUserPalette && (
            <button
              onClick={() => onDeleteUserPalette(selectedPaletteId)}
              className="w-full mt-2 text-xs px-2 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 font-medium transition-all"
            >
              Delete this palette
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChosen}
          />
        </div>

        <div className="p-3">
          <p className="forge-eyebrow mb-1">
            Bootstrap Export
          </p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Paste into your AI before generating diagrams to pre-load the theme.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopyBootstrap}
              className={`w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-md border font-medium transition-all ${
                copiedBootstrap
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-primary bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {copiedBootstrap ? "Copied!" : "Copy Bootstrap Markdown"}
            </button>
            <button
              onClick={() => setShowScaffoldModal(true)}
              className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-md border border-primary/35 bg-primary/8 text-primary hover:bg-primary/14 font-medium transition-all"
            >
              Copy Prompt Scaffold
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-[280px] md:min-h-0">
        <div className="flex items-center px-4 py-2 border-b border-border bg-card/20 flex-none gap-2">
          <span className="text-xs font-medium text-muted-foreground">Theme Preview</span>
          <span className="text-xs text-muted-foreground/60">— sample flowchart</span>
          <span className="ml-auto text-xs font-medium text-foreground">
            {effectiveThemeName}
          </span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <MermaidPreview code={sampleThemedCode} className="w-full h-full" typography={typography} />
        </div>
        {selectedPalette.themeIntent && (
          <div className="flex-none border-t border-border px-4 py-2.5 bg-card/20">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Use for:</span>{" "}
              {selectedPalette.themeIntent}
            </p>
          </div>
        )}
      </div>

      <PromptScaffoldModal
        open={showScaffoldModal}
        onClose={() => setShowScaffoldModal(false)}
        onCopy={handleScaffoldCopy}
        generatePreview={handleScaffoldPreview}
        rendererTarget={rendererTarget}
        onRendererTargetChange={onRendererTargetChange}
      />

      {showSaveDialog && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-palette-dialog-title"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card border border-border rounded-lg shadow-2xl p-5"
          >
            <p id="save-palette-dialog-title" className="text-sm font-semibold text-foreground mb-1">Save as new palette</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Saves the current colors and theme name as a named palette in your local browser.
            </p>
            <input
              type="text"
              value={savePaletteName}
              onChange={(e) => setSavePaletteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmSave();
                else if (e.key === "Escape") setShowSaveDialog(false);
              }}
              placeholder="My Custom Theme"
              autoFocus
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!savePaletteName.trim()}
                className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save palette
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PaletteRowProps {
  palette: Palette;
  selected: boolean;
  customized: boolean;
  onSelect: () => void;
  swatchIndices: number[];
  onDelete?: () => void;
  extraTag?: string;
}

function PaletteRow({ palette, selected, customized, onSelect, swatchIndices, onDelete, extraTag }: PaletteRowProps) {
  return (
    <div
      className={`group relative flex items-stretch rounded-md transition-all border ${
        selected
          ? "border-primary/60 bg-primary/8"
          : "border-transparent hover:bg-muted"
      }`}
    >
      <button
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${palette.name} palette${customized ? " (customized)" : ""}`}
        className={`flex-1 text-left px-2.5 py-2 text-xs font-medium ${
          selected ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {swatchIndices.map((i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: palette.colors[i]?.value ?? "#888" }}
              />
            ))}
          </div>
          <span className="flex-1 truncate">{palette.name}</span>
          {extraTag && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-muted-foreground/15 text-muted-foreground font-semibold uppercase tracking-wide">
              {extraTag}
            </span>
          )}
          {customized && (
            <span className="text-[9px] text-primary/60 font-normal">customized</span>
          )}
        </div>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${palette.name}`}
          className="opacity-0 group-hover:opacity-100 px-2 text-muted-foreground hover:text-destructive transition-all"
          title="Delete palette"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
