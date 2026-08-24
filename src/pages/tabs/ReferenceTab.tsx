import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { getClassDefs } from "@/lib/theme-engine";
import { extractUsedClasses, applyClassFix } from "@/lib/used-classes";
import { DiagramInventory } from "@/components/DiagramInventory";
import { ClassBrowser } from "@/components/ClassBrowser";
import { RENDERER_PROFILES, supportLabel, supportColor } from "@/data/renderer-parity";
import { PUBLIC_MERMAID_SKILLS, SKILL_ROLE_META } from "@/data/skills-catalog";
import type { MyThemeSlot } from "@/lib/my-theme-slots";

interface ReferenceTabProps {
  selectedPalette: Palette;
  selectedPaletteId: string;
  allPalettes: Palette[];
  customColors: Record<string, ThemeColor[]>;
  onSelectPalette: (id: string) => void;
  supportsClassDef: boolean;
  inputCode?: string;
  /** When provided, the unrecognized-class "Fix" buttons become active and
   *  call this with the corrected diagram source. */
  onInputChange?: (code: string) => void;
  openParityMatrix?: boolean;
  onParityMatrixOpened?: () => void;
  myThemeSlots?: MyThemeSlot[];
  activeMyThemeSlotId?: string | null;
  onSelectMyThemeSlot?: (id: string) => void;
  onAddMyThemeSlot?: () => void;
  onDeleteMyThemeSlot?: (id: string) => void;
  onExportMyThemeSlot?: (id: string) => void;
  onDuplicateMyThemeSlot?: (id: string) => void;
  onMoveMyThemeSlotUp?: (id: string) => void;
  onMoveMyThemeSlotDown?: (id: string) => void;
  onShowProfileDetails?: (id: string) => void;
  onImportAsNewSlot?: (
    palette: import("@/lib/palettes").Palette,
    warnings: {
      invalidValues: Array<{ key: string; value: string }>;
      warnValues: Array<{ key: string; value: string }>;
    }
  ) => void;
  onShowToast?: (msg: ReactNode) => void;
  /** Currently selected renderer target id (e.g. "github", "obsidian"). */
  rendererTarget?: string;
  /** User's current output format preference. */
  outputFormat?: "init-directive" | "frontmatter";
  /**
   * Copy the themed export code, formatted correctly for the given renderer, to
   * the clipboard.  The callback handles format selection and toast notification.
   */
  onCopyForRenderer?: (rendererId: string) => Promise<void>;
  /**
   * Copy the active profile's share URL to the clipboard.  Provided only when
   * an active slot exists so the button can be conditionally disabled/hidden.
   */
  onCopyShareLink?: () => Promise<void>;
}

const TAXONOMY_DOCS_URL =
  "https://github.com/OKHP3/mermaid-theme-builder/blob/main/docs/visual-language-diagram-taxonomy.md";
const GITHUB_REPO_URL = "https://github.com/OKHP3/mermaid-theme-builder";
const SKILLS_FAMILY_URL = "https://github.com/OKHP3/mermaid-theme-builder/tree/main/skills";

const LOOK_COLS = [
  { key: "classic" as const, label: "Classic" },
  { key: "neo" as const, label: "Neo" },
  { key: "handDrawn" as const, label: "Hand-Drawn" },
];

const CAPABILITY_COLS: {
  key:
    | "initDirectiveSupport"
    | "themeVariableSupport"
    | "classDefSupport"
    | "cssInjectionSupport"
    | "customFontSupport";
  label: string;
  abbrev: string;
}[] = [
  { key: "initDirectiveSupport", label: "%%{init}%% directive", abbrev: "init" },
  { key: "themeVariableSupport", label: "themeVariables", abbrev: "themeVars" },
  { key: "classDefSupport", label: "classDef styling", abbrev: "classDef" },
  { key: "cssInjectionSupport", label: "CSS injection", abbrev: "CSS" },
  { key: "customFontSupport", label: "Custom fonts", abbrev: "fonts" },
];

function SupportBadge({ support }: { support: import("@/data/renderer-parity").RendererSupport }) {
  return (
    <span
      className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${supportColor(support)}`}
    >
      {supportLabel(support)}
    </span>
  );
}

/** Small icon — external link arrow */
function ExternalLinkIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}

/** Small copy-to-clipboard icon */
function CopyIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
    </svg>
  );
}

/** Small checkmark icon for "Copied!" feedback */
function CheckIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Chevron down (rotates 180° via group-open in parent) */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ReferenceTab({
  selectedPalette,
  selectedPaletteId,
  allPalettes,
  customColors,
  onSelectPalette,
  supportsClassDef,
  inputCode = "",
  onInputChange,
  openParityMatrix = false,
  onParityMatrixOpened,
  myThemeSlots = [],
  activeMyThemeSlotId = null,
  onSelectMyThemeSlot = () => {},
  onAddMyThemeSlot = () => {},
  onDeleteMyThemeSlot = () => {},
  onExportMyThemeSlot = () => {},
  onDuplicateMyThemeSlot,
  onMoveMyThemeSlotUp,
  onMoveMyThemeSlotDown,
  onShowProfileDetails,
  onImportAsNewSlot,
  onShowToast = () => {},
  rendererTarget = "",
  outputFormat = "init-directive",
  onCopyForRenderer,
  onCopyShareLink,
}: ReferenceTabProps) {
  const classDefs = useMemo(() => getClassDefs(selectedPalette), [selectedPalette]);

  const usedClassNames = useMemo<ReadonlySet<string>>(
    () => extractUsedClasses(inputCode),
    [inputCode]
  );

  // Replace every whole-token occurrence of :::typo with :::suggestion.
  // Uses applyClassFix which applies a word-boundary regex so that a shorter
  // typo (e.g. :::prim) never corrupts a longer valid token (e.g. :::primary).
  const handleApplyFix = useCallback(
    (typo: string, suggestion: string) => {
      if (!onInputChange) return;
      onInputChange(applyClassFix(inputCode, typo, suggestion));
    },
    [inputCode, onInputChange]
  );

  const rendererParityRef = useRef<HTMLDetailsElement>(null);
  const classLibraryRef = useRef<HTMLDetailsElement>(null);

  // Single accordion state — only one section open at a time; all collapsed on load.
  const [openRefSection, setOpenRefSection] = useState<string | null>(null);
  const classLibraryOpen = openRefSection === "classLibrary";
  const rendererParityOpen = openRefSection === "rendererParity";

  const handleRefSectionToggle = useCallback((name: string, nowOpen: boolean) => {
    if (nowOpen) {
      if (name !== "classLibrary" && classLibraryRef.current) classLibraryRef.current.open = false;
      if (name !== "rendererParity" && rendererParityRef.current)
        rendererParityRef.current.open = false;
      setOpenRefSection(name);
    } else {
      setOpenRefSection((prev) => (prev === name ? null : prev));
    }
  }, []);

  // When navigated here via the beta hint "See support details →" link, force-open
  // the Renderer Parity Matrix section via accordion and scroll it into view.
  useEffect(() => {
    if (!openParityMatrix) return;
    if (classLibraryRef.current) classLibraryRef.current.open = false;
    setOpenRefSection("rendererParity");
    const el = rendererParityRef.current;
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    onParityMatrixOpened?.();
  }, [openParityMatrix, onParityMatrixOpened]);

  // ── Distribution section copy state ────────────────────────────────────────
  // Track which renderer's copy button was last clicked so we can flash
  // "Copied!" feedback briefly.
  const [copiedForRenderer, setCopiedForRenderer] = useState<string | null>(null);
  const [shareLinked, setShareLinked] = useState(false);

  const handleDistributeCopy = useCallback(
    async (rendererId: string) => {
      if (!onCopyForRenderer) return;
      await onCopyForRenderer(rendererId);
      setCopiedForRenderer(rendererId);
      // Clear after a short delay; guard against fast double-clicks on other
      // buttons by comparing the id before clearing.
      setTimeout(() => setCopiedForRenderer((prev) => (prev === rendererId ? null : prev)), 1800);
    },
    [onCopyForRenderer]
  );

  const handleClickShareLink = useCallback(async () => {
    if (!onCopyShareLink) return;
    await onCopyShareLink();
    setShareLinked(true);
    setTimeout(() => setShareLinked(false), 1800);
  }, [onCopyShareLink]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PaletteSelectorBar
        allPalettes={allPalettes}
        selectedPaletteId={selectedPaletteId}
        customColors={customColors}
        onSelectPalette={onSelectPalette}
        tileIdPrefix="reference-palette-tile"
        myThemeSlots={myThemeSlots}
        activeMyThemeSlotId={activeMyThemeSlotId}
        onSelectMyThemeSlot={onSelectMyThemeSlot}
        onAddMyThemeSlot={onAddMyThemeSlot}
        onDeleteMyThemeSlot={onDeleteMyThemeSlot}
        onExportMyThemeSlot={onExportMyThemeSlot}
        onDuplicateMyThemeSlot={onDuplicateMyThemeSlot}
        onMoveMyThemeSlotUp={onMoveMyThemeSlotUp}
        onMoveMyThemeSlotDown={onMoveMyThemeSlotDown}
        onImportAsNewSlot={onImportAsNewSlot}
        onShowToast={onShowToast}
        onShowProfileDetails={onShowProfileDetails}
      />
      <div className="flex-1 overflow-y-auto">
        <details
          ref={classLibraryRef}
          className="group border-b border-border"
          onToggle={(e) =>
            handleRefSectionToggle("classLibrary", (e.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-muted-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium text-foreground">Class Library</span>
              {!supportsClassDef && !classLibraryOpen && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  inactive for this diagram type
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {classDefs.length} classes · {selectedPalette.name}
              </span>
            </div>
            <ChevronIcon />
          </summary>
          <div className="border-t border-border">
            <ClassBrowser
              classDefs={classDefs}
              supportsClassDef={supportsClassDef}
              usedClassNames={usedClassNames}
              onApplyFix={onInputChange ? handleApplyFix : undefined}
            />
          </div>
        </details>

        <details
          ref={rendererParityRef}
          className="group border-b border-border"
          onToggle={(e) =>
            handleRefSectionToggle("rendererParity", (e.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-muted-foreground"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h3a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
              <span className="text-xs font-medium text-foreground">Renderer Parity Matrix</span>
              {!supportsClassDef && !rendererParityOpen && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  inactive for this diagram type
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {RENDERER_PROFILES.length} renderers · look + theming support
              </span>
            </div>
            <ChevronIcon />
          </summary>
          <div className="border-t border-border overflow-x-auto">
            <table className="w-full text-[10px] border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-muted/40 sticky top-0 z-10">
                  <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                    Renderer
                  </th>
                  {LOOK_COLS.map((c) => (
                    <th
                      key={c.key}
                      className="text-center px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="w-px bg-border/40 border-b border-border" aria-hidden="true" />
                  {CAPABILITY_COLS.map((c) => (
                    <th
                      key={c.key}
                      className="text-center px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap"
                      title={c.label}
                    >
                      {c.abbrev}
                    </th>
                  ))}
                  <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                    Version
                  </th>
                </tr>
              </thead>
              <tbody>
                {RENDERER_PROFILES.map((renderer, i) => (
                  <tr
                    key={renderer.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground whitespace-nowrap">
                      <a
                        href={renderer.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-primary transition-colors"
                        title={renderer.notes}
                      >
                        {renderer.shortName}
                      </a>
                      {renderer.caveats.length > 0 && (
                        <span
                          className="ml-1 text-muted-foreground/50"
                          title={renderer.caveats.join("\n")}
                        >
                          *
                        </span>
                      )}
                    </td>
                    {LOOK_COLS.map((c) => (
                      <td key={c.key} className="px-2 py-1.5 text-center">
                        <SupportBadge support={renderer.looksSupported[c.key]} />
                      </td>
                    ))}
                    <td className="w-px bg-border/20" aria-hidden="true" />
                    {CAPABILITY_COLS.map((c) => (
                      <td key={c.key} className="px-2 py-1.5 text-center">
                        <SupportBadge support={renderer[c.key]} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                      {renderer.mermaidVersionApprox}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 flex flex-wrap gap-x-4 gap-y-0.5">
              <p className="text-[9px] text-muted-foreground/50 w-full">
                * Hover renderer name for notes. Caveats marked with asterisk. Looks: Classic / Neo
                / Hand-Drawn. Capabilities: init = %%{"{"}init{"}"}%% directives, themeVars =
                themeVariables, classDef = inline node styling, CSS = external stylesheet injection,
                fonts = custom fontFamily. Data reflects research as of Mermaid 11.16.0. Validate in
                your target environment.
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {RENDERER_PROFILES.map((r) => (
                  <a
                    key={r.id}
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    title={`Source: ${r.sourceUrl}`}
                  >
                    {r.shortName} docs ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </details>

        {/* ── Use in… Distribution Center ──────────────────────────────────── */}
        <details
          className="group border-b border-border"
          open={openRefSection === "distribute"}
          onToggle={(e) =>
            handleRefSectionToggle("distribute", (e.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2 flex-wrap">
              {/* share / export icon */}
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-muted-foreground shrink-0"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              <span className="text-xs font-medium text-foreground">Use in…</span>
              <span className="text-[10px] text-muted-foreground">
                {RENDERER_PROFILES.length} destinations · copy formatted export code
              </span>
              {rendererTarget && openRefSection !== "distribute" && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {RENDERER_PROFILES.find((r) => r.id === rendererTarget)?.shortName ??
                    rendererTarget}
                </span>
              )}
            </div>
            <ChevronIcon />
          </summary>

          <div className="border-t border-border">
            {/* ── Profile share link shortcut ─────────────────────────────── */}
            <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-border bg-muted/20">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">Share this profile</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  Encode the full theme (palette, renderer, format) in a URL.
                  <br />
                  Anyone with the link can import it in one click.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClickShareLink}
                disabled={!onCopyShareLink}
                aria-label="Copy profile share link to clipboard"
                className={`shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded border transition-colors ${
                  shareLinked
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : onCopyShareLink
                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                }`}
              >
                {shareLinked ? (
                  <>
                    <CheckIcon className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Copy link
                  </>
                )}
              </button>
            </div>

            {/* ── Destination cards ───────────────────────────────────────── */}
            <div className="divide-y divide-border/50">
              {RENDERER_PROFILES.map((renderer) => {
                const isSelected = renderer.id === rendererTarget;
                const isCopied = copiedForRenderer === renderer.id;
                // Partial-support renderers: always use init-directive (safer).
                // Full-support renderers: respect the user's current setting.
                const recFormat: "init-directive" | "frontmatter" =
                  renderer.initDirectiveSupport === "partial" ? "init-directive" : outputFormat;
                const recFormatLabel =
                  recFormat === "frontmatter" ? "YAML frontmatter" : "%%{init}%%";
                const isPartial = renderer.initDirectiveSupport === "partial";

                return (
                  <div
                    key={renderer.id}
                    className={`px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Selected-renderer indicator dot */}
                    <div className="w-2 shrink-0 flex justify-center">
                      {isSelected && (
                        <span
                          className="block w-1.5 h-1.5 rounded-full bg-primary"
                          aria-label="Currently selected renderer"
                        />
                      )}
                    </div>

                    {/* Destination info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <a
                          href={renderer.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`text-xs font-medium transition-colors hover:text-primary ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {renderer.shortName}
                        </a>
                        <SupportBadge support={renderer.initDirectiveSupport} />
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {recFormatLabel}
                        </span>
                      </div>
                      {isPartial && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                          %%{"{init}"}%% preferred — partial theme variable support
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onCopyForRenderer && (
                        <button
                          type="button"
                          onClick={() => handleDistributeCopy(renderer.id)}
                          aria-label={`Copy ${recFormatLabel} code for ${renderer.shortName}`}
                          title={`Copy themed diagram code formatted for ${renderer.displayName}`}
                          className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border transition-colors ${
                            isCopied
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/50"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <CheckIcon />
                              Copied
                            </>
                          ) : (
                            <>
                              <CopyIcon />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={renderer.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${renderer.shortName} Mermaid documentation`}
                        title={`Mermaid documentation for ${renderer.displayName}`}
                        className="text-muted-foreground/40 hover:text-primary transition-colors"
                      >
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="px-4 py-2 text-[9px] text-muted-foreground/40 border-t border-border/50">
              Copy buttons produce the themed export code (%%{"{init}"}%% directive or YAML
              frontmatter + diagram source) ready to paste into the target platform. Format
              selection follows your current Output Format setting, except for renderers with
              partial support where %%{"{init}"}%% is always used.
            </p>
          </div>
        </details>

        <div className="border-b border-border">
          <DiagramInventory
            embedded
            open={openRefSection === "inventory"}
            onToggle={() => handleRefSectionToggle("inventory", openRefSection !== "inventory")}
          />
        </div>

        {/* ── Agent Skills ──────────────────────────────────────────────── */}
        <details
          className="group border-b border-border"
          open={openRefSection === "skills"}
          onToggle={(e) =>
            handleRefSectionToggle("skills", (e.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2">
              {/* puzzle-piece / skills icon */}
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-muted-foreground"
              >
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
              <span className="text-xs font-medium text-foreground">Mermaid Agent Skills</span>
              <span className="text-[10px] text-muted-foreground">
                {PUBLIC_MERMAID_SKILLS.length} skills · publicly installable
              </span>
            </div>
            <ChevronIcon />
          </summary>

          <div className="border-t border-border divide-y divide-border/50">
            <p className="px-4 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
              These Agent Skills are open-source and installable in any AI client that supports the
              Skills format.{" "}
              <a
                href={SKILLS_FAMILY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Browse all on GitHub ↗
              </a>
            </p>

            {PUBLIC_MERMAID_SKILLS.map((skill) => {
              const meta = SKILL_ROLE_META[skill.role];
              return (
                <div
                  key={skill.name}
                  className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-medium text-foreground">
                        {skill.displayName}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        v{skill.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                  <a
                    href={skill.githubUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`View ${skill.displayName} skill on GitHub`}
                    className="shrink-0 mt-0.5 text-muted-foreground/50 hover:text-primary transition-colors"
                    title="View SKILL.md on GitHub"
                  >
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      <div className="flex-none border-t border-border bg-card/40 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="forge-eyebrow">Further reading</span>
        <a
          href={TAXONOMY_DOCS_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ExternalLinkIcon className="w-3 h-3" />
          Visual Language Diagram Taxonomy
        </a>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          GitHub repository
        </a>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          v{__APP_VERSION__}
        </span>
      </div>
    </div>
  );
}
