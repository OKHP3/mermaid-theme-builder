import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { PaletteSelectorBar } from "@/components/PaletteSelectorBar";
import { generateThemedCode, type ExportOptions } from "@/lib/theme-engine";
import { detectDiagram } from "@/lib/detector";
import { MermaidPreview } from "@/components/MermaidPreview";
import { DiagramInventory } from "@/components/DiagramInventory";
import { SHOWCASE_META } from "@/data/examples";
import { type ExampleItem, ALL_EXAMPLES, SECTIONS, filterExamples } from "@/lib/examples-filter";
import type { MyThemeSlot } from "@/lib/my-theme-slots";
import { type ReactNode } from "react";
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_STYLES,
  THEME_CONFIDENCE_LABELS,
  THEME_CONFIDENCE_STYLES,
  NOTATION_COMPLIANCE_LABELS,
} from "@/data/mermaid-capabilities";

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

interface ExamplesTabProps {
  selectedPalette: Palette;
  selectedPaletteId: string;
  allPalettes: Palette[];
  customColors: Record<string, ThemeColor[]>;
  onSelectPalette: (id: string) => void;
  onLoadExample: (code: string) => void;
  initialSelectedId?: string;
  onExampleSelect?: (id: string) => void;
  myThemeSlots?: MyThemeSlot[];
  activeMyThemeSlotId?: string | null;
  onSelectMyThemeSlot?: (id: string) => void;
  onAddMyThemeSlot?: () => void;
  onDeleteMyThemeSlot?: (id: string) => void;
  onExportMyThemeSlot?: (id: string) => void;
  onShowToast?: (msg: ReactNode) => void;
}

export function ExamplesTab({
  selectedPalette,
  selectedPaletteId,
  allPalettes,
  customColors,
  onSelectPalette,
  onLoadExample,
  initialSelectedId,
  onExampleSelect,
  myThemeSlots = [],
  activeMyThemeSlotId = null,
  onSelectMyThemeSlot = () => {},
  onAddMyThemeSlot = () => {},
  onDeleteMyThemeSlot = () => {},
  onExportMyThemeSlot = () => {},
  onShowToast = () => {},
}: ExamplesTabProps) {
  const [selectedId, setSelectedId] = useState(() => {
    if (initialSelectedId && ALL_EXAMPLES.some((e) => e.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return ALL_EXAMPLES[0]?.id ?? "";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedRaw, setCopiedRaw] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  // Tracks which example ID still needs to be scrolled into view as part of
  // the initial restore. Set at mount (if an ID is already known) and updated
  // when the parent hydrates initialSelectedId after mount. Cleared to null
  // once the scroll has fired so user-driven selection changes are never
  // auto-scrolled (the user can see what they just clicked).
  const pendingScrollIdRef = useRef<string | null>(
    initialSelectedId && ALL_EXAMPLES.some((e) => e.id === initialSelectedId)
      ? initialSelectedId
      : null
  );

  // Sync with hydrated initialSelectedId that arrives after first render (e.g.,
  // when the app opens directly on the Examples tab and localStorage is read in
  // a useEffect in App.tsx after this component has already mounted).
  useEffect(() => {
    if (initialSelectedId && ALL_EXAMPLES.some((e) => e.id === initialSelectedId)) {
      setSelectedId(initialSelectedId);
      // Ensure the scroll target is updated to the final restored ID even if
      // it arrives after the initial render.
      pendingScrollIdRef.current = initialSelectedId;
    }
  }, [initialSelectedId]);

  // Once selectedId has caught up to the pending restore target, scroll that
  // item into view and clear the target so subsequent user clicks are unaffected.
  useEffect(() => {
    if (!pendingScrollIdRef.current) return;
    if (selectedId !== pendingScrollIdRef.current) return;
    if (!sidebarRef.current) return;
    const btn = sidebarRef.current.querySelector<HTMLElement>(
      `[data-example-id="${CSS.escape(selectedId)}"]`
    );
    if (btn) {
      btn.scrollIntoView({ block: "nearest" });
      pendingScrollIdRef.current = null;
    }
  }, [selectedId]);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // All sections collapsed on load; accordion — only one open at a time.
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set(SECTIONS));

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      if (prev.has(section)) {
        // Collapsed → expand this one; collapse all others
        return new Set(SECTIONS.filter((s) => s !== section));
      }
      // Expanded → collapse
      const next = new Set(prev);
      next.add(section);
      return next;
    });
  }, []);

  const filteredExamples = useMemo(() => filterExamples(ALL_EXAMPLES, searchQuery), [searchQuery]);

  const filteredSections = useMemo(() => {
    return SECTIONS.filter((section) => filteredExamples.some((e) => e.section === section));
  }, [filteredExamples]);

  const selectedExample = useMemo(
    () => ALL_EXAMPLES.find((e) => e.id === selectedId) ?? ALL_EXAMPLES[0],
    [selectedId]
  );

  // Auto-expand the section that contains the active selection; collapse all others (accordion).
  useEffect(() => {
    const section = ALL_EXAMPLES.find((e) => e.id === selectedId)?.section;
    if (section) {
      setCollapsedSections(new Set(SECTIONS.filter((s) => s !== section)));
    }
  }, [selectedId]);

  const detection = useMemo(() => detectDiagram(selectedExample?.content ?? ""), [selectedExample]);

  const previewOptions = useMemo(
    (): ExportOptions => ({
      palette: selectedPalette,
      diagramFamily: detection.family,
      includeMetaComments: false,
      includeBadge: false,
    }),
    [selectedPalette, detection]
  );

  const themedPreviewCode = useMemo(
    () => (selectedExample ? generateThemedCode(selectedExample.content, previewOptions) : ""),
    [selectedExample, previewOptions]
  );

  const handleLoad = useCallback(() => {
    if (selectedExample) {
      onLoadExample(selectedExample.content);
    }
  }, [selectedExample, onLoadExample]);

  const handleCopyRaw = useCallback(async () => {
    if (selectedExample) {
      await writeToClipboard(selectedExample.content);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  }, [selectedExample]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PaletteSelectorBar
        allPalettes={allPalettes}
        selectedPaletteId={selectedPaletteId}
        customColors={customColors}
        onSelectPalette={onSelectPalette}
        tileIdPrefix="examples-palette-tile"
        myThemeSlots={myThemeSlots}
        activeMyThemeSlotId={activeMyThemeSlotId}
        onSelectMyThemeSlot={onSelectMyThemeSlot}
        onAddMyThemeSlot={onAddMyThemeSlot}
        onDeleteMyThemeSlot={onDeleteMyThemeSlot}
        onExportMyThemeSlot={onExportMyThemeSlot}
        onShowToast={onShowToast}
      />
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        <div
          ref={sidebarRef}
          className={`flex flex-col w-full md:w-[35%] border-b md:border-b-0 md:border-r border-border overflow-y-auto overflow-x-hidden shrink-0 ${
            showMobilePreview ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-2 pt-2 pb-1 border-b border-border/50 bg-card/40 space-y-1.5">
            <button
              type="button"
              onClick={() => setShowInventory(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1 text-left font-medium">Browse all supported families</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-muted-foreground/60"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="relative">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                aria-label="Search examples"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, family, badge…"
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-6 h-6 text-muted-foreground/30"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-muted-foreground/60">
                No examples match{" "}
                <span className="font-medium text-muted-foreground">"{searchQuery}"</span>
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredSections.map((section) => {
              const entries = filteredExamples.filter((e) => e.section === section);
              const isCollapsed = !searchQuery && collapsedSections.has(section);
              return (
                <div key={section}>
                  <div className="sticky top-0 bg-card/90 backdrop-blur z-10 border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => toggleSection(section)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/40 transition-colors select-none"
                    >
                      <span className="text-xs font-medium text-foreground">{section}</span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                          isCollapsed ? "" : "rotate-180"
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  {!isCollapsed && (
                    <ul className="px-1.5 py-1">
                      {entries.map((entry) => (
                        <li key={entry.id}>
                          <button
                            data-example-id={entry.id}
                            onClick={() => {
                              setSelectedId(entry.id);
                              onExampleSelect?.(entry.id);
                              setShowMobilePreview(true);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-all flex items-start gap-2 ${
                              selectedId === entry.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <span className="flex-1 leading-snug">{entry.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div
          className={`flex-1 flex flex-col overflow-hidden min-h-[260px] md:min-h-0 ${
            showMobilePreview ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/20 flex-none">
            <div className="flex items-center gap-2 min-w-0">
              {showMobilePreview && (
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="md:hidden p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <span className="text-xs font-medium text-muted-foreground truncate">
                {selectedExample?.label ?? "Select an example"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground/60 shrink-0 ml-2">Themed preview</span>
          </div>
          {selectedExample && detection.capability && (
            <div className="flex-none border-b border-border bg-card/20 px-4 py-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold mr-1">
                {detection.label}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${SUPPORT_STATUS_STYLES[detection.capability.supportStatus]}`}
              >
                {SUPPORT_STATUS_LABELS[detection.capability.supportStatus]}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${THEME_CONFIDENCE_STYLES[detection.capability.themeConfidence]}`}
              >
                Theme: {THEME_CONFIDENCE_LABELS[detection.capability.themeConfidence]}
              </span>
              <span className="text-[10px] text-muted-foreground/80 px-1.5 py-0.5 rounded bg-muted/50 border border-border/50">
                {NOTATION_COMPLIANCE_LABELS[detection.capability.notationCompliance]}
              </span>
            </div>
          )}
          <div className="flex-1 overflow-auto p-4">
            {selectedExample ? (
              <MermaidPreview code={themedPreviewCode} className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select an example to preview
              </div>
            )}
          </div>
          {selectedExample?.id === "showcase" && (
            <div className="flex-none border-t border-border px-4 py-2 bg-amber-50/60 dark:bg-amber-950/20">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {SHOWCASE_META.warning}
              </p>
            </div>
          )}
          {selectedExample &&
            selectedExample.id !== "showcase" &&
            detection.capability?.warning && (
              <div className="flex-none border-t border-border px-4 py-2 bg-amber-50/60 dark:bg-amber-950/20">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  {detection.capability.warning}
                </p>
              </div>
            )}
          <div className="flex-none border-t border-border bg-card/40 px-3 py-2.5 flex items-center justify-end gap-2">
            <button
              onClick={handleLoad}
              disabled={!selectedExample}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-primary bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                  clipRule="evenodd"
                />
              </svg>
              Load into Apply Tab
            </button>
            <button
              onClick={handleCopyRaw}
              disabled={!selectedExample}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                copiedRaw
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {copiedRaw ? "Copied!" : "Copy Raw Code"}
            </button>
          </div>
        </div>
      </div>

      {showInventory && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInventory(false)}
          />
          <div className="fixed inset-x-0 bottom-0 top-12 md:top-16 z-50 bg-card border-t border-border shadow-2xl flex flex-col rounded-t-xl md:mx-8 md:rounded-xl">
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  Diagram Family Inventory
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Full Mermaid capability registry — support, theme confidence, notation compliance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInventory(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close inventory"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DiagramInventory embedded />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
