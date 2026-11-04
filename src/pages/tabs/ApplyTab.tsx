import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
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
  computeInitDirectiveLength,
  type ExportOptions,
  type ScaffoldFormat,
  type MermaidLook,
} from "@/lib/theme-engine";
import { checkInitDirectiveLength } from "@/lib/init-directive-length";
import { writeToClipboard } from "@/lib/clipboard";
import { PromptScaffoldModal } from "@/components/PromptScaffoldModal";
import { isExtractedPaletteId } from "@/lib/extractor";
import { getRendererById } from "@/data/renderer-parity";
import { getFamilySyntaxHint, isHintDismissed } from "@/lib/family-syntax-hints";
import { type TypographySettings } from "@/lib/typography";
import type { AppTab } from "@/App";
import type { MyThemeSlot } from "@/lib/my-theme-slots";
import type { GovernanceProfile } from "@/lib/governance-profile";
import { DiagramDetectHeader } from "./apply/DiagramDetectHeader";
import { PreflightPanel, buildPreflightReport } from "./apply/PreflightPanel";
import { DiagramPreviewPanel, type PreviewMode } from "./apply/DiagramPreviewPanel";
import { ExportToolbar } from "./apply/ExportToolbar";
import { ColorEditorPanel } from "./apply/ColorEditorPanel";

interface ApplyTabProps {
  completeTheme?: GovernanceProfile;
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
  customThemeName?: string;
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
  onNavigateToRendererExport?: (rendererId: string) => void;
  outputFormat?: "init-directive" | "frontmatter";
  onOutputFormatChange?: (format: "init-directive" | "frontmatter") => void;
  outputFormatOverridden?: boolean;
  onResetOutputFormat?: () => void;
  strokeWidth?: number;
  lastExampleType: Record<string, "flowchart" | "sequence">;
  onRecordExampleType: (id: string, type: "flowchart" | "sequence") => void;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  hintResetToken: number;
  settingsResetToken?: number;
  onResetSyntaxHints: () => void;
  myThemeSlots?: MyThemeSlot[];
  activeMyThemeSlotId?: string | null;
  onSelectMyThemeSlot?: (id: string) => void;
  onAddMyThemeSlot?: () => void;
  onDeleteMyThemeSlot?: (id: string) => void;
  onExportMyThemeSlot?: (id: string) => void;
  onDuplicateMyThemeSlot?: (id: string) => string | null | void;
  onRenameMyThemeSlot?: (id: string, newName: string) => void;
  onMoveMyThemeSlotUp?: (id: string) => void;
  onMoveMyThemeSlotDown?: (id: string) => void;
  onShowProfileDetails?: (id: string) => void;
  onImportThemeFile?: (json: string) => void;
  onImportAsNewSlot?: (
    palette: import("@/lib/palettes").Palette,
    warnings: {
      invalidValues: Array<{ key: string; value: string }>;
      warnValues: Array<{ key: string; value: string }>;
    }
  ) => void;
  advancedMermaidConfig?: import("@/lib/theme-engine").AdvancedMermaidConfig;
}

export function ApplyTab({
  completeTheme,
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
  customThemeName = "",
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
  onNavigateToRendererExport,
  outputFormat = "init-directive",
  onOutputFormatChange,
  outputFormatOverridden = false,
  onResetOutputFormat,
  strokeWidth,
  lastExampleType: _lastExampleType,
  onRecordExampleType: _onRecordExampleType,
  previewMode,
  onPreviewModeChange,
  hintResetToken,
  settingsResetToken = 0,
  onResetSyntaxHints,
  myThemeSlots = [],
  activeMyThemeSlotId = null,
  onSelectMyThemeSlot = () => {},
  onAddMyThemeSlot = () => {},
  onDeleteMyThemeSlot = () => {},
  onExportMyThemeSlot = () => {},
  onDuplicateMyThemeSlot,
  onRenameMyThemeSlot,
  onMoveMyThemeSlotUp,
  onMoveMyThemeSlotDown,
  onShowProfileDetails,
  onImportAsNewSlot,
  onImportThemeFile,
  advancedMermaidConfig = {},
}: ApplyTabProps) {
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const [familyHintDismissed, setFamilyHintDismissed] = useState(false);
  const [showScaffoldModal, setShowScaffoldModal] = useState(false);
  const [textareaExpanded, setTextareaExpanded] = useState(false);
  const [activeDiagramIdx, setActiveDiagramIdx] = useState(0);
  const [familyOverride, setFamilyOverride] = useState<DiagramFamily | null>(null);
  const [workspaceFocus, setWorkspaceFocus] = useState<"theme" | "preview" | "code">("preview");
  const guidanceRef = useRef<HTMLDivElement>(null);

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

  // Reset the advisory banner when the renderer target changes OR when the
  // detected diagram family changes — the new family may surface new advisories
  // that the user hasn't seen yet.
  useEffect(() => {
    setAdvisoryDismissed(false);
  }, [rendererTarget, effectiveDetection.family]);

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

  const directiveLengthAdvisory = useMemo((): string | null => {
    if (!inputCode.trim() || !rendererProfile) return null;

    const dirLength = computeInitDirectiveLength(
      selectedPalette,
      effectiveDetection.family,
      look,
      fontSize || undefined,
      typography,
      Object.keys(advancedMermaidConfig).length > 0 ? advancedMermaidConfig : undefined
    );
    const check = checkInitDirectiveLength(dirLength, rendererProfile);
    if (check.status !== "caution") return null;

    return `%%{init}%% directive (${check.directiveLength} chars) may exceed ${rendererProfile.shortName}'s ${check.ceiling}-char rendering limit — validate before publishing`;
  }, [
    inputCode,
    rendererProfile,
    selectedPalette,
    effectiveDetection.family,
    look,
    fontSize,
    typography,
    advancedMermaidConfig,
  ]);

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

    // Init-directive length advisory — only relevant when the output format is
    // "init-directive" (frontmatter has no length concern) and the renderer
    // has a measured numeric ceiling.  "unlimited" renderers are always safe;
    // "unverified" renderers get no advisory (no data to warn on).
    if (outputFormat === "init-directive" && directiveLengthAdvisory) {
      advisories.push(directiveLengthAdvisory);
    }

    return advisories;
  }, [
    inputCode,
    selectedPalette,
    effectiveDetection.family,
    rendererTarget,
    outputFormat,
    look,
    fontSize,
    typography,
    advancedMermaidConfig,
    directiveLengthAdvisory,
  ]);

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
      customThemeName:
        customThemeName.trim() || effectiveThemeName !== selectedPalette.name
          ? effectiveThemeName
          : undefined,
      look,
      fontSize: fontSize || undefined,
      typography,
      rendererTarget,
      outputFormat,
      strokeWidth,
      advancedMermaidConfig:
        Object.keys(advancedMermaidConfig).length > 0 ? advancedMermaidConfig : undefined,
    }),
    [
      selectedPalette,
      effectiveDetection.family,
      includeMetaComments,
      includeBadge,
      customThemeName,
      effectiveThemeName,
      look,
      fontSize,
      typography,
      rendererTarget,
      outputFormat,
      strokeWidth,
      advancedMermaidConfig,
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

  const compatibilityReport = buildPreflightReport({
    family: effectiveDetection.family,
    capability: effectiveDetection.capability,
    rendererProfile,
    look,
    selectedPalette,
    outputFormat,
  });
  const needsReview =
    warnings.length > 0 ||
    exportAdvisories.length > 0 ||
    !!rendererLookWarning ||
    compatibilityReport.hasIssues;
  const guidanceTitle = !inputCode.trim()
    ? "Add a diagram to preview"
    : needsReview
      ? "Review compatibility guidance"
      : "External renderer not validated";

  const reviewGuidance = () => {
    setWorkspaceFocus("code");
    setAdvisoryDismissed(false);
    requestAnimationFrame(() => guidanceRef.current?.focus());
  };

  return (
    <div className="theme-workbench" data-workspace-focus={workspaceFocus}>
      <header className="workspace-header">
        <div className="workspace-identity">
          <span className="workspace-eyebrow">Use your theme</span>
          <h2>{effectiveThemeName || selectedPalette.name}</h2>
          <p>One visual style. Every diagram you bring.</p>
        </div>
        <div className="workspace-actions">
          <button type="button" className="workspace-button" onClick={() => onSwitchTab("compose")}>
            Edit theme
          </button>
          <button
            type="button"
            className="workspace-button workspace-button-primary"
            disabled={!inputCode.trim()}
            onClick={async () => {
              try {
                await writeToClipboard(effectiveExportCode);
                onShowToast("Styled code copied.");
              } catch {
                onShowToast("Copy failed. Use Download to save the styled code.");
              }
            }}
          >
            Copy code
          </button>
        </div>
      </header>
      <div className="workspace-focus" role="group" aria-label="Workspace focus">
        {(["theme", "preview", "code"] as const).map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={workspaceFocus === view}
            aria-label={
              view === "theme"
                ? "Choose theme"
                : view === "preview"
                  ? "Show diagram preview"
                  : "Edit diagram code"
            }
            onClick={() => setWorkspaceFocus(view)}
          >
            {view === "theme" ? "Theme" : view === "preview" ? "Preview" : "Code"}
          </button>
        ))}
      </div>
      <div className="workspace-library">
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
          onDuplicateMyThemeSlot={onDuplicateMyThemeSlot}
          onRenameMyThemeSlot={onRenameMyThemeSlot}
          onMoveMyThemeSlotUp={onMoveMyThemeSlotUp}
          onMoveMyThemeSlotDown={onMoveMyThemeSlotDown}
          onImportAsNewSlot={onImportAsNewSlot}
          onImportThemeFile={onImportThemeFile}
          onShowToast={onShowToast}
          onShowProfileDetails={onShowProfileDetails}
        />
      </div>
      <div className="theme-workbench-content">
        <aside className="workspace-source" aria-label="Diagram source and compatibility">
          <div className="theme-workbench-code-row">
            <div className="theme-workbench-code-heading">
              <label htmlFor="apply-diagram-source">Diagram code</label>
              <button
                type="button"
                onClick={() => setTextareaExpanded((v) => !v)}
                className="workspace-text-button"
                aria-label={textareaExpanded ? "Collapse code editor" : "Expand code editor"}
              >
                {textareaExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
            {isExtracted && /^\s*classDef\s+/m.test(inputCode) && (
              <p className="workspace-note">
                Extracted classDef overrides remain in your source. Edit them here or extract again.
              </p>
            )}
            <textarea
              id="apply-diagram-source"
              value={inputCode}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Paste your Mermaid diagram here..."
              aria-label="Mermaid diagram code input"
              className={`forge-code-panel theme-workbench-textarea w-full p-3 text-sm font-mono resize-y ${textareaExpanded ? "min-h-[60vh]" : "min-h-[160px]"}`}
              spellCheck={false}
            />
          </div>
          <div ref={guidanceRef} tabIndex={-1} className="workspace-guidance">
            <h3 className="workspace-section-title">Destination & guidance</h3>
            <DiagramDetectHeader
              detection={detection}
              effectiveDetection={effectiveDetection}
              familyOverride={familyOverride}
              onFamilyOverrideChange={setFamilyOverride}
              look={look}
              onLookChange={onLookChange}
              rendererTarget={rendererTarget}
              onRendererTargetChange={onRendererTargetChange}
              onNavigateToRendererExport={onNavigateToRendererExport}
              rendererProfile={rendererProfile}
              rendererLookWarning={rendererLookWarning}
              showSyntaxTipButton={
                familyHintDismissed && !!getFamilySyntaxHint(effectiveDetection.family)
              }
              onResetSyntaxHints={onResetSyntaxHints}
            />
            <PreflightPanel
              inputWarnings={warnings}
              exportAdvisories={exportAdvisories}
              advisoryDismissed={advisoryDismissed}
              onDismissAdvisory={() => setAdvisoryDismissed(true)}
              capability={effectiveDetection.capability}
              family={effectiveDetection.family}
              hintResetToken={hintResetToken}
              onFamilyHintDismiss={() => setFamilyHintDismissed(true)}
              rendererProfile={rendererProfile}
              rendererLookWarning={rendererLookWarning}
              look={look}
              selectedPalette={selectedPalette}
              outputFormat={outputFormat}
              onOutputFormatChange={onOutputFormatChange}
              inputCode={inputCode}
            />
            <p className="workspace-note">
              Preview uses Mermaid locally. Check the exported result in your destination before
              publishing.
            </p>
          </div>
        </aside>
        <section className="theme-workbench-canvas" aria-label="Diagram preview">
          <div className="workspace-preview-caption">
            <span className="workspace-eyebrow">Preview</span>
            <span>
              {effectiveDetection.label} / {rendererProfile?.shortName || "Generic destination"}
            </span>
          </div>
          <div className="theme-workbench-preview">
            <DiagramPreviewPanel
              previewMode={previewMode}
              onPreviewModeChange={onPreviewModeChange}
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
          </div>
        </section>
      </div>
      <div className="workspace-status">
        <span>
          <strong>{guidanceTitle}</strong>
          {inputCode.trim() && <small>Local preview is not external validation.</small>}
        </span>
        <button type="button" className="workspace-text-button" onClick={reviewGuidance}>
          Review guidance
        </button>
      </div>
      <div className="theme-workbench-export">
        <ExportToolbar
          completeTheme={completeTheme}
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
          outputFormat={outputFormat}
          onOutputFormatChange={onOutputFormatChange}
          outputFormatOverridden={outputFormatOverridden}
          onResetOutputFormat={onResetOutputFormat}
          resetToken={settingsResetToken}
        />
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
        directiveLengthAdvisory={directiveLengthAdvisory}
      />
    </div>
  );
}
