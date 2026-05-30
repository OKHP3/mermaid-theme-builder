import { useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from "react";
import type { Palette, ThemeColor } from "@/lib/palettes";
import { ColorSwatch } from "@/components/ColorSwatch";
import { DiffView } from "@/components/DiffView";
import { MermaidPreview } from "@/components/MermaidPreview";
import {
  extractTheme,
  makeExtractedPaletteId,
  type ExtractedTheme,
  type ExtractedClassDef,
} from "@/lib/extractor";
import { generateThemedCode } from "@/lib/theme-engine";
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

function labelForKey(key: string): string {
  return KEY_LABELS[key] ?? key;
}

/**
 * Re-serialize a classDef entry back into `key:value,...` style string.
 * Only emits properties that are present (non-empty).
 */
function serializeClassDef(def: ExtractedClassDef): string {
  const parts: string[] = [];
  if (def.fill) parts.push(`fill:${def.fill}`);
  if (def.stroke) parts.push(`stroke:${def.stroke}`);
  if (def.color) parts.push(`color:${def.color}`);
  if (def.strokeWidth) parts.push(`stroke-width:${def.strokeWidth}`);
  return parts.join(",");
}

/**
 * Strip the %%{init}%% directive and YAML frontmatter from code so the Apply
 * tab can receive clean diagram source and add its own theme directive.
 */
function stripThemeDirective(code: string): string {
  let result = code.replace(/^\s*%%\s*\{[\s\S]*?init\s*:[\s\S]*?\}\s*%%\s*\n?/m, "");
  result = result.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  return result.trimStart();
}

/**
 * Replace every `classDef <name> <styles>` line in `code` with the edited
 * version from `edits`. Lines whose name is not in `edits` are left unchanged.
 */
function applyEditedClassDefs(code: string, edits: Record<string, ExtractedClassDef>): string {
  return code.replace(
    /^(\s*classDef\s+)([A-Za-z_][\w-]*)(\s+[^\n]+)$/gm,
    (match, prefix: string, name: string) => {
      const edit = edits[name];
      if (!edit) return match;
      const serialized = serializeClassDef(edit);
      return serialized ? `${prefix}${name} ${serialized}` : match;
    }
  );
}

interface ExtractTabProps {
  onUseExtractedTheme: (palette: Palette, codeWithClassDefs?: string) => void;
  onSwitchTab: (tab: AppTab) => void;
  onShowToast: (msg: ReactNode) => void;
  embedded?: boolean;
}

type ExtractStatus = "idle" | "found" | "empty" | "no-vars";

export function ExtractTab({
  onUseExtractedTheme,
  onSwitchTab,
  onShowToast,
  embedded = false,
}: ExtractTabProps) {
  const [pastedCode, setPastedCode] = useState("");
  const [extracted, setExtracted] = useState<ExtractedTheme | null>(null);
  const [editedVars, setEditedVars] = useState<Record<string, string>>({});
  const [editedClassDefs, setEditedClassDefs] = useState<Record<string, ExtractedClassDef>>({});
  const [status, setStatus] = useState<ExtractStatus>("idle");
  const [previewMode, setPreviewMode] = useState<"preview" | "diff">("preview");
  const [themeName, setThemeName] = useState("Extracted theme");
  const [copiedCode, setCopiedCode] = useState(false);
  const copyCodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExtract = useCallback(() => {
    const code = pastedCode.trim();
    if (!code) return;

    const result = extractTheme(code);
    const hasVars = Object.keys(result.themeVariables).length > 0;
    const hasDefs = result.classDefs.length > 0;

    const defsMap: Record<string, ExtractedClassDef> = {};
    result.classDefs.forEach((d) => {
      defsMap[d.name] = { ...d };
    });

    if (!hasVars && !hasDefs && result.sourceFormat === "none") {
      setExtracted(null);
      setEditedVars({});
      setEditedClassDefs({});
      setStatus("empty");
      return;
    }

    if (!hasVars && result.sourceFormat !== "none") {
      setExtracted(result);
      setEditedVars({});
      setEditedClassDefs(defsMap);
      setStatus("no-vars");
      return;
    }

    setExtracted(result);
    setEditedVars({ ...result.themeVariables });
    setEditedClassDefs(defsMap);
    setStatus("found");
  }, [pastedCode]);

  const handleVarChange = useCallback((key: string, value: string) => {
    setEditedVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClassDefChange = useCallback(
    (name: string, prop: "fill" | "stroke" | "color", value: string) => {
      setEditedClassDefs((prev) => ({
        ...prev,
        [name]: { ...prev[name], [prop]: value },
      }));
    },
    []
  );

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
      description:
        "Theme extracted from a pasted diagram. Edit colors below, then click Use Theme to apply.",
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
    const codeWithClassDefs = applyEditedClassDefs(pastedCode, editedClassDefs);
    const detection = detectDiagram(codeWithClassDefs);
    return generateThemedCode(codeWithClassDefs, {
      palette: effectivePalette,
      diagramFamily: detection.family,
      includeMetaComments: false,
      includeBadge: false,
    });
  }, [effectivePalette, pastedCode, editedClassDefs]);

  const handleUseTheme = useCallback(() => {
    if (!effectivePalette) return;
    const name = themeName.trim() || "Extracted theme";
    const finalPalette: Palette = { ...effectivePalette, name };
    const hasClassDefs = Object.keys(editedClassDefs).length > 0;
    const codeForApply = hasClassDefs
      ? applyEditedClassDefs(stripThemeDirective(pastedCode), editedClassDefs)
      : undefined;
    onUseExtractedTheme(finalPalette, codeForApply);
    onShowToast(
      hasClassDefs
        ? `Loaded "${name}" — ${Object.keys(editedClassDefs).length} classDef override${Object.keys(editedClassDefs).length !== 1 ? "s" : ""} applied to Apply tab code`
        : `Loaded "${name}" — edit colors in the Apply or Compose tab`
    );
    onSwitchTab("apply");
  }, [
    effectivePalette,
    themeName,
    editedClassDefs,
    pastedCode,
    onUseExtractedTheme,
    onShowToast,
    onSwitchTab,
  ]);

  const handleClearAll = useCallback(() => {
    setPastedCode("");
    setExtracted(null);
    setEditedVars({});
    setEditedClassDefs({});
    setStatus("idle");
    setThemeName("Extracted theme");
    setPreviewMode("preview");
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!rethemedCode) return;
    await writeToClipboard(rethemedCode);
    onShowToast("Copied!");
    setCopiedCode(true);
    if (copyCodeTimeoutRef.current) clearTimeout(copyCodeTimeoutRef.current);
    copyCodeTimeoutRef.current = setTimeout(() => setCopiedCode(false), 2000);
  }, [rethemedCode, onShowToast]);

  useEffect(() => {
    return () => {
      if (copyCodeTimeoutRef.current) clearTimeout(copyCodeTimeoutRef.current);
    };
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

  const innerContent = (
    <div className={embedded ? "space-y-4" : "max-w-5xl mx-auto px-4 py-6 space-y-6"}>
      {!embedded && (
        <div>
          <p className="forge-eyebrow mb-1">Extract mode</p>
          <h2 className="text-base font-semibold text-foreground leading-snug">
            Reverse-engineer a themed diagram
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Paste a Mermaid diagram that already has a theme applied. The tool reads the
            <code className="mx-1 px-1 py-0.5 rounded bg-muted font-mono text-[10px]">
              {"%%{init}%%"}
            </code>
            directive or YAML frontmatter, extracts every theme variable and classDef color into
            editable swatches, then lets you load the result into Apply mode.
          </p>
        </div>
      )}

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
          className="w-full text-xs font-mono bg-[var(--okh-forge-code-bg)] text-[var(--okh-forge-code-fg)] border border-border rounded-md px-3 py-2.5 resize-y focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-[var(--okh-forge-code-fg)]/30"
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
          <p className="text-sm text-muted-foreground font-medium">
            Paste a themed diagram above, then click Extract theme
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Works with <code className="font-mono">{"%%{init}%%"}</code> directives and YAML
            frontmatter
          </p>
        </div>
      )}

      {status === "empty" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-5 space-y-3">
          <div className="flex items-start gap-3">
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
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                No theme found in this diagram
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This looks like a bare diagram with no theme information attached. Extract mode
                reads existing theme data — it needs at least one of these to work:
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 list-disc">
                <li>
                  An{" "}
                  <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">
                    {"%%{init}%%"}
                  </code>{" "}
                  directive with a{" "}
                  <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">
                    themeVariables
                  </code>{" "}
                  block
                </li>
                <li>
                  YAML frontmatter (
                  <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">---</code>{" "}
                  block) with{" "}
                  <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">
                    themeVariables
                  </code>
                </li>
                <li>
                  <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">
                    classDef
                  </code>{" "}
                  color declarations inside the diagram body
                </li>
              </ul>
              <p className="text-xs text-muted-foreground/70 leading-relaxed pt-0.5">
                Want to <em>add</em> a theme to a bare diagram instead? Use the Apply tab.
              </p>
            </div>
          </div>
          <div className="pl-7">
            <button
              type="button"
              onClick={() => onSwitchTab("apply")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Go to Apply tab →
            </button>
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
                Theme directive found — but no color variables to extract
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                A {sourceLabel} was detected
                {extracted.themeName ? ` (base theme: ${extracted.themeName})` : ""}, but it
                contains no{" "}
                <code className="font-mono text-[10px] px-0.5 py-px rounded bg-muted">
                  themeVariables
                </code>{" "}
                color or font overrides to extract.{" "}
                {extracted.classDefs.length > 0
                  ? "ClassDef colors were found — edit them below."
                  : "Try pasting a diagram whose init directive includes an explicit themeVariables block."}
              </p>
            </div>
          </div>
          {extracted.classDefs.length > 0 && (
            <ClassDefList classDefs={editedClassDefs} onChange={handleClassDefChange} />
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
                <svg
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  className="w-2.5 h-2.5"
                  aria-hidden="true"
                >
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
              {Object.keys(editedVars).length} variable
              {Object.keys(editedVars).length !== 1 ? "s" : ""} extracted
              {extracted.classDefs.length > 0 &&
                ` · ${extracted.classDefs.length} classDef${extracted.classDefs.length !== 1 ? "s" : ""}`}
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
                <ClassDefList classDefs={editedClassDefs} onChange={handleClassDefChange} />
              )}

              {/* Theme name + use action */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <p className="forge-eyebrow">Use this theme</p>
                <div>
                  <label
                    htmlFor="extract-theme-name"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
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
                  The extracted colors become the active palette. You can then edit individual
                  swatches in Apply or Compose, and re-export.
                  {extracted.classDefs.length > 0 && (
                    <>
                      {" "}
                      Your classDef color edits are already baked into the re-themed code shown in
                      the preview — copy it from there to use in your diagram.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Preview + diff */}
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <p className="forge-eyebrow flex-1">Preview</p>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!rethemedCode}
                  className="px-2.5 py-1 rounded-md border border-border text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Copy re-themed code to clipboard"
                >
                  {copiedCode ? "Copied!" : "Copy themed code"}
                </button>
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
                <div
                  className="rounded-lg border border-border overflow-hidden"
                  style={{ minHeight: 280 }}
                >
                  {rethemedCode ? (
                    <MermaidPreview code={rethemedCode} className="w-full min-h-[280px]" />
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-xs">
                      No preview available
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-lg border border-border overflow-hidden"
                  style={{ minHeight: 280 }}
                >
                  <DiffView oldText={pastedCode} newText={rethemedCode} className="h-[280px]" />
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-snug">
                <strong>Re-themed</strong> shows how the diagram renders after applying the
                extracted palette.
                <strong> Diff</strong> shows line-by-line changes between the original and re-themed
                code.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  if (embedded) return innerContent;
  return <div className="h-full overflow-auto">{innerContent}</div>;
}

interface ClassDefListProps {
  classDefs: Record<string, ExtractedClassDef>;
  onChange: (name: string, prop: "fill" | "stroke" | "color", value: string) => void;
}

function ClassDefList({ classDefs, onChange }: ClassDefListProps) {
  const entries = Object.values(classDefs);
  if (entries.length === 0) return null;

  return (
    <div>
      <p className="forge-eyebrow mb-3">Extracted class colors</p>
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {entries.map((def) => (
          <ClassDefRow key={def.name} def={def} onChange={onChange} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
        Edit classDef swatches to adjust per-node colors. Changes are reflected in the re-themed
        preview and diff.
      </p>
    </div>
  );
}

interface ClassDefRowProps {
  def: ExtractedClassDef;
  onChange: (name: string, prop: "fill" | "stroke" | "color", value: string) => void;
}

function ClassDefRow({ def, onChange }: ClassDefRowProps) {
  const hasColors = def.fill !== undefined || def.stroke !== undefined || def.color !== undefined;

  return (
    <div className="px-3 py-2.5 space-y-0.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono font-semibold text-foreground">.{def.name}</span>
        {def.strokeWidth && (
          <span className="text-[10px] text-muted-foreground font-mono">
            stroke-width: {def.strokeWidth}
          </span>
        )}
      </div>
      {hasColors ? (
        <div className="space-y-0">
          {def.fill !== undefined && (
            <ColorSwatch
              color={{ key: `${def.name}.fill`, label: "fill", value: def.fill }}
              onChange={(_key, val) => onChange(def.name, "fill", val)}
            />
          )}
          {def.stroke !== undefined && (
            <ColorSwatch
              color={{ key: `${def.name}.stroke`, label: "stroke", value: def.stroke }}
              onChange={(_key, val) => onChange(def.name, "stroke", val)}
            />
          )}
          {def.color !== undefined && (
            <ColorSwatch
              color={{ key: `${def.name}.color`, label: "color", value: def.color }}
              onChange={(_key, val) => onChange(def.name, "color", val)}
            />
          )}
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground italic">No color properties</span>
      )}
    </div>
  );
}
