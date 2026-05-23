import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { BUILTIN_PALETTES, BRAND_PALETTES, UTILITY_PALETTES } from "@/lib/palettes";
import { detectDiagram, type DetectionResult } from "@/lib/detector";
import { DIAGRAM_CAPABILITIES, getCapabilityById, type DiagramFamily } from "@/data/mermaid-capabilities";
import { splitDiagrams } from "@/lib/diagramSplit";
import { DiffView } from "@/components/DiffView";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffoldWithFormat,
  CLASSDEF_CAPABLE_FAMILIES,
  type ExportOptions,
  type ScaffoldFormat,
  type MermaidLook,
} from "@/lib/themeEngine";
import { readScaffoldFormat } from "@/lib/scaffoldPrefs";
import { MermaidPreview } from "@/components/MermaidPreview";
import { ColorSwatch } from "@/components/ColorSwatch";
import { WarningBanner } from "@/components/WarningBanner";
import { CapabilityNote } from "@/components/CapabilityNote";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { hasExtractableTheme, isExtractedPaletteId } from "@/lib/extractor";
import {
  downloadTextFile,
  downloadBlob,
  renderToSvg,
  svgStringToPngBlob,
  makeFilename,
  paletteToPortableJson,
  paletteToCssVariables,
  palettesToBundleJson,
} from "@/lib/exporters";
import { openInLiveEditor } from "@/lib/liveEditor";
import { BRAND_EXAMPLES } from "@/data/examples";
import { RENDERER_PROFILES, getRendererById } from "@/data/renderer-parity";
import { FamilySyntaxHint } from "@/components/FamilySyntaxHint";
import { type TypographySettings } from "@/lib/typography";
import type { AppTab } from "@/App";

const SWATCH_INDICES = [0, 3, 4, 6];

type PreviewMode = "original" | "themed" | "diff" | "code";
type ExportType = "code" | "markdown" | "prompt";
type DownloadType = "mermaid" | "svg" | "png" | "json" | "markdown" | "scaffold" | "css" | "bundle";

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
  onResetColor: (key: string) => void;
  hasCustomizations: boolean;
  inputCode: string;
  onInputChange: (code: string) => void;
  includeMetaComments: boolean;
  includeBadge: boolean;
  effectiveThemeName: string;
  onSwitchTab: (tab: AppTab) => void;
  onExtractTheme: (name?: string) => Palette | null;
  userPalettes: Palette[];
  onShowToast: (msg: string) => void;
  recentPaletteIds: string[];
  look: MermaidLook;
  onLookChange: (v: MermaidLook) => void;
  fontSize: string;
  onFontSizeChange: (v: string) => void;
  typography: TypographySettings;
  rendererTarget: string;
  onRendererTargetChange: (v: string) => void;
  lastExampleType: Record<string, "flowchart" | "sequence">;
  onRecordExampleType: (id: string, type: "flowchart" | "sequence") => void;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
}

const EXPORT_LABELS: Record<ExportType, string> = {
  code: "Styled Code",
  markdown: "Markdown",
  prompt: "Prompt Scaffold",
};

const DOWNLOAD_LABELS: Record<DownloadType, string> = {
  mermaid: ".mermaid",
  svg: ".svg",
  png: ".png",
  json: ".theme.json",
  markdown: ".md",
  scaffold: ".txt",
  css: ".css",
  bundle: ".bundle.json",
};

export function ApplyTab({
  selectedPalette,
  selectedPaletteId,
  onSelectPalette,
  customColors,
  onColorChange,
  onResetPalette,
  onResetColor,
  hasCustomizations,
  inputCode,
  onInputChange,
  includeMetaComments,
  includeBadge,
  effectiveThemeName,
  onSwitchTab,
  onExtractTheme,
  userPalettes,
  onShowToast,
  recentPaletteIds,
  look,
  onLookChange,
  fontSize,
  onFontSizeChange: _onFontSizeChange,
  typography,
  rendererTarget,
  onRendererTargetChange,
  lastExampleType,
  onRecordExampleType,
  previewMode,
  onPreviewModeChange: setPreviewMode,
}: ApplyTabProps) {
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [copiedType, setCopiedType] = useState<ExportType | null>(null);
  const [downloadingType, setDownloadingType] = useState<DownloadType | null>(null);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);

  const rendererProfile = useMemo(() => getRendererById(rendererTarget), [rendererTarget]);
  const rendererLookWarning = useMemo((): string | null => {
    if (!rendererProfile) return null;
    const support = rendererProfile.looksSupported[look as keyof typeof rendererProfile.looksSupported];
    if (support === "none") {
      const label = look === "neo" ? "Neo" : look === "handDrawn" ? "Hand Drawn" : "Classic";
      return `${rendererProfile.shortName} does not support ${label} look`;
    }
    if (support === "partial") {
      const label = look === "neo" ? "Neo" : look === "handDrawn" ? "Hand Drawn" : "Classic";
      return `${rendererProfile.shortName} has partial ${label} look support — validate before publishing`;
    }
    return null;
  }, [rendererProfile, look]);

  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [textareaExpanded, setTextareaExpanded] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [activeDiagramIdx, setActiveDiagramIdx] = useState(0);
  const [familyOverride, setFamilyOverride] = useState<DiagramFamily | null>(null);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const colorEditorRef = useRef<HTMLDivElement>(null);
  const colorEditorOpenerRef = useRef<HTMLButtonElement | null>(null);

  const diagrams = useMemo(() => splitDiagrams(inputCode), [inputCode]);
  const isMultiDiagram = diagrams.length > 1;
  const safeDiagramIdx = Math.min(activeDiagramIdx, diagrams.length - 1);
  const activeDiagramCode = diagrams[safeDiagramIdx]?.content ?? inputCode;

  useEffect(() => {
    if (activeDiagramIdx >= diagrams.length) setActiveDiagramIdx(0);
  }, [diagrams.length, activeDiagramIdx]);

  // Reset the advisory banner whenever the user picks a different target renderer.
  useEffect(() => {
    setAdvisoryDismissed(false);
  }, [rendererTarget]);

  // ESC closes the color editor / download menu / family menu when open.
  useEffect(() => {
    if (!showColorEditor && !showDownloadMenu && !showFamilyMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showColorEditor) setShowColorEditor(false);
        if (showDownloadMenu) setShowDownloadMenu(false);
        if (showFamilyMenu) setShowFamilyMenu(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showColorEditor, showDownloadMenu, showFamilyMenu]);

  // Focus trap + initial focus + restore for the color editor dialog.
  useEffect(() => {
    if (!showColorEditor) return;
    const dialog = colorEditorRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    colorEditorOpenerRef.current = previouslyFocused instanceof HTMLButtonElement ? previouslyFocused : null;

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("aria-hidden"));

    const list = focusable();
    if (list.length) list[0].focus();

    const onKey = (e: KeyboardEvent) => {
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
        colorEditorOpenerRef.current?.focus();
      } catch {
        // ignore
      }
    };
  }, [showColorEditor]);

  const detection = useMemo(() => detectDiagram(activeDiagramCode), [activeDiagramCode]);

  // Effective detection — applies the user's manual family override on top of
  // auto-detection. Warnings/hasThemeInit always come from real detection (they
  // describe the input code itself, not the family selection). The override
  // swaps family/label/capability so downstream export options, capability
  // notes, and the chip all reflect the user's choice.
  const effectiveDetection = useMemo<DetectionResult>(() => {
    if (!familyOverride) return detection;
    const cap = getCapabilityById(familyOverride);
    return {
      ...detection,
      family: familyOverride,
      label: cap?.displayName ?? familyOverride,
      capability: cap ?? null,
    };
  }, [detection, familyOverride]);

  const exportAdvisories = useMemo((): string[] => {
    if (!inputCode.trim() || !rendererTarget) return [];
    const r = getRendererById(rendererTarget);
    if (!r) return [];

    const advisories: string[] = [];
    const hasCustomFont = selectedPalette.colors.some(
      (c) => c.key === "fontFamily" && c.value && c.value.trim() !== "",
    );
    const classDefActive = CLASSDEF_CAPABLE_FAMILIES.includes(effectiveDetection.family);

    if (r.initDirectiveSupport !== "full") {
      advisories.push(
        `%%{init}%% directive has partial support on ${r.shortName} — some theme colors may differ`,
      );
    }
    if (r.themeVariableSupport !== "full") {
      advisories.push(
        `themeVariables partially applied on ${r.shortName} — only a subset of colors will take effect`,
      );
    }
    if (classDefActive && r.classDefSupport !== "full") {
      advisories.push(
        `classDef node styles may render differently on ${r.shortName} — validate before publishing`,
      );
    }
    if (hasCustomFont && r.customFontSupport === "none") {
      advisories.push(
        `Custom fontFamily is blocked on ${r.shortName} — system font fallback will apply`,
      );
    }

    return advisories;
  }, [inputCode, selectedPalette, effectiveDetection.family, rendererTarget]);

  const canExtract = useMemo(() => hasExtractableTheme(inputCode), [inputCode]);
  const isExtracted = isExtractedPaletteId(selectedPaletteId);

  const allPalettes = useMemo(
    () => [...BRAND_PALETTES, ...UTILITY_PALETTES, ...userPalettes],
    [userPalettes],
  );

  const recentPalettes = useMemo(() => {
    if (!recentPaletteIds.length) return [];
    const lookup = new Map(allPalettes.map((p) => [p.id, p]));
    return recentPaletteIds.map((id) => lookup.get(id)).filter((p): p is Palette => Boolean(p));
  }, [recentPaletteIds, allPalettes]);

  const exportOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: effectiveDetection.family,
      includeMetaComments,
      includeBadge,
      customThemeName:
        effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
      look,
      fontSize: fontSize || undefined,
      typography,
      rendererTarget,
    }),
    [selectedPalette, effectiveDetection.family, includeMetaComments, includeBadge, effectiveThemeName, look, fontSize, typography, rendererTarget],
  );

  const previewOptions = useMemo(
    (): ExportOptions => ({ ...exportOptions, includeBadge: false }),
    [exportOptions],
  );

  const themedCode = useMemo(
    () => (activeDiagramCode.trim() ? generateThemedCode(activeDiagramCode, previewOptions) : ""),
    [activeDiagramCode, previewOptions],
  );

  const exportCode = useMemo(
    () => (activeDiagramCode.trim() ? generateThemedCode(activeDiagramCode, exportOptions) : ""),
    [activeDiagramCode, exportOptions],
  );

  const { codeEditorOverride, setCodeEditorOverride, effectiveExportCode } = useCodeEditorOverride(exportCode);

  const previewCode = previewMode === "themed" ? themedCode : activeDiagramCode;

  const warnings = useMemo(() => {
    const w: string[] = [];
    // Input-level warnings from the detector (unknown family, existing init,
    // non-printable chars, long labels, and diagram breaker checks).
    w.push(...detection.warnings);
    const cap = effectiveDetection.capability;
    if (effectiveDetection.family !== "unknown" && cap && cap.warning) {
      const isPurelyPositive =
        cap.supportStatus === "native" &&
        cap.themeConfidence === "high" &&
        cap.stability === "stable";
      if (!isPurelyPositive) {
        w.push(cap.warning);
      }
    }
    if (familyOverride && detection.family !== "unknown" && detection.family !== familyOverride) {
      w.push(
        `Manual family override active — auto-detect saw “${detection.label}”, you selected “${effectiveDetection.label}”. Clear the override from the family chip to restore auto-detect.`,
      );
    }
    return w;
  }, [effectiveDetection, detection, familyOverride]);

  const showCapabilityNote =
    effectiveDetection.capability &&
    (effectiveDetection.capability.notes || effectiveDetection.capability.warning) &&
    (effectiveDetection.capability.themeConfidence === "generic-only" ||
      effectiveDetection.capability.themeConfidence === "not-applicable" ||
      effectiveDetection.capability.stability !== "stable");

  const promptIsThemeOnly =
    effectiveDetection.family !== "unknown" &&
    !CLASSDEF_CAPABLE_FAMILIES.includes(effectiveDetection.family);

  const handleCopy = useCallback(
    async (type: ExportType) => {
      if (type === "prompt") {
        setShowScaffoldModal(true);
        return;
      }
      let text = "";
      if (type === "code") text = effectiveExportCode;
      else if (type === "markdown")
        text = generateMarkdownExport(effectiveExportCode, selectedPalette, exportOptions);
      await writeToClipboard(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    },
    [effectiveExportCode, selectedPalette, exportOptions],
  );

  // Global keyboard shortcut: Ctrl/Cmd+Shift+C copies the Styled Code.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      if (e.key !== "C" && e.key !== "c") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      e.preventDefault();
      void handleCopy("code");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCopy]);

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

  const handleDownload = useCallback(
    async (type: DownloadType) => {
      if (downloadingType) return;
      setShowDownloadMenu(false);
      setDownloadingType(type);
      try {
        if (type === "mermaid") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "themed", "mermaid"),
            effectiveExportCode,
            "text/plain;charset=utf-8",
          );
          onShowToast("Downloaded .mermaid file.");
        } else if (type === "json") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "theme", "json"),
            paletteToPortableJson(selectedPalette),
            "application/json;charset=utf-8",
          );
          onShowToast("Downloaded .theme.json file.");
        } else if (type === "svg") {
          const svg = await renderToSvg(themedCode);
          downloadTextFile(
            makeFilename(effectiveThemeName, "diagram", "svg"),
            svg,
            "image/svg+xml;charset=utf-8",
          );
          onShowToast("Downloaded .svg file.");
        } else if (type === "png") {
          const svg = await renderToSvg(themedCode);
          const blob = await svgStringToPngBlob(svg, 2);
          downloadBlob(makeFilename(effectiveThemeName, "diagram", "png"), blob);
          onShowToast("Downloaded .png file.");
        } else if (type === "markdown") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "themed", "md"),
            generateMarkdownExport(effectiveExportCode, selectedPalette, exportOptions),
            "text/markdown;charset=utf-8",
          );
          onShowToast("Downloaded .md file.");
        } else if (type === "scaffold") {
          const scaffoldFormat: ScaffoldFormat = readScaffoldFormat();
          downloadTextFile(
            makeFilename(effectiveThemeName, "scaffold", "txt"),
            generatePromptScaffoldWithFormat(selectedPalette, exportOptions, scaffoldFormat),
            "text/plain;charset=utf-8",
          );
          onShowToast("Downloaded .txt scaffold file.");
        } else if (type === "css") {
          downloadTextFile(
            makeFilename(effectiveThemeName, "theme", "css"),
            paletteToCssVariables(selectedPalette),
            "text/css;charset=utf-8",
          );
          onShowToast("Downloaded .css variables file.");
        } else if (type === "bundle") {
          downloadTextFile(
            makeFilename("mermaid-theme-builder", "palettes", "bundle.json"),
            palettesToBundleJson(allPalettes),
            "application/json;charset=utf-8",
          );
          onShowToast(`Downloaded bundle of ${allPalettes.length} palettes.`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        onShowToast(`Download failed: ${msg.slice(0, 80)}`);
      } finally {
        setDownloadingType(null);
      }
    },
    [downloadingType, effectiveExportCode, themedCode, selectedPalette, effectiveThemeName, allPalettes, exportOptions, onShowToast],
  );

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      {recentPalettes.length > 1 && (
        <div className="flex-none border-b border-border bg-muted/20 px-3 py-1.5 flex items-center gap-2 print-hide">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold shrink-0">
            Recent
          </span>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {recentPalettes.map((p) => {
              const isSelected = selectedPaletteId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPalette(p.id)}
                  title={`Switch to ${p.name}`}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all ${
                    isSelected
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full border border-black/10"
                    style={{ backgroundColor: p.colors[3]?.value ?? p.colors[0]?.value ?? "#888" }}
                    aria-hidden="true"
                  />
                  {p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex-none border-b border-border bg-card/30 px-3 py-2 print-hide">
        <div
          role="radiogroup"
          aria-label="Palette selector"
          className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin"
          onKeyDown={(e) => {
            // Arrow keys / Home / End navigate the palette tiles. We move
            // selection (not just focus) so the preview updates immediately —
            // matches the "radiogroup with roving tabindex" ARIA pattern.
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
                // Roving focus to the newly-selected tile.
                requestAnimationFrame(() => {
                  const el = document.getElementById(`palette-tile-${next.id}`);
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
                id={`palette-tile-${p.id}`}
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
                {p.isBrandPreset && (
                  <span className="text-[8px] leading-none px-1 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                    OKHP3
                  </span>
                )}
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


      {BRAND_EXAMPLES[selectedPaletteId] && (
        <div className="flex-none border-b border-border bg-card/20 px-3 py-1.5 flex items-center gap-2 print-hide">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold shrink-0">
            Example
          </span>
          <div className="flex gap-1">
            {(["flowchart", "sequence"] as const).map((type) => {
              const isActive = (lastExampleType[selectedPaletteId] ?? "flowchart") === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onInputChange(BRAND_EXAMPLES[selectedPaletteId][type]);
                    onRecordExampleType(selectedPaletteId, type);
                    onShowToast(`Loaded ${selectedPalette.name} ${type} example`);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {type === "flowchart" ? "Flowchart" : "Sequence"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-none border-b border-border bg-card/20 px-3 py-1.5 flex items-center gap-x-1.5 sm:gap-x-3 overflow-x-auto print-hide">
        {/* Target */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Target</span>
          <select
            value={rendererTarget}
            onChange={(e) => onRendererTargetChange(e.target.value)}
            className="text-[10px] bg-background border border-border rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer max-w-[80px] sm:max-w-none"
            aria-label="Select target renderer"
          >
            <option value="">Generic (most compatible)</option>
            {RENDERER_PROFILES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>
          {rendererLookWarning ? (
            <span className="hidden sm:flex text-[10px] text-amber-600 dark:text-amber-400 items-center gap-1">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 8.25a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              {rendererLookWarning}
            </span>
          ) : (
            rendererProfile && (
              <span className="hidden sm:block text-[10px] text-muted-foreground/50">
                {rendererProfile.mermaidVersionApprox}
              </span>
            )
          )}
        </div>

        <div className="w-px h-3.5 bg-border/60 shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Look */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Look</span>
          <div className="flex gap-1 shrink-0">
            {(
              [
                { value: "classic" as MermaidLook, label: "Classic" },
                { value: "neo" as MermaidLook, label: "Neo" },
                { value: "handDrawn" as MermaidLook, label: "Hand Drawn" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onLookChange(opt.value)}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                  look === opt.value
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {look !== "classic" && (
            <span className="hidden sm:block text-[10px] text-muted-foreground/60">
              {look === "neo" ? "v11+ required" : "sketch style"}
            </span>
          )}
        </div>

        <div className="w-px h-3.5 bg-border/60 shrink-0 hidden sm:block" aria-hidden="true" />

        {/* Chart Type */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowFamilyMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showFamilyMenu}
            title={
              familyOverride
                ? `Family override: ${effectiveDetection.label} (auto-detected: ${detection.label}). Click to change or clear.`
                : detection.family === "unknown"
                ? "Diagram family not auto-detected — click to set manually."
                : `Auto-detected family: ${detection.label}. Click to override.`
            }
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 transition-colors ${
              familyOverride
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
                : effectiveDetection.family === "unknown"
                ? "bg-muted text-muted-foreground border border-border hover:bg-muted/70"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <span>{effectiveDetection.family === "unknown" ? "Set family…" : effectiveDetection.label}</span>
            {familyOverride && <span className="text-[9px] opacity-70">override</span>}
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 opacity-60" fill="currentColor" aria-hidden="true">
              <path d="M3 4.5l3 3 3-3z" />
            </svg>
          </button>
          {showFamilyMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFamilyMenu(false)}
                aria-hidden="true"
              />
              <div
                className="absolute left-0 top-full mt-1 z-40 min-w-[200px] max-h-[320px] overflow-auto rounded-md border border-border bg-popover shadow-lg py-1"
                role="menu"
                aria-label="Override diagram family"
              >
                <button
                  role="menuitemradio"
                  aria-checked={!familyOverride}
                  onClick={() => {
                    setFamilyOverride(null);
                    setShowFamilyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${
                    !familyOverride ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span>Auto-detect</span>
                  <span className="text-[10px] opacity-60">
                    {detection.family === "unknown" ? "unknown" : detection.label}
                  </span>
                </button>
                <div className="border-t border-border my-1" aria-hidden="true" />
                {DIAGRAM_CAPABILITIES.map((cap) => {
                  const active = familyOverride === cap.id;
                  return (
                    <button
                      key={cap.id}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setFamilyOverride(cap.id);
                        setShowFamilyMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {cap.displayName}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {exportAdvisories.length > 0 && !advisoryDismissed && (
        <div className="flex-none border-b border-sky-500/25 bg-sky-500/6 px-3 py-1.5 flex items-center gap-2 print-hide">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <span className="flex-1 min-w-0 text-[10px] text-sky-800 dark:text-sky-200/80 leading-snug truncate">
            {exportAdvisories[0]}
            {exportAdvisories.length > 1 && (
              <span className="text-sky-600 dark:text-sky-400 ml-1">+{exportAdvisories.length - 1} more</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setAdvisoryDismissed(true)}
            aria-label="Dismiss renderer advisory"
            className="shrink-0 text-sky-500/60 hover:text-sky-500 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      )}

      <FamilySyntaxHint family={effectiveDetection.family} />

      <div className="md:flex-1 md:overflow-hidden flex flex-col md:flex-row md:min-h-0">
        <div className="flex flex-col md:flex-none md:w-1/2 border-b md:border-b-0 md:border-r border-border md:min-h-0 print-hide">
          {isExtracted && /^\s*classDef\s+/m.test(inputCode) && (
            <div className="px-3 py-1.5 flex items-start gap-1.5 bg-primary/5 border-b border-primary/20">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-primary shrink-0 mt-0.5" aria-hidden="true">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" />
              </svg>
              <p className="text-[10px] text-primary/80 leading-snug">
                classDef overrides from Extract are in this code — edit them here or re-extract to tweak further.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/20 flex-none gap-2">
            <span className="text-xs font-medium text-muted-foreground">Diagram Code</span>
            <button
              type="button"
              onClick={() => setTextareaExpanded((v) => !v)}
              className="md:hidden text-[10px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/60 hover:border-border transition-colors inline-flex items-center gap-1"
              aria-label={textareaExpanded ? "Collapse code editor" : "Expand code editor"}
            >
              {textareaExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste your Mermaid diagram here…"
            aria-label="Mermaid diagram code input"
            className={`forge-code-panel flex-1 w-full p-3 text-xs font-mono resize-none md:min-h-0 transition-all ${
              textareaExpanded ? "min-h-[60vh]" : "min-h-[160px]"
            }`}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col md:flex-none md:w-1/2 md:min-h-0 md:overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/20 flex-none flex-wrap print-hide">
            <div
              className="flex items-center gap-1"
              role="tablist"
              aria-label="Preview mode"
              onKeyDown={(e) => {
                const modes: PreviewMode[] = ["original", "themed", "diff", "code"];
                const idx = modes.indexOf(previewMode);
                let next: number | null = null;
                if (e.key === "ArrowLeft") next = (idx - 1 + modes.length) % modes.length;
                else if (e.key === "ArrowRight") next = (idx + 1) % modes.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = modes.length - 1;
                if (next !== null) {
                  e.preventDefault();
                  setPreviewMode(modes[next]);
                  requestAnimationFrame(() => {
                    const btn = document.querySelector<HTMLButtonElement>(`[data-preview-mode="${modes[next!]}"]`);
                    btn?.focus();
                  });
                }
              }}
            >
              {(["original", "themed", "diff", "code"] as PreviewMode[]).map((mode) => {
                const selected = previewMode === mode;
                return (
                  <button
                    key={mode}
                    data-preview-mode={mode}
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setPreviewMode(mode)}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-all capitalize ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
            {previewMode === "code" && codeEditorOverride !== null && (
              <button
                type="button"
                onClick={() => setCodeEditorOverride(null)}
                title="Discard edits and reset to computed output"
                className="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-500/20 transition-colors"
              >
                Reset
              </button>
            )}
            {isMultiDiagram && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mr-1">
                  Diagram
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDiagramIdx((i) => Math.max(0, i - 1))}
                  disabled={safeDiagramIdx === 0}
                  className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous diagram"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <select
                  value={safeDiagramIdx}
                  onChange={(e) => setActiveDiagramIdx(Number(e.target.value))}
                  className="text-[11px] px-2 py-0.5 rounded border border-border bg-background text-foreground"
                  aria-label="Select diagram"
                >
                  {diagrams.map((d) => (
                    <option key={d.index} value={d.index}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setActiveDiagramIdx((i) => Math.min(diagrams.length - 1, i + 1))}
                  disabled={safeDiagramIdx === diagrams.length - 1}
                  className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next diagram"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {previewMode === "code" ? (
            <textarea
              className="forge-code-panel flex-1 min-h-[160px] md:min-h-0 w-full p-3 text-xs font-mono resize-none overflow-auto focus:outline-none"
              value={effectiveExportCode}
              onChange={(e) => setCodeEditorOverride(e.target.value)}
              spellCheck={false}
              aria-label="Styled code output — edit to customise before copying"
              placeholder="Paste a diagram above to see the styled output…"
            />
          ) : (
            <div className="md:flex-1 overflow-auto p-3 md:p-4 min-h-[260px]" data-print-only>
              {previewMode === "diff" ? (
                <DiffView oldText={activeDiagramCode} newText={themedCode} className="w-full h-full" />
              ) : (
                <MermaidPreview code={previewCode} className="w-full h-full" typography={typography} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-none border-t border-border bg-card/40 print-hide">
        {warnings.length > 0 && (
          <div className="px-3 pt-2.5">
            <WarningBanner warnings={warnings} />
          </div>
        )}
        {showCapabilityNote && effectiveDetection.capability && (
          <div className="px-3 pt-2.5">
            <CapabilityNote capability={effectiveDetection.capability} />
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

          <button
            onClick={() => openInLiveEditor(exportCode)}
            disabled={!inputCode.trim()}
            title="Open themed diagram in Mermaid Live Editor (mermaid.live)"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted-foreground">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
            Live Editor
          </button>

          {(["code", "prompt"] as ExportType[]).map((type) => {
            const copied = copiedType === type;
            const disabled = !inputCode.trim() && type !== "prompt";
            const isPrimary = type === "code";
            const isAccent = type === "prompt";
            return (
              <button
                key={type}
                onClick={() => handleCopy(type)}
                disabled={disabled}
                title={type === "code" ? "Copy themed Mermaid code (Ctrl+Shift+C)" : undefined}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                  copied
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isPrimary
                    ? "border-primary bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    : isAccent
                    ? "border-primary/35 bg-primary/8 text-primary hover:bg-primary/14 disabled:opacity-40 disabled:cursor-not-allowed"
                    : "border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
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
                {type === "prompt" && !copied && rendererProfile && (
                  <span className="ml-0.5 px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-[#c46a2c]/15 text-[#c46a2c] border border-[#c46a2c]/30">
                    {rendererProfile.shortName}
                  </span>
                )}
                {type === "prompt" && !copied && promptIsThemeOnly && (
                  <span
                    title="This diagram type uses theme-level colors only — per-node classDef classes are not supported"
                    className="ml-0.5 px-1.5 py-px rounded text-[10px] font-semibold leading-none bg-muted text-muted-foreground border border-border"
                  >
                    Theme-only
                  </span>
                )}
              </button>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu((v) => !v)}
              disabled={!inputCode.trim() || !!downloadingType}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/40 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted-foreground">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              {downloadingType ? `Saving ${DOWNLOAD_LABELS[downloadingType]}…` : "Download"}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-muted-foreground">
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute right-0 bottom-full mb-1 z-40 min-w-[180px] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                  {(["mermaid", "markdown", "scaffold", "svg", "png", "json", "css", "bundle"] as DownloadType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleDownload(t)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-foreground">{DOWNLOAD_LABELS[t]}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {t === "mermaid" && "raw text"}
                        {t === "markdown" && "bootstrap"}
                        {t === "scaffold" && "prompt"}
                        {t === "svg" && "vector"}
                        {t === "png" && "raster 2x"}
                        {t === "json" && "palette"}
                        {t === "css" && "variables"}
                        {t === "bundle" && "all palettes"}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showColorEditor && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowColorEditor(false)}
          />
          <aside
            ref={colorEditorRef}
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
                    onClick={() => {
                      onResetPalette();
                    }}
                    aria-label="Reset all color overrides to default"
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowColorEditor(false)}
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
                onClick={() => {
                  setShowColorEditor(false);
                  onSwitchTab("compose");
                }}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1.5 transition-colors"
              >
                More options in Compose →
              </button>
            </div>
          </aside>
        </>
      )}

      <PromptScaffoldModal
        open={showScaffoldModal}
        onClose={() => setShowScaffoldModal(false)}
        onCopy={handleScaffoldCopy}
        generatePreview={handleScaffoldPreview}
        rendererTarget={rendererTarget}
        onRendererTargetChange={onRendererTargetChange}
      />
    </div>
  );
}
