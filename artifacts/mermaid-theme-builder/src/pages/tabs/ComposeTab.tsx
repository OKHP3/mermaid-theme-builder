import { useState, useCallback, useMemo } from "react";
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
import { ColorSwatch } from "@/components/ColorSwatch";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { GENERIC_EXAMPLE } from "@/data/examples";

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
}: ComposeTabProps) {
  const [copiedBootstrap, setCopiedBootstrap] = useState(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);

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

  const SWATCH_INDICES = [0, 3, 4];

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
              <button
                key={p.id}
                onClick={() => onSelectPalette(p.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-xs font-medium transition-all border ${
                  selectedPaletteId === p.id
                    ? "border-primary/60 bg-primary/8 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {SWATCH_INDICES.map((i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: p.colors[i]?.value ?? "#888" }}
                      />
                    ))}
                  </div>
                  <span className="flex-1">{p.name}</span>
                  {customColors[p.id] && (
                    <span className="text-[9px] text-primary/60 font-normal">customized</span>
                  )}
                </div>
              </button>
            ))}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-2 pb-1">
              Utility Presets
            </p>
            {UTILITY_PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPalette(p.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-xs font-medium transition-all border ${
                  selectedPaletteId === p.id
                    ? "border-primary/60 bg-primary/8 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {SWATCH_INDICES.map((i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: p.colors[i]?.value ?? "#888" }}
                      />
                    ))}
                  </div>
                  <span className="flex-1">{p.name}</span>
                  {customColors[p.id] && (
                    <span className="text-[9px] text-primary/60 font-normal">customized</span>
                  )}
                </div>
              </button>
            ))}
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
    </div>
  );
}
