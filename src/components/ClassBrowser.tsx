import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { buildClassDefString, type ClassDef } from "@/lib/themeEngine";
import { suggestClassMatch } from "@/lib/fuzzyClassMatch";

// ---------------------------------------------------------------------------
// Syntax highlighting for the classDef preview panel
// Produces React nodes with inline color spans; falls back to raw text.
// ---------------------------------------------------------------------------

export const HL = {
  keyword: "#c46a2c", // rust-orange — "classDef"
  name: "#e8d9c0", // bright cream — class name identifier
  key: "#5fa89a", // forge teal — property keys (fill, stroke, color…)
  hex: "#9ecfe8", // sky blue — hex color values
  value: "#c8b89a", // warm beige — non-hex values (bold, 2px, normal…)
  punct: "#7a7060", // dimmed — commas, colons, punctuation
} as const;

export function highlightPropsSegment(props: string, baseKey: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match key:value pairs separated by commas; values may include non-hex tokens
  const re = /([\w-]+)(:)(#[0-9a-fA-F]{3,8}|[\w.%-]+(?:\s+[\w.%-]+)*)/g;
  let last = 0;
  let idx = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(props)) !== null) {
    // anything between the last match and this one (commas, spaces)
    if (m.index > last) {
      nodes.push(
        <span key={`${baseKey}-p${idx}`} style={{ color: HL.punct }}>
          {props.slice(last, m.index)}
        </span>
      );
    }
    const isHex = m[3].startsWith("#");
    nodes.push(
      <span key={`${baseKey}-k${idx}`} style={{ color: HL.key }}>
        {m[1]}
      </span>,
      <span key={`${baseKey}-c${idx}`} style={{ color: HL.punct }}>
        {m[2]}
      </span>,
      <span key={`${baseKey}-v${idx}`} style={{ color: isHex ? HL.hex : HL.value }}>
        {m[3]}
      </span>
    );
    last = re.lastIndex;
    idx++;
  }

  if (last < props.length) {
    nodes.push(
      <span key={`${baseKey}-tail`} style={{ color: HL.punct }}>
        {props.slice(last)}
      </span>
    );
  }
  return nodes;
}

export function highlightClassDefLine(line: string, lineIdx: number): ReactNode {
  try {
    // Expected format: classDef <name> key:val,key:val,...
    const m = line.match(/^(classDef)(\s+)(\S+)(\s+)(.+)$/);
    if (!m) {
      // Not a standard classDef line — render dimmed
      return (
        <span key={lineIdx} style={{ color: HL.punct }}>
          {line}
        </span>
      );
    }
    const [, keyword, sp1, name, sp2, props] = m;
    return (
      <span key={lineIdx}>
        <span style={{ color: HL.keyword }}>{keyword}</span>
        {sp1}
        <span style={{ color: HL.name, fontWeight: 600 }}>{name}</span>
        {sp2}
        {highlightPropsSegment(props, String(lineIdx))}
      </span>
    );
  } catch {
    return <span key={lineIdx}>{line}</span>;
  }
}

export function highlightClassDefBlock(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {highlightClassDefLine(line, i)}
      {i < lines.length - 1 && "\n"}
    </span>
  ));
}

interface ClassBrowserProps {
  classDefs: ClassDef[];
  supportsClassDef?: boolean;
  usedClassNames?: ReadonlySet<string>;
}

function parseDashArray(extra: string): string | undefined {
  const m = extra.match(/stroke-dasharray\s*:\s*([\d.\s]+(?:\s+[\d.\s]+)*)/);
  return m ? m[1].trim() : undefined;
}

function parseOpacity(extra: string): number | undefined {
  const m = extra.match(/opacity\s*:\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : undefined;
}

function parseStrokeWidth(extra: string): string | undefined {
  const m = extra.match(/stroke-width\s*:\s*([\w.]+)/);
  return m ? m[1] : undefined;
}

function parseFontWeight(extra: string): string | undefined {
  const m = extra.match(/font-weight\s*:\s*([\w]+)/);
  return m ? m[1] : undefined;
}

function parseFontStyle(extra: string): string | undefined {
  const m = extra.match(/font-style\s*:\s*([\w]+)/);
  return m ? m[1] : undefined;
}

type CopiedState = { name: string; kind: "usage" | "classdef" | "all" | "used" } | null;

function ClassNode({
  def,
  isUsed,
  disabled,
  onCopyUsage,
  onCopyClassDef,
}: {
  def: ClassDef;
  isUsed: boolean;
  disabled?: boolean;
  onCopyUsage: (name: string) => void;
  onCopyClassDef: (def: ClassDef) => void;
}) {
  const dashArray = parseDashArray(def.extra);
  const opacity = parseOpacity(def.extra);
  const strokeWidth = parseStrokeWidth(def.extra) ?? "1px";
  const fontWeight = parseFontWeight(def.extra) ?? "normal";
  const fontStyle = parseFontStyle(def.extra) ?? "normal";

  const svgStrokeWidth = strokeWidth === "2px" ? 2 : 1;

  return (
    <div
      className={`group relative rounded-lg overflow-hidden border hover:shadow-md transition-all ${
        isUsed
          ? "border-emerald-500/60 ring-1 ring-emerald-500/25 hover:border-emerald-500/80"
          : "border-border/40 hover:border-primary/50"
      }`}
      style={{ opacity: opacity ?? 1 }}
    >
      {/* Primary action: copy usage annotation — covers the whole card */}
      <button
        type="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        onClick={() => !disabled && onCopyUsage(def.name)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCopyUsage(def.name);
          }
        }}
        aria-label={`Copy usage :::${def.name}`}
        title={`Click to copy :::${def.name}`}
        className="w-full flex flex-col items-stretch gap-0 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary/60"
      >
        <div
          className="relative flex items-center justify-center px-2 py-3"
          style={{ backgroundColor: def.fill }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <rect
              x={svgStrokeWidth / 2}
              y={svgStrokeWidth / 2}
              width={`calc(100% - ${svgStrokeWidth}px)`}
              height={`calc(100% - ${svgStrokeWidth}px)`}
              fill="none"
              stroke={def.stroke}
              strokeWidth={svgStrokeWidth}
              strokeDasharray={dashArray}
            />
          </svg>
          <span
            className="relative z-10 text-[11px] font-mono leading-tight text-center break-all px-1"
            style={{ color: def.color, fontWeight, fontStyle }}
          >
            {def.name}
          </span>

          {isUsed && (
            <span
              className="absolute bottom-1 left-1 z-20 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/80"
              title={`:::${def.name} is used in the current diagram`}
              aria-label="Used in current diagram"
            >
              <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                <path
                  d="M2 5.2l2 2 4-4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>
        <div className="bg-card/80 px-2 py-1.5 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
            {def.description}
          </p>
          <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 leading-none group-hover:text-primary/70 transition-colors">
            :::{def.name}
          </p>
        </div>
      </button>

      {/* Secondary action: copy full classDef — sibling of primary button, positioned over the card */}
      <button
        type="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onCopyClassDef(def);
        }}
        title={`Copy full classDef for ${def.name}`}
        className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5 rounded bg-black/40 hover:bg-black/65 focus:outline-none focus:ring-1 focus:ring-white/60"
        aria-label={`Copy classDef ${def.name}`}
      >
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
          <rect x="4.5" y="1" width="7.5" height="9" rx="1.2" stroke="white" strokeWidth="1.2" />
          <rect
            x="2"
            y="4"
            width="7.5"
            height="9"
            rx="1.2"
            fill="rgba(0,0,0,0.4)"
            stroke="white"
            strokeWidth="1.2"
          />
        </svg>
      </button>
    </div>
  );
}

export function ClassBrowser({
  classDefs,
  supportsClassDef = true,
  usedClassNames,
}: ClassBrowserProps) {
  const [copiedState, setCopiedState] = useState<CopiedState>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"all" | "used">("all");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPreview) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowPreview(false);
    }
    function handleClick(e: MouseEvent) {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        setShowPreview(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [showPreview]);

  const sortedClassDefs = useMemo<ClassDef[]>(() => {
    if (!usedClassNames || usedClassNames.size === 0) return classDefs;
    const used = classDefs.filter((def) => usedClassNames.has(def.name));
    const unused = classDefs.filter((def) => !usedClassNames.has(def.name));
    return [...used, ...unused];
  }, [classDefs, usedClassNames]);

  const writeToClipboard = useCallback(async (text: string) => {
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
  }, []);

  const handleCopyUsage = useCallback(
    async (name: string) => {
      await writeToClipboard(`:::${name}`);
      setCopiedState({ name, kind: "usage" });
      setTimeout(() => setCopiedState(null), 1800);
    },
    [writeToClipboard]
  );

  const handleCopyClassDef = useCallback(
    async (def: ClassDef) => {
      await writeToClipboard(buildClassDefString(def));
      setCopiedState({ name: def.name, kind: "classdef" });
      setTimeout(() => setCopiedState(null), 1800);
    },
    [writeToClipboard]
  );

  const handleCopyAll = useCallback(async () => {
    // Use `classDefs` (definition order from getClassDefs) so "Copy all" output
    // matches the export engine's buildClassDefLibrary order exactly.
    // The visual grid uses sortedClassDefs (used-first), but that reordering must
    // not affect the copied block — users should be able to drop it straight into
    // exported code without a diff.
    const block = classDefs.map((def) => buildClassDefString(def)).join("\n");
    await writeToClipboard(block);
    setCopiedState({ name: String(classDefs.length), kind: "all" });
    setTimeout(() => setCopiedState(null), 1800);
  }, [classDefs, writeToClipboard]);

  const handleCopyUsed = useCallback(async () => {
    if (!usedClassNames || usedClassNames.size === 0) return;
    // Use `classDefs` (definition order from getClassDefs) so "Copy used" output
    // matches the export engine order exactly — consistent with "Copy all".
    // sortedClassDefs uses a visual used-first sort that must not affect the copy.
    const usedDefs = classDefs.filter((def) => usedClassNames.has(def.name));
    const block = usedDefs.map((def) => buildClassDefString(def)).join("\n");
    await writeToClipboard(block);
    setCopiedState({ name: String(usedDefs.length), kind: "used" });
    setTimeout(() => setCopiedState(null), 1800);
  }, [classDefs, usedClassNames, writeToClipboard]);

  // Preview block mirrors what "Copy all" copies: definition order (classDefs),
  // not the visual sort order (sortedClassDefs), so the preview is a true preview.
  const previewBlock = useMemo(
    () => classDefs.map((def) => buildClassDefString(def)).join("\n"),
    [classDefs]
  );

  // Used-only preview block: matches the "Copy used" output order — definition
  // order (classDefs) filtered to used entries, consistent with handleCopyUsed.
  const usedPreviewBlock = useMemo(() => {
    if (!usedClassNames || usedClassNames.size === 0) return "";
    return classDefs
      .filter((def) => usedClassNames.has(def.name))
      .map((def) => buildClassDefString(def))
      .join("\n");
  }, [classDefs, usedClassNames]);

  const hasUsed = (usedClassNames?.size ?? 0) > 0;

  // Class names referenced via :::name in the diagram that have no matching
  // classDef in the current palette. Only meaningful when classDef is supported.
  const unknownClassNames = useMemo<string[]>(() => {
    if (!usedClassNames || usedClassNames.size === 0 || !supportsClassDef) return [];
    const definedNames = new Set(classDefs.map((d) => d.name));
    return Array.from(usedClassNames)
      .filter((name) => !definedNames.has(name))
      .sort();
  }, [usedClassNames, classDefs, supportsClassDef]);

  // Class names defined in the palette but absent from the current diagram.
  // Only meaningful when at least one class IS used — an empty usedClassNames
  // means the diagram hasn't applied any classes yet, which is intentional.
  const unusedClassNames = useMemo<string[]>(() => {
    if (!usedClassNames || usedClassNames.size === 0 || !supportsClassDef) return [];
    return classDefs
      .filter((def) => !usedClassNames.has(def.name))
      .map((d) => d.name)
      .sort();
  }, [classDefs, usedClassNames, supportsClassDef]);

  // Map each unknown class name to its closest defined name suggestions (edit distance ≤ 2).
  const unknownSuggestions = useMemo<Map<string, string[]>>(() => {
    if (unknownClassNames.length === 0) return new Map();
    const definedNames = classDefs.map((d) => d.name);
    return new Map(unknownClassNames.map((name) => [name, suggestClassMatch(name, definedNames)]));
  }, [unknownClassNames, classDefs]);

  const activePreviewBlock = previewMode === "used" && hasUsed ? usedPreviewBlock : previewBlock;
  // Derive count directly from the block so the header always reflects the exact
  // content that will be copied — never an independently-maintained variable.
  const activePreviewCount = activePreviewBlock
    ? activePreviewBlock.split("\n").filter(Boolean).length
    : 0;

  const toastLabel =
    copiedState?.kind === "all"
      ? `Copied ${copiedState.name} classDefs`
      : copiedState?.kind === "used"
        ? `Copied ${copiedState.name} classDef${copiedState.name !== "1" ? "s" : ""}`
        : copiedState?.kind === "classdef"
          ? `Copied classDef ${copiedState.name}`
          : copiedState?.kind === "usage"
            ? `Copied :::${copiedState.name}`
            : null;

  return (
    <div
      className={`flex flex-col h-full overflow-auto p-4 bg-muted/20 ${!supportsClassDef ? "opacity-60" : ""}`}
    >
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {toastLabel ?? ""}
      </span>
      <div ref={previewRef} className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
              Class Library
              <span
                className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                  supportsClassDef
                    ? "text-primary/80 bg-primary/10"
                    : "text-muted-foreground/60 bg-muted/60"
                }`}
                title={
                  supportsClassDef
                    ? `${classDefs.length} semantic class styles available for this diagram type`
                    : `${classDefs.length} class styles exist but are inactive for this diagram type`
                }
                aria-label={`${classDefs.length} class styles`}
              >
                {classDefs.length} styles
              </span>
              {usedClassNames && usedClassNames.size > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path
                      d="M2 5.2l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {usedClassNames.size} in use
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Click any node to copy its <span className="font-mono">:::className</span> syntax, or
              hover for the full <span className="font-mono">classDef</span> block
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {supportsClassDef && toastLabel && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-mono animate-in fade-in duration-150">
                {toastLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowPreview((v) => {
                  // When opening, default to "used" mode if any classes are in use
                  if (!v && hasUsed) setPreviewMode("used");
                  return !v;
                });
              }}
              disabled={!supportsClassDef}
              title={showPreview ? "Hide classDef preview" : "Preview what 'Copy all' will paste"}
              aria-pressed={showPreview}
              aria-label="Preview all classDefs"
              className={`inline-flex items-center justify-center w-[26px] h-[26px] rounded-md text-[10px] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary/60 ${
                showPreview
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 bg-card/70 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card"
              }`}
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
              >
                <ellipse cx="7" cy="7" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="7" cy="7" r="1.5" fill="currentColor" />
                {showPreview && (
                  <>
                    <line
                      x1="2"
                      y1="2"
                      x2="12"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
            {usedClassNames && usedClassNames.size > 0 && supportsClassDef && (
              <button
                type="button"
                onClick={handleCopyUsed}
                title={`Copy only the ${usedClassNames.size} classDef${usedClassNames.size !== 1 ? "s" : ""} used in the current diagram`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/70 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
              >
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                >
                  <rect
                    x="4.5"
                    y="1"
                    width="7.5"
                    height="9"
                    rx="1.2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="2"
                    y="4"
                    width="7.5"
                    height="9"
                    rx="1.2"
                    fill="currentColor"
                    fillOpacity="0.12"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M5.5 9.5l1.5 1.5 3-3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copy used ({usedClassNames.size})
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={!supportsClassDef}
              title="Copy all classDefs as a single block"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border/50 bg-card/70 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary/60"
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
              >
                <rect
                  x="4.5"
                  y="1"
                  width="7.5"
                  height="9"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <rect
                  x="2"
                  y="4"
                  width="7.5"
                  height="9"
                  rx="1.2"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
              Copy all
            </button>
          </div>
        </div>

        {showPreview && supportsClassDef && (
          <div className="mt-2 rounded-md border border-border/50 bg-[#0f1f1c] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8">
              <span className="text-[10px] font-medium text-[#d4c9b5]/60 uppercase tracking-wider font-mono">
                Preview —{" "}
                {previewMode === "used" && hasUsed
                  ? `${activePreviewCount} classDef${activePreviewCount !== 1 ? "s" : ""} (used only)`
                  : `${activePreviewCount} classDef${activePreviewCount !== 1 ? "s" : ""}`}
              </span>
              <div className="flex items-center gap-1.5">
                {hasUsed && (
                  <div
                    role="group"
                    aria-label="Preview mode"
                    className="inline-flex items-center rounded border border-white/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewMode("all")}
                      aria-pressed={previewMode === "all"}
                      title="Show all classDefs"
                      className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-white/30 ${
                        previewMode === "all"
                          ? "bg-white/12 text-[#d4c9b5]"
                          : "text-[#d4c9b5]/45 hover:text-[#d4c9b5]/80 hover:bg-white/6"
                      }`}
                    >
                      All
                    </button>
                    <span className="w-px h-3 bg-white/10" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setPreviewMode("used")}
                      aria-pressed={previewMode === "used"}
                      title={`Show only the ${usedClassNames?.size} classDef${usedClassNames?.size !== 1 ? "s" : ""} used in the current diagram`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500/40 ${
                        previewMode === "used"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "text-[#d4c9b5]/45 hover:text-emerald-300/80 hover:bg-emerald-500/10"
                      }`}
                    >
                      <svg viewBox="0 0 10 10" fill="none" className="w-2 h-2">
                        <path
                          d="M2 5.2l2 2 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Used
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={previewMode === "used" && hasUsed ? handleCopyUsed : handleCopyAll}
                  aria-label={
                    previewMode === "used" && hasUsed ? "Copy used classDefs" : "Copy all classDefs"
                  }
                  title={
                    previewMode === "used" && hasUsed ? "Copy used classDefs" : "Copy all classDefs"
                  }
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[#d4c9b5]/60 hover:text-[#d4c9b5] border border-white/10 hover:border-white/25 hover:bg-white/8 transition-colors focus:outline-none focus:ring-1 focus:ring-white/30"
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                  >
                    <rect
                      x="4.5"
                      y="1"
                      width="7.5"
                      height="9"
                      rx="1.2"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="2"
                      y="4"
                      width="7.5"
                      height="9"
                      rx="1.2"
                      fill="currentColor"
                      fillOpacity="0.12"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close preview"
                  className="text-[#d4c9b5]/40 hover:text-[#d4c9b5]/80 transition-colors focus:outline-none focus:ring-1 focus:ring-white/30 rounded"
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                  >
                    <line
                      x1="2"
                      y1="2"
                      x2="12"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="2"
                      x2="2"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <pre className="px-3 py-2.5 text-[11px] font-mono text-[#d4c9b5] leading-relaxed overflow-x-auto whitespace-pre select-all">
              {highlightClassDefBlock(activePreviewBlock)}
            </pre>
          </div>
        )}
      </div>

      {!supportsClassDef && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-400">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-semibold">classDef styles don't apply to this diagram type.</span>{" "}
            Switch to a flowchart, class, state, or block diagram to use these{" "}
            <span className="font-mono">:::className</span> tokens.
          </span>
        </div>
      )}

      {unknownClassNames.length > 0 && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-400"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-semibold">
              {`Unrecognized class ${unknownClassNames.length === 1 ? "name" : "names"}:`}
            </span>{" "}
            {unknownClassNames.map((n, i) => {
              const suggestions = unknownSuggestions.get(n) ?? [];
              return (
                <span key={n}>
                  <span className="font-mono">{`:::${n}`}</span>
                  {suggestions.length > 0 && (
                    <span>
                      {" "}
                      <span className="opacity-80">
                        (did you mean{" "}
                        {suggestions.map((s, si) => (
                          <span key={s}>
                            <span className="font-mono">{`:::${s}`}</span>
                            {si < suggestions.length - 1 && ", "}
                          </span>
                        ))}
                        ?)
                      </span>
                    </span>
                  )}
                  {i < unknownClassNames.length - 1 && ", "}
                </span>
              );
            })}{" "}
            — not defined in the current palette. Check for typos.
          </span>
        </div>
      )}

      {unusedClassNames.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-sky-500/30 bg-sky-500/8 px-3 py-2.5 text-[11px] text-sky-700 dark:text-sky-400">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <span className="font-semibold">
              {unusedClassNames.length === 1
                ? "1 style not applied:"
                : `${unusedClassNames.length} styles not applied:`}
            </span>{" "}
            {unusedClassNames.map((n, i) => (
              <span key={n}>
                <span className="font-mono">{`:::${n}`}</span>
                {i < unusedClassNames.length - 1 && ", "}
              </span>
            ))}{" "}
            — defined in the palette but not used in the current diagram.
          </span>
        </div>
      )}

      <div
        aria-disabled={!supportsClassDef ? true : undefined}
        className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 ${!supportsClassDef ? "pointer-events-none select-none" : ""}`}
      >
        {sortedClassDefs.map((def) => (
          <ClassNode
            key={def.name}
            def={def}
            isUsed={usedClassNames?.has(def.name) ?? false}
            disabled={!supportsClassDef}
            onCopyUsage={handleCopyUsage}
            onCopyClassDef={handleCopyClassDef}
          />
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/50 text-center">
        {supportsClassDef
          ? "Styles update live as you edit palette colors in the sidebar"
          : "Color previews update live — tokens are inactive for this diagram type"}
      </p>
    </div>
  );
}
