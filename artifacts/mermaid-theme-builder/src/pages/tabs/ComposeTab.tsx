import { useState, useCallback, useMemo, useRef } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { BRAND_PALETTES, UTILITY_PALETTES } from "@/lib/palettes";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  type ExportOptions,
  type ScaffoldFormat,
} from "@/lib/themeEngine";
import { MermaidPreview } from "@/components/MermaidPreview";
import { MermaidReferral } from "@/components/MermaidReferral";
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

const FONT_FAMILY_OPTIONS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Trebuchet MS", value: "Trebuchet MS, Calibri, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Calibri", value: "Calibri, Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, Cambria, serif" },
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
}: ComposeTabProps) {
  const [copiedBootstrap, setCopiedBootstrap] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [savePaletteName, setSavePaletteName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: "flowchart",
      includeMetaComments,
      includeBadge: false,
      customThemeName:
        effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
    }),
    [selectedPalette, includeMetaComments, effectiveThemeName],
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

  const SWATCH_INDICES = [0, 3, 4];
  const isCurrentUserPalette = userPalettes.some((p) => p.id === selectedPaletteId);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="flex flex-col w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0">
        <div className="p-3 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Theme
          </p>
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pb-1">
              Brand Presets
            </p>
            {BRAND_PALETTES.map((p) => (
              <PaletteRow
                key={p.id}
                palette={p}
                selected={selectedPaletteId === p.id}
                customized={Boolean(customColors[p.id])}
                onSelect={() => onSelectPalette(p.id)}
                swatchIndices={SWATCH_INDICES}
              />
            ))}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2 pb-1">
              Utility Presets
            </p>
            {UTILITY_PALETTES.map((p) => (
              <PaletteRow
                key={p.id}
                palette={p}
                selected={selectedPaletteId === p.id}
                customized={Boolean(customColors[p.id])}
                onSelect={() => onSelectPalette(p.id)}
                swatchIndices={SWATCH_INDICES}
              />
            ))}
            {userPalettes.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2 pb-1">
                  My Palettes
                </p>
                {userPalettes.map((p) => (
                  <PaletteRow
                    key={p.id}
                    palette={p}
                    selected={selectedPaletteId === p.id}
                    customized={Boolean(customColors[p.id])}
                    onSelect={() => onSelectPalette(p.id)}
                    swatchIndices={SWATCH_INDICES}
                    onDelete={() => onDeleteUserPalette(p.id)}
                    extraTag={isExtractedPaletteId(p.id) ? "Extracted" : "Saved"}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Colors
            </p>
            {hasCustomizations && (
              <button
                onClick={onResetPalette}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
            {selectedPalette.description}
          </p>
          <div className="space-y-0.5">
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Settings
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Font family</label>
              <FontFamilySelect
                value={
                  customColors[selectedPaletteId]?.find((c) => c.key === "fontFamily")?.value ??
                  selectedPalette.colors.find((c) => c.key === "fontFamily")?.value ??
                  "Inter, system-ui, sans-serif"
                }
                onChange={(v) => onColorChange("fontFamily", v)}
              />
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
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
                  : "border-border bg-background hover:bg-muted hover:border-primary/40"
              }`}
            >
              {copiedBootstrap ? "Copied!" : "Copy Bootstrap Markdown"}
            </button>
            <button
              onClick={() => setShowScaffoldModal(true)}
              className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all"
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
          <MermaidPreview code={sampleThemedCode} className="w-full h-full" />
        </div>
        <div className="flex-none border-t border-border px-4 py-1.5 bg-card/20 print-hide">
          <MermaidReferral variant="chart" />
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
      />

      {showSaveDialog && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card border border-border rounded-lg shadow-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1">Save as new palette</p>
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
