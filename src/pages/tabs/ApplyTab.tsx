import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useCodeEditorOverride } from "@/hooks/useCodeEditorOverride";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { BRAND_PALETTES, UTILITY_PALETTES } from "@/lib/palettes";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { detectDiagram, type DetectionResult } from "@/lib/detector";
import { getCapabilityById, type DiagramFamily } from "@/data/mermaid-capabilities";
import { splitDiagrams } from "@/lib/diagram-split";
import {
  generateThemedCode,
  generatePromptScaffoldWithFormat,
  CLASSDEF_CAPABLE_FAMILIES,
  type ExportOptions,
  type ScaffoldFormat,
  type MermaidLook,
} from "@/lib/theme-engine";
import { writeToClipboard } from "@/lib/clipboard";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { isExtractedPaletteId } from "@/lib/extractor";
import { getRendererById } from "@/data/renderer-parity";
import { getFamilySyntaxHint, isHintDismissed } from "@/lib/family-syntax-hints";
import { type TypographySettings } from "@/lib/typography";
import type { AppTab } from "@/App";
import type { MyThemeSlot } from "@/lib/my-theme-slots";
import { DiagramDetectHeader } from "./apply/DiagramDetectHeader";
import { RenderWarningSection } from "./apply/RenderWarningSection";
import { DiagramPreviewPanel, type PreviewMode } from "./apply/DiagramPreviewPanel";
import { ExportToolbar } from "./apply/ExportToolbar";
import { ColorEditorPanel } from "./apply/ColorEditorPanel";

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
  onShowToast: (msg: ReactNode) => void;
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
  hintResetToken: number;
  onResetSyntaxHints: () => void;
  myThemeSlots?: MyThemeSlot[];
  activeMyThemeSlotId?: string | null;
  onSelectMyThemeSlot?: (id: string) => void;
  onAddMyThemeSlot?: () => void;
  onDeleteMyThemeSlot?: (id: string) => void;
  onExportMyThemeSlot?: (id: string) => void;
}

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
  onExtractTheme: _onExtractTheme,
  userPalettes,
  onShowToast,
  recentPaletteIds: _recentPaletteIds,
  look,
  onLookChange,
  fontSize,
  onFontSizeChange: _onFontSizeChange,
  typography,
  rendererTarget,
  onRendererTargetChange,
  lastExampleType: _lastExampleType,
  onRecordExampleType: _onRecordExampleType,
  previewMode,
  onPreviewModeChange: setPreviewMode,
  hintResetToken,
  onResetSyntaxHints,
  myThemeSlots = [],
  activeMyThemeSlotId = null,
  onSelectMyThemeSlot = () => {},
  onAddMyThemeSlot = () => {},
  onDeleteMyThemeSlot = () => {},
  onExportMyThemeSlot = () => {},
}: ApplyTabProps) {
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const [familyHintDismissed, setFamilyHintDismissed] = useState(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [textareaExpanded, setTextareaExpanded] = useState(false);
  const [activeDiagramIdx, setActiveDiagramIdx] = useState(0);
  const [familyOverride, setFamilyOverride] = useState<DiagramFamily | null>(null);

  const rendererProfile = useMemo(() => getRendererById(rendererTarget), [rendererTarget]);
  const rendererLookWarning = useMemo((): string | null => {
    if (!rendererProfile) return null;
    const support =
      rendererProfile.looksSupported[look as keyof typeof rendererProfile.looksSupported];
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

  const diagrams = useMemo(() => splitDiagrams(inputCode), [inputCode]);
  const isMultiDiagram = diagrams.length > 1;

  // Inline reset: calling setState during render causes React to discard this
  // render and immediately re-render with the corrected index — no async effect
  // cycle, no intermediate frame where a stale selector label is visible.
  if (activeDiagramIdx > 0 && activeDiagramIdx >= diagrams.length) {
    setActiveDiagramIdx(0);
  }

  const safeDiagramIdx = Math.min(activeDiagramIdx, diagrams.length - 1);
  const activeDiagramCode = diagrams[safeDiagramIdx]?.content ?? inputCode;

  // Reset the advisory banner whenever the user picks a different target renderer.
  useEffect(() => {
    setAdvisoryDismissed(false);
  }, [rendererTarget]);

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

  // Track whether the current family's syntax hint is dismissed so we can
  // offer a "Show tip" restore affordance. Re-evaluates when the family
  // changes or when the user resets dismissals (hintResetToken increment).
  useEffect(() => {
    const hint = getFamilySyntaxHint(effectiveDetection.family);
    if (!hint) {
      setFamilyHintDismissed(true);
      return;
    }
    setFamilyHintDismissed(isHintDismissed(effectiveDetection.family));
  }, [effectiveDetection.family, hintResetToken]);

  const exportAdvisories = useMemo((): string[] => {
    if (!inputCode.trim() || !rendererTarget) return [];
    const r = getRendererById(rendererTarget);
    if (!r) return [];

    const advisories: string[] = [];
    const hasCustomFont = selectedPalette.colors.some(
      (c) => c.key === "fontFamily" && c.value && c.value.trim() !== ""
    );
    const classDefActive = CLASSDEF_CAPABLE_FAMILIES.includes(effectiveDetection.family);

    if (r.initDirectiveSupport !== "full") {
      advisories.push(
        `%%{init}%% directive has partial support on ${r.shortName} — some theme colors may differ`
      );
    }
    if (r.themeVariableSupport !== "full") {
      advisories.push(
        `themeVariables partially applied on ${r.shortName} — only a subset of colors will take effect`
      );
    }
    if (classDefActive && r.classDefSupport !== "full") {
      advisories.push(
        `classDef node styles may render differently on ${r.shortName} — validate before publishing`
      );
    }
    if (hasCustomFont && r.customFontSupport === "none") {
      advisories.push(
        `Custom fontFamily is blocked on ${r.shortName} — system font fallback will apply`
      );
    }

    return advisories;
  }, [inputCode, selectedPalette, effectiveDetection.family, rendererTarget]);

  const isExtracted = isExtractedPaletteId(selectedPaletteId);

  const allPalettes = useMemo(
    () => [...BRAND_PALETTES, ...UTILITY_PALETTES, ...userPalettes],
    [userPalettes]
  );

  const exportOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: effectiveDetection.family,
      includeMetaComments,
      includeBadge,
      customThemeName: effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
      look,
      fontSize: fontSize || undefined,
      typography,
      rendererTarget,
    }),
    [
      selectedPalette,
      effectiveDetection.family,
      includeMetaComments,
      includeBadge,
      effectiveThemeName,
      look,
      fontSize,
      typography,
      rendererTarget,
    ]
  );

  const previewOptions = useMemo(
    (): ExportOptions => ({ ...exportOptions, includeBadge: false }),
    [exportOptions]
  );

  const themedCode = useMemo(
    () => (activeDiagramCode.trim() ? generateThemedCode(activeDiagramCode, previewOptions) : ""),
    [activeDiagramCode, previewOptions]
  );

  const exportCode = useMemo(
    () => (activeDiagramCode.trim() ? generateThemedCode(activeDiagramCode, exportOptions) : ""),
    [activeDiagramCode, exportOptions]
  );

  const { codeEditorOverride, setCodeEditorOverride, effectiveExportCode } = useCodeEditorOverride(
    exportCode,
    safeDiagramIdx
  );

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
        `Manual family override active — auto-detect saw "${detection.label}", you selected "${effectiveDetection.label}". Clear the override from the family chip to restore auto-detect.`
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

  const handleScaffoldCopy = useCallback(
    async (format: ScaffoldFormat) => {
      const text = generatePromptScaffoldWithFormat(selectedPalette, exportOptions, format);
      await writeToClipboard(text);
    },
    [selectedPalette, exportOptions]
  );

  const handleScaffoldPreview = useCallback(
    (format: ScaffoldFormat) =>
      generatePromptScaffoldWithFormat(selectedPalette, exportOptions, format),
    [selectedPalette, exportOptions]
  );

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      <PaletteSelectorBar
        allPalettes={allPalettes}
        selectedPaletteId={selectedPaletteId}
        customColors={customColors}
        onSelectPalette={onSelectPalette}
        tileIdPrefix="apply-palette-tile"
        myThemeSlots={myThemeSlots}
        activeMyThemeSlotId={activeMyThemeSlotId}
        onSelectMyThemeSlot={onSelectMyThemeSlot}
        onAddMyThemeSlot={onAddMyThemeSlot}
        onDeleteMyThemeSlot={onDeleteMyThemeSlot}
        onExportMyThemeSlot={onExportMyThemeSlot}
        onShowToast={onShowToast}
      />

      <DiagramDetectHeader
        detection={detection}
        effectiveDetection={effectiveDetection}
        familyOverride={familyOverride}
        onFamilyOverrideChange={setFamilyOverride}
        look={look}
        onLookChange={onLookChange}
        rendererTarget={rendererTarget}
        onRendererTargetChange={onRendererTargetChange}
        rendererProfile={rendererProfile}
        rendererLookWarning={rendererLookWarning}
        showSyntaxTipButton={
          familyHintDismissed && !!getFamilySyntaxHint(effectiveDetection.family)
        }
        onResetSyntaxHints={onResetSyntaxHints}
      />

      <RenderWarningSection
        exportAdvisories={exportAdvisories}
        advisoryDismissed={advisoryDismissed}
        onDismissAdvisory={() => setAdvisoryDismissed(true)}
        family={effectiveDetection.family}
        hintResetToken={hintResetToken}
        onFamilyHintDismiss={() => setFamilyHintDismissed(true)}
      />

      <div className="md:flex-1 md:overflow-hidden flex flex-col md:flex-row md:min-h-0">
        <div className="flex flex-col md:flex-none md:w-[35%] border-b md:border-b-0 md:border-r border-border md:min-h-0 print-hide">
          {isExtracted && /^\s*classDef\s+/m.test(inputCode) && (
            <div className="px-3 py-1.5 flex items-start gap-1.5 bg-primary/5 border-b border-primary/20">
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3 h-3 text-primary shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z" />
              </svg>
              <p className="text-[10px] text-primary/80 leading-snug">
                classDef overrides from Extract are in this code — edit them here or re-extract to
                tweak further.
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

        <div className="flex flex-col md:flex-none md:w-[65%] md:min-h-0 md:overflow-hidden">
          <DiagramPreviewPanel
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            codeEditorOverride={codeEditorOverride}
            onCodeEditorOverrideChange={setCodeEditorOverride}
            effectiveExportCode={effectiveExportCode}
            activeDiagramCode={activeDiagramCode}
            themedCode={themedCode}
            typography={typography}
            isMultiDiagram={isMultiDiagram}
            diagrams={diagrams}
            safeDiagramIdx={safeDiagramIdx}
            onActiveDiagramIdxChange={setActiveDiagramIdx}
          />
          <ExportToolbar
            warnings={warnings}
            showCapabilityNote={!!showCapabilityNote}
            capability={effectiveDetection.capability}
            hasCustomizations={hasCustomizations}
            onOpenColorEditor={() => setShowColorEditor(true)}
            inputCode={inputCode}
            exportCode={exportCode}
            effectiveExportCode={effectiveExportCode}
            selectedPalette={selectedPalette}
            exportOptions={exportOptions}
            effectiveThemeName={effectiveThemeName}
            themedCode={themedCode}
            typography={typography}
            allPalettes={allPalettes}
            rendererProfile={rendererProfile}
            promptIsThemeOnly={promptIsThemeOnly}
            onShowScaffoldModal={() => setShowScaffoldModal(true)}
            onShowToast={onShowToast}
          />
        </div>
      </div>

      {showColorEditor && (
        <ColorEditorPanel
          selectedPalette={selectedPalette}
          selectedPaletteId={selectedPaletteId}
          customColors={customColors}
          hasCustomizations={hasCustomizations}
          onColorChange={onColorChange}
          onResetPalette={onResetPalette}
          onResetColor={onResetColor}
          onClose={() => setShowColorEditor(false)}
          onSwitchToCompose={() => {
            setShowColorEditor(false);
            onSwitchTab("compose");
          }}
        />
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
