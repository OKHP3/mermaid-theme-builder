import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { getClassDefs } from "@/lib/theme-engine";
import { extractUsedClasses, applyClassFix } from "@/lib/used-classes";
import { DiagramInventory } from "@/components/DiagramInventory";
import { ClassBrowser } from "@/components/ClassBrowser";
import { RENDERER_PROFILES, supportLabel, supportColor } from "@/data/renderer-parity";
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
  onImportMyThemeSlot?: (id: string, json: string) => void;
}

const TAXONOMY_DOCS_URL =
  "https://github.com/OKHP3/mermaid-theme-builder/blob/main/docs/visual-language-diagram-taxonomy.md";
const GITHUB_REPO_URL = "https://github.com/OKHP3/mermaid-theme-builder";

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
  onImportMyThemeSlot,
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

  // Tracks whether the Renderer Parity Matrix <details> is currently open so
  // the inactive badge can hide itself when the user manually expands the section.
  const [rendererParityOpen, setRendererParityOpen] = useState(false);

  // Tracks whether the Class Library <details> is currently open so the
  // inactive badge can hide itself when the user manually expands the section.
  const [classLibraryOpen, setClassLibraryOpen] = useState(false);

  useEffect(() => {
    const el = rendererParityRef.current;
    if (!el) return;
    const nextOpen = supportsClassDef;
    el.open = nextOpen;
    setRendererParityOpen(nextOpen);
  }, [supportsClassDef]);

  useEffect(() => {
    const el = classLibraryRef.current;
    if (!el) return;
    const nextOpen = supportsClassDef;
    el.open = nextOpen;
    setClassLibraryOpen(nextOpen);
  }, [supportsClassDef]);

  // When navigated here via the beta hint "See support details →" link, force-open
  // the Renderer Parity Matrix section and scroll it into view.
  useEffect(() => {
    if (!openParityMatrix) return;
    const el = rendererParityRef.current;
    if (!el) return;
    el.open = true;
    setRendererParityOpen(true);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    onParityMatrixOpened?.();
  }, [openParityMatrix, onParityMatrixOpened]);

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
        onImportMyThemeSlot={onImportMyThemeSlot}
      />
      <div className="flex-1 overflow-hidden">
        <DiagramInventory embedded />
      </div>

      <div className="flex-none border-t border-border">
        <details
          ref={rendererParityRef}
          className="group"
          onToggle={(e) => setRendererParityOpen((e.currentTarget as HTMLDetailsElement).open)}
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
          </summary>
          <div className="border-t border-border overflow-x-auto max-h-72 overflow-y-auto">
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
                fonts = custom fontFamily. Data reflects research as of Mermaid 11.15.0 — validate
                in your target environment.
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
      </div>

      <div className="flex-none border-t border-border">
        <details
          ref={classLibraryRef}
          className="group"
          onToggle={(e) => setClassLibraryOpen((e.currentTarget as HTMLDetailsElement).open)}
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
          </summary>
          <div className="border-t border-border max-h-72 overflow-y-auto">
            <ClassBrowser
              classDefs={classDefs}
              supportsClassDef={supportsClassDef}
              usedClassNames={usedClassNames}
              onApplyFix={onInputChange ? handleApplyFix : undefined}
            />
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
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
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
        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
          v{__APP_VERSION__}
        </span>
      </div>
    </div>
  );
}
