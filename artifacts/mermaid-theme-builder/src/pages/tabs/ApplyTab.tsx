import { useState, useCallback, useMemo } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { BUILTIN_PALETTES, BRAND_PALETTES, UTILITY_PALETTES } from "@/lib/palettes";
import { detectDiagram } from "@/lib/detector";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  type ExportOptions,
  type ScaffoldFormat,
} from "@/lib/themeEngine";
import { MermaidPreview } from "@/components/MermaidPreview";
import { ColorSwatch } from "@/components/ColorSwatch";
import { WarningBanner } from "@/components/WarningBanner";
import { CapabilityNote } from "@/components/CapabilityNote";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import type { AppTab } from "@/App";

const SWATCH_INDICES = [0, 3, 4, 6];

type PreviewMode = "original" | "themed";
type ExportType = "code" | "markdown" | "prompt";

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

interface ApplyTabProps {
  selectedPalette: Palette;
  selectedPaletteId: string;
  onSelectPalette: (id: string) => void;
  customColors: Record<string, ThemeColor[]>;
  onColorChange: (key: string, value: string) => void;
  onResetPalette: () => void;
  hasCustomizations: boolean;
  inputCode: string;
  onInputChange: (code: string) => void;
  includeMetaComments: boolean;
  includeBadge: boolean;
  effectiveThemeName: string;
  onSwitchTab: (tab: AppTab) => void;
}

const ALL_PALETTES = [...BRAND_PALETTES, ...UTILITY_PALETTES];

const EXPORT_LABELS: Record<ExportType, string> = {
  code: "Styled Code",
  markdown: "Markdown",
  prompt: "Prompt Scaffold",
};

export function ApplyTab({
  selectedPalette,
  selectedPaletteId,
  onSelectPalette,
  customColors,
  onColorChange,
  onResetPalette,
  hasCustomizations,
  inputCode,
  onInputChange,
  includeMetaComments,
  includeBadge,
  effectiveThemeName,
  onSwitchTab,
}: ApplyTabProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("themed");
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [copiedType, setCopiedType] = useState<ExportType | null>(null);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [textareaExpanded, setTextareaExpanded] = useState(false);

  const detection = useMemo(() => detectDiagram(inputCode), [inputCode]);

  const exportOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: detection.family,
      includeMetaComments,
      includeBadge,
      customThemeName:
        effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
    }),
    [selectedPalette, detection.family, includeMetaComments, includeBadge, effectiveThemeName],
  );

  const previewOptions = useMemo(
    (): ExportOptions => ({ ...exportOptions, includeBadge: false }),
    [exportOptions],
  );

  const themedCode = useMemo(
    () => (inputCode.trim() ? generateThemedCode(inputCode, previewOptions) : ""),
    [inputCode, previewOptions],
  );

  const exportCode = useMemo(
    () => (inputCode.trim() ? generateThemedCode(inputCode, exportOptions) : ""),
    [inputCode, exportOptions],
  );

  const previewCode = previewMode === "themed" ? themedCode : inputCode;

  const warnings = useMemo(() => {
    const w: string[] = [];
    const cap = detection.capability;
    if (detection.family !== "unknown" && cap && cap.warning) {
      const isPurelyPositive =
        cap.supportStatus === "native" &&
        cap.themeConfidence === "high" &&
        cap.stability === "stable";
      if (!isPurelyPositive) {
        w.push(cap.warning);
      }
    }
    return w;
  }, [detection]);

  const showCapabilityNote =
    detection.capability &&
    (detection.capability.notes || detection.capability.warning) &&
    (detection.capability.themeConfidence === "generic-only" ||
      detection.capability.themeConfidence === "not-applicable" ||
      detection.capability.stability !== "stable");

  const handleCopy = useCallback(
    async (type: ExportType) => {
      if (type === "prompt") {
        setShowScaffoldModal(true);
        return;
      }
      let text = "";
      if (type === "code") text = exportCode;
      else if (type === "markdown")
        text = generateMarkdownExport(exportCode, selectedPalette, exportOptions);
      await writeToClipboard(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    },
    [exportCode, selectedPalette, exportOptions],
  );

  const handleScaffoldCopy = useCallback(
    async (format: ScaffoldFormat) => {
      const text = generatePromptScaffoldWithFormat(selectedPalette, exportOptions, format);
      await writeToClipboard(text);
    },
    [selectedPalette, exportOptions],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none border-b border-border bg-card/30 px-3 py-2">
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
          {ALL_PALETTES.map((p) => {
            const effectiveColors =
              customColors[p.id]
                ? (BUILTIN_PALETTES.find((b) => b.id === p.id)?.colors ?? p.colors).map((c) => {
                    const override = customColors[p.id].find((o) => o.key === c.key);
                    return override ?? c;
                  })
                : p.colors;
            const swatchColors = SWATCH_INDICES.map((i) => effectiveColors[i]?.value ?? "#888");
            const isSelected = selectedPaletteId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPalette(p.id)}
                title={p.description}
                className={`flex-none flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all border ${
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
                {p.isBrandPreset && (
                  <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                    OKHP3
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        <div className="flex flex-col w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border min-h-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/20 flex-none gap-2">
            <span className="text-xs font-medium text-muted-foreground">Diagram Code</span>
            <div className="flex items-center gap-1.5">
              {detection.family !== "unknown" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                  {detection.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => setTextareaExpanded((v) => !v)}
                className="md:hidden text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/60 hover:border-border transition-colors inline-flex items-center gap-1"
                aria-label={textareaExpanded ? "Collapse code editor" : "Expand code editor"}
              >
                {textareaExpanded ? (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path
                        fillRule="evenodd"
                        d="M5 9a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path
                        fillRule="evenodd"
                        d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Expand
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste your Mermaid diagram here…"
            className={`flex-1 w-full p-3 bg-background text-foreground text-xs font-mono resize-none focus:outline-none placeholder:text-muted-foreground/50 md:min-h-0 transition-all ${
              textareaExpanded ? "min-h-[60vh]" : "min-h-[88px]"
            }`}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col w-full md:w-1/2 min-h-[220px] md:min-h-0">
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card/20 flex-none">
            {(["original", "themed"] as PreviewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all capitalize ${
                  previewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-4">
            <MermaidPreview code={previewCode} className="w-full h-full" />
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-border bg-card/40">
        {warnings.length > 0 && (
          <div className="px-3 pt-2.5">
            <WarningBanner warnings={warnings} />
          </div>
        )}
        {showCapabilityNote && detection.capability && (
          <div className="px-3 pt-2.5">
            <CapabilityNote capability={detection.capability} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => setShowColorEditor(true)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
              hasCustomizations
                ? "border-primary/40 bg-primary/8 text-primary hover:bg-primary/12"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                clipRule="evenodd"
              />
            </svg>
            Edit Colors
            {hasCustomizations && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            )}
          </button>

          <div className="flex-1" />

          {(["code", "markdown", "prompt"] as ExportType[]).map((type) => {
            const copied = copiedType === type;
            const disabled = !inputCode.trim() && type !== "prompt";
            return (
              <button
                key={type}
                onClick={() => handleCopy(type)}
                disabled={disabled}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                  copied
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-background hover:bg-muted hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {copied ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted-foreground">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                )}
                {copied ? "Copied!" : EXPORT_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {showColorEditor && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowColorEditor(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full md:w-80 bg-card border-l border-border flex flex-col shadow-2xl">
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
                    onClick={() => {
                      onResetPalette();
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setShowColorEditor(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
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
            <div className="flex-none border-t border-border px-3 py-2">
              <button
                onClick={() => {
                  setShowColorEditor(false);
                  onSwitchTab("compose");
                }}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1.5 transition-colors"
              >
                More options in Compose →
              </button>
            </div>
          </div>
        </>
      )}

      <PromptScaffoldModal
        open={showScaffoldModal}
        onClose={() => setShowScaffoldModal(false)}
        onCopy={handleScaffoldCopy}
      />
    </div>
  );
}
