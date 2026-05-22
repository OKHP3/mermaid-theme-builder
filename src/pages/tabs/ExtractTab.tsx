import { useState, useCallback, useMemo } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { ColorSwatch } from "@/components/ColorSwatch";
import { DiffView } from "@/components/DiffView";
import { MermaidPreview } from "@/components/MermaidPreview";
import {
  extractTheme,
  paletteFromExtracted,
  makeExtractedPaletteId,
  type ExtractedTheme,
  type ExtractedClassDef,
} from "@/lib/extractor";
import { generateThemedCode } from "@/lib/themeEngine";
import { detectDiagram } from "@/lib/detector";
import type { AppTab } from "@/App";

const PALETTE_KEY_ORDER = [
  "primaryColor",
  "primaryTextColor",
  "primaryBorderColor",
  "lineColor",
  "secondaryColor",
  "tertiaryColor",
  "background",
  "mainBkg",
  "nodeBorder",
  "clusterBkg",
  "titleColor",
  "edgeLabelBackground",
  "fontFamily",
];

const KEY_LABELS: Record<string, string> = {
  primaryColor: "Primary (nodes)",
  primaryTextColor: "Primary text",
  primaryBorderColor: "Primary border",
  lineColor: "Lines & arrows",
  secondaryColor: "Secondary nodes",
  tertiaryColor: "Tertiary nodes",
  background: "Background",
  mainBkg: "Main background",
  nodeBorder: "Node border",
  clusterBkg: "Cluster background",
  titleColor: "Title color",
  edgeLabelBackground: "Edge label bg",
  fontFamily: "Font family",
};

function labelForKey(key: string): string {
  return KEY_LABELS[key] ?? key;
}

interface ExtractTabProps {
  onUseExtractedTheme: (palette: Palette) => void;
  onSwitchTab: (tab: AppTab) => void;
  onShowToast: (msg: string) => void;
}

type ExtractStatus = "idle" | "found" | "empty" | "no-vars";

export function ExtractTab({ onUseExtractedTheme, onSwitchTab, onShowToast }: ExtractTabProps) {
  const [pastedCode, setPastedCode] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTheme | null>(null);
  const [editedVars, setEditedVars] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ExtractStatus>("idle");
  const [previewMode, setPreviewMode] = useState<"preview" | "diff">("preview");
  const [themeName, setThemeName] = useState("Extracted theme");

  const handleExtract = useCallback(() => {
    const code = pastedCode.trim();
    if (!code) return;

    const result = extractTheme(code);
    const hasVars = Object.keys(result.themeVariables).length > 0;
    const hasDefs = result.classDefs.length > 0;

    if (!hasVars && !hasDefs && result.sourceFormat === "none") {
      setExtracted(null);
      setEditedVars({});
      setStatus("empty");
      return;
    }

    if (!hasVars && result.sourceFormat !== "none") {
      setExtracted(result);
      setEditedVars({});
      setStatus("no-vars");
      return;
    }

    setExtracted(result);
    setEditedVars({ ...result.themeVariables });
    setStatus("found");
  }, [pastedCode]);

  const handleVarChange = useCallback((key: string, value: string) => {
    setEditedVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  const effectivePalette = useMemo((): Palette | null => {
    if (!extracted || status !== "found") return null;
    const id = makeExtractedPaletteId();
    const name = themeName.trim() || "Extracted theme";

    const keys = [
      ...PALETTE_KEY_ORDER.filter((k) => k in editedVars),
      ...Object.keys(editedVars).filter((k) => !PALETTE_KEY_ORDER.includes(k)),
    ];
    const colors: ThemeColor[] = keys.map((key) => ({
      key,
      label: labelForKey(key),
      value: editedVars[key],
    }));

    return {
      id,
      name,
      description: "Theme extracted from a pasted diagram. Edit colors below, then click Use Theme to apply.",
      version: "0.0.0",
      colors,
      attribution: {
        enabledByDefault: true,
        label: `Themed with Mermaid Theme Builder · ${name}`,
        url: "https://overkillhill.com/projects/mermaid-theme-builder/",
        themeName: name,
        toolName: "Mermaid Theme Builder",
        toolVersion: "0.5.0",
      },
    };
  }, [extracted, status, editedVars, themeName]);

  const rethemedCode = useMemo(() => {
    if (!effectivePalette || !pastedCode.trim()) return "";
    const detection = detectDiagram(pastedCode);
    return generateThemedCode(pastedCode, {
      palette: effectivePalette,
      diagramFamily: detection.family,
      includeMetaComments: false,
      includeBadge: false,
    });
  }, [effectivePalette, pastedCode]);

  const handleUseTheme = useCallback(() => {
    if (!effectivePalette) return;
    const name = themeName.trim() || "Extracted theme";
    const finalPalette: Palette = { ...effectivePalette, name };
    onUseExtractedTheme(finalPalette);
    onShowToast(`Loaded "${name}" — edit colors in the Apply or Compose tab`);
    onSwitchTab("apply");
  }, [effectivePalette, themeName, onUseExtractedTheme, onShowToast, onSwitchTab]);

  const handleClearAll = useCallback(() => {
    setPastedCode("");
    setExtracted(null);
    setEditedVars({});
    setStatus("idle");
    setThemeName("Extracted theme");
    setPreviewMode("preview");
  }, []);

  const sourceLabel =
    extracted?.sourceFormat === "frontmatter"
      ? "YAML frontmatter"
      : extracted?.sourceFormat === "init-directive"
      ? "%%{init}%% directive"
      : null;

  const orderedVarKeys = useMemo(() => {
    const known = PALETTE_KEY_ORDER.filter((k) => k in editedVars);
    const extra = Object.keys(editedVars).filter((k) => !PALETTE_KEY_ORDER.includes(k));
    return [...known, ...extra];
  }, [editedVars]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <p className="forge-eyebrow mb-1">Extract mode</p>
          <h2 className="text-base font-semibold text-foreground leading-snug">
            Reverse-engineer a themed diagram
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Paste a Mermaid diagram that already has a theme applied. The tool reads the
            <code className="mx-1 px-1 py-0.5 rounded bg-muted font-mono text-[10px]">{"%%{init}%%"}</code>
            directive or YAML frontmatter, extracts every theme variable and classDef color into
            editable swatches, then lets you load the result into Apply mode.
          </p>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <label className="forge-eyebrow" htmlFor="extract-paste-area">
            Paste your themed diagram
          </label>
          <textarea
            id="extract-paste-area"
            value={pastedCode}
            onChange={(e) => {
              setPastedCode(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder={`%%{init: {'theme':'base','themeVariables':{'primaryColor':'#4a90d9','lineColor':'#333'}}}%%\nflowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]`}
            rows={8}
            className="w-full text-xs font-mono bg-[#0f1f1c] text-[#d4c9b5] border border-border rounded-md px-3 py-2.5 resize-y focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-[#d4c9b5]/30"
            spellCheck={false}
            aria-label="Paste themed Mermaid diagram here"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExtract}
              disabled={!pastedCode.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Extract theme
            </button>
            {pastedCode.trim() && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Empty state messages */}
        {status === "idle" && !extracted && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.8 1.8m0 0l-1.8 1.8M19.8 15l1.8 1.8m-1.8-1.8l-1.8-1.8M9.75 17.25a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z"
              />
            </svg>
            <p className="text-sm text-muted-foreground font-medium">Paste a themed diagram above, then click Extract theme</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Works with <code className="font-mono">{"%%{init}%%"}</code> directives and YAML frontmatter
            </p>
          </div>
        )}

        {status === "empty" && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-4 flex items-start gap-3">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No theme detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The pasted diagram contains no <code className="font-mono">{"%%{init}%%"}</code> directive,
                YAML frontmatter, or <code className="font-mono">classDef</code> rules. Try pasting a diagram
                that has already been themed by this tool or another Mermaid theming workflow.
              </p>
            </div>
          </div>
        )}

        {status === "no-vars" && extracted && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-4 flex items-start gap-3">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Theme directive found, but no themeVariables block
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A {sourceLabel} was detected
                  {extracted.themeName ? ` (theme: ${extracted.themeName})` : ""}, but it contains no
                  color or font themeVariables to extract.
                  {extracted.classDefs.length > 0
                    ? " ClassDef colors were detected — see below."
                    : " Try pasting a diagram with an explicit themeVariables block."}
                </p>
              </div>
            </div>
            {extracted.classDefs.length > 0 && (
              <ClassDefList classDefs={extracted.classDefs} />
            )}
          </div>
        )}

        {/* Main results panel */}
        {status === "found" && extracted && (
          <div className="space-y-6">
            {/* Source badge + summary */}
            <div className="flex flex-wrap items-center gap-3">
              {sourceLabel && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5" aria-hidden="true">
                    <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm.75 7.5h-1.5v-4h1.5v4zm0-5h-1.5V2h1.5v1.5z" />
                  </svg>
                  Source: {sourceLabel}
                </span>
              )}
              {extracted.themeName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  Base theme: {extracted.themeName}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {Object.keys(editedVars).length} variable{Object.keys(editedVars).length !== 1 ? "s" : ""} extracted
                {extracted.classDefs.length > 0 && ` · ${extracted.classDefs.length} classDef${extracted.classDefs.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Editable swatches */}
              <div className="space-y-4">
                <div>
                  <p className="forge-eyebrow mb-3">Extracted theme variables</p>
                  <div className="rounded-lg border border-border bg-card divide-y divide-border">
                    {orderedVarKeys.map((key) => (
                      <ColorSwatch
                        key={key}
                        color={{ key, label: labelForKey(key), value: editedVars[key] }}
                        onChange={handleVarChange}
                      />
                    ))}
                  </div>
                </div>

                {extracted.classDefs.length > 0 && (
                  <ClassDefList classDefs={extracted.classDefs} />
                )}

                {/* Theme name + use action */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <p className="forge-eyebrow">Use this theme</p>
                  <div>
                    <label htmlFor="extract-theme-name" className="text-xs text-muted-foreground mb-1 block">
                      Palette name
                    </label>
                    <input
                      id="extract-theme-name"
                      type="text"
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      className="w-full text-sm bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Extracted theme"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseTheme}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Use extracted theme in Apply tab →
                  </button>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    The extracted colors become the active palette. You can then edit
                    individual swatches in Apply or Compose, and re-export.
                  </p>
                </div>
              </div>

              {/* Right: Preview + diff */}
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  <p className="forge-eyebrow flex-1">Preview</p>
                  <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("preview")}
                      className={`px-2.5 py-1 transition-colors ${previewMode === "preview" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                    >
                      Re-themed
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("diff")}
                      className={`px-2.5 py-1 transition-colors ${previewMode === "diff" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                    >
                      Diff
                    </button>
                  </div>
                </div>

                {previewMode === "preview" ? (
                  <div className="rounded-lg border border-border overflow-hidden" style={{ minHeight: 280 }}>
                    {rethemedCode ? (
                      <MermaidPreview
                        code={rethemedCode}
                        className="w-full min-h-[280px]"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-muted-foreground text-xs">
                        No preview available
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden" style={{ minHeight: 280 }}>
                    <DiffView
                      oldText={pastedCode}
                      newText={rethemedCode}
                      className="h-[280px]"
                    />
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground leading-snug">
                  <strong>Re-themed</strong> shows how the diagram renders after applying the extracted palette.
                  <strong> Diff</strong> shows line-by-line changes between the original and re-themed code.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassDefList({ classDefs }: { classDefs: ExtractedClassDef[] }) {
  return (
    <div>
      <p className="forge-eyebrow mb-2">Detected class colors</p>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {classDefs.map((def) => (
          <div key={def.name} className="px-3 py-2.5">
            <p className="text-xs font-mono font-medium text-foreground mb-1.5">.{def.name}</p>
            <div className="flex flex-wrap gap-3">
              {def.fill && (
                <ColorChip label="fill" value={def.fill} />
              )}
              {def.stroke && (
                <ColorChip label="stroke" value={def.stroke} />
              )}
              {def.color && (
                <ColorChip label="color" value={def.color} />
              )}
              {def.strokeWidth && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="font-mono">stroke-width:</span>
                  <span className="font-mono text-foreground">{def.strokeWidth}</span>
                </span>
              )}
              {!def.fill && !def.stroke && !def.color && !def.strokeWidth && (
                <span className="text-[10px] text-muted-foreground italic">No color properties</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
        ClassDef colors are read-only in Extract mode. After using this theme, you can add or
        edit classDef rules directly in your diagram code.
      </p>
    </div>
  );
}

function ColorChip({ label, value }: { label: string; value: string }) {
  const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px]">
      {isHex && (
        <span
          className="inline-block w-3.5 h-3.5 rounded-sm border border-border shrink-0"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      )}
      <span className="text-muted-foreground font-mono">{label}:</span>
      <span className="font-mono text-foreground">{value}</span>
    </span>
  );
}
