import { useState, useMemo, useCallback } from "react";
import type { Palette } from "@/lib/palettes";
import { BRAND_PALETTES } from "@/lib/palettes";
import { generateThemedCode, type ExportOptions } from "@/lib/themeEngine";
import { detectDiagram } from "@/lib/detector";
import { MermaidPreview } from "@/components/MermaidPreview";
import { BRAND_EXAMPLES, SHOWCASE_EXAMPLE, SHOWCASE_META } from "@/data/examples";
import { EXAMPLE_GROUPS } from "@/data/example-library";

interface ExampleItem {
  id: string;
  label: string;
  content: string;
  badge?: string;
  section: string;
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

function buildExampleList(): ExampleItem[] {
  const items: ExampleItem[] = [];

  BRAND_PALETTES.forEach((p) => {
    const ex = BRAND_EXAMPLES[p.id];
    if (!ex) return;
    items.push({
      id: `brand-${p.id}-flow`,
      label: `${p.name} — Flowchart`,
      content: ex.flowchart,
      badge: "Brand",
      section: "OKHP3 Brand",
    });
    if (ex.sequence) {
      items.push({
        id: `brand-${p.id}-seq`,
        label: `${p.name} — Sequence`,
        content: ex.sequence,
        badge: "Brand",
        section: "OKHP3 Brand",
      });
    }
  });

  items.push({
    id: "showcase",
    label: SHOWCASE_META.title,
    content: SHOWCASE_EXAMPLE,
    badge: "Showcase",
    section: "Showcase",
  });

  EXAMPLE_GROUPS.forEach((group) => {
    group.entries.forEach((entry) => {
      items.push({
        id: entry.id,
        label: entry.label,
        content: entry.content,
        badge: entry.badge,
        section: group.label,
      });
    });
  });

  return items;
}

const ALL_EXAMPLES = buildExampleList();
const SECTIONS = Array.from(new Set(ALL_EXAMPLES.map((e) => e.section)));

interface ExamplesTabProps {
  selectedPalette: Palette;
  onLoadExample: (code: string) => void;
}

export function ExamplesTab({ selectedPalette, onLoadExample }: ExamplesTabProps) {
  const [selectedId, setSelectedId] = useState(ALL_EXAMPLES[0]?.id ?? "");
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const selectedExample = useMemo(
    () => ALL_EXAMPLES.find((e) => e.id === selectedId) ?? ALL_EXAMPLES[0],
    [selectedId],
  );

  const previewOptions = useMemo((): ExportOptions => {
    const detection = detectDiagram(selectedExample?.content ?? "");
    return {
      palette: selectedPalette,
      diagramFamily: detection.family,
      includeMetaComments: false,
      includeBadge: false,
    };
  }, [selectedPalette, selectedExample]);

  const themedPreviewCode = useMemo(
    () => (selectedExample ? generateThemedCode(selectedExample.content, previewOptions) : ""),
    [selectedExample, previewOptions],
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
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        <div
          className={`flex flex-col w-full md:w-64 border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 ${
            showMobilePreview ? "hidden md:flex" : "flex"
          }`}
        >
          {SECTIONS.map((section) => {
            const entries = ALL_EXAMPLES.filter((e) => e.section === section);
            return (
              <div key={section}>
                <div className="px-3 pt-3 pb-1.5 sticky top-0 bg-card/90 backdrop-blur z-10 border-b border-border/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section}
                  </p>
                </div>
                <ul className="px-1.5 py-1">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        onClick={() => {
                          setSelectedId(entry.id);
                          setShowMobilePreview(true);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-all flex items-start gap-2 ${
                          selectedId === entry.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="flex-1 leading-snug">{entry.label}</span>
                        {entry.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0 mt-0.5">
                            {entry.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
        </div>
      </div>

      <div className="flex-none border-t border-border bg-card/40 px-3 py-2.5 flex flex-wrap items-center gap-2">
        <button
          onClick={handleLoad}
          disabled={!selectedExample}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-primary/60 bg-primary/8 text-primary font-medium hover:bg-primary/12 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground/50 hidden sm:block">
          {ALL_EXAMPLES.length} examples · themed with {selectedPalette.name}
        </span>
      </div>
    </div>
  );
}
