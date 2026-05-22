import { useState, useCallback, useMemo } from "react";
import { buildClassDefString, type ClassDef } from "@/lib/themeEngine";

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


type CopiedState = { name: string; kind: "usage" | "classdef" | "all" } | null;

function ClassNode({
  def,
  isUsed,
  onCopyUsage,
  onCopyClassDef,
}: {
  def: ClassDef;
  isUsed: boolean;
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
      role="button"
      tabIndex={0}
      onClick={() => onCopyUsage(def.name)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCopyUsage(def.name);
        }
      }}
      title={`Click to copy :::${def.name}`}
      className={`group flex flex-col items-stretch gap-0 rounded-lg overflow-hidden border hover:shadow-md transition-all text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/60 ${
        isUsed
          ? "border-emerald-500/60 ring-1 ring-emerald-500/25 hover:border-emerald-500/80"
          : "border-border/40 hover:border-primary/50"
      }`}
      style={{ opacity: opacity ?? 1 }}
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
              <path d="M2 5.2l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyClassDef(def);
          }}
          title={`Copy full classDef for ${def.name}`}
          className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5 rounded bg-black/40 hover:bg-black/65 focus:outline-none focus:ring-1 focus:ring-white/60"
          aria-label={`Copy classDef ${def.name}`}
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
          >
            <rect x="4.5" y="1" width="7.5" height="9" rx="1.2" stroke="white" strokeWidth="1.2" />
            <rect x="2" y="4" width="7.5" height="9" rx="1.2" fill="rgba(0,0,0,0.4)" stroke="white" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
      <div className="bg-card/80 px-2 py-1.5 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
          {def.description}
        </p>
        <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 leading-none group-hover:text-primary/70 transition-colors">
          :::{ def.name}
        </p>
      </div>
    </div>
  );
}

export function ClassBrowser({ classDefs, supportsClassDef = true, usedClassNames }: ClassBrowserProps) {
  const [copiedState, setCopiedState] = useState<CopiedState>(null);

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
    const block = sortedClassDefs.map((def) => buildClassDefString(def)).join("\n");
    await writeToClipboard(block);
    setCopiedState({ name: String(sortedClassDefs.length), kind: "all" });
    setTimeout(() => setCopiedState(null), 1800);
  }, [sortedClassDefs, writeToClipboard]);

  const toastLabel =
    copiedState?.kind === "all"
      ? `Copied ${copiedState.name} classDefs`
      : copiedState?.kind === "classdef"
      ? `Copied classDef ${copiedState.name}`
      : copiedState?.kind === "usage"
      ? `Copied :::${copiedState.name}`
      : null;

  return (
    <div className={`flex flex-col h-full overflow-auto p-4 bg-muted/20 ${!supportsClassDef ? "opacity-60" : ""}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            Class Library
            {usedClassNames && usedClassNames.size > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 5.2l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {usedClassNames.size} in use
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {sortedClassDefs.length} semantic styles — click any node to copy its{" "}
            <span className="font-mono">:::className</span> syntax, or hover for the full{" "}
            <span className="font-mono">classDef</span> block
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
            onClick={handleCopyAll}
            disabled={!supportsClassDef}
            title="Copy all classDefs as a single block"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border/50 bg-card/70 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary/60"
          >
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3">
              <rect x="4.5" y="1" width="7.5" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <rect x="2" y="4" width="7.5" height="9" rx="1.2" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Copy all
          </button>
        </div>
      </div>

      {!supportsClassDef && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>
            <span className="font-semibold">classDef styles don't apply to this diagram type.</span>{" "}
            Switch to a flowchart, class, state, or block diagram to use these{" "}
            <span className="font-mono">:::className</span> tokens.
          </span>
        </div>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 ${!supportsClassDef ? "pointer-events-none select-none" : ""}`}>
        {sortedClassDefs.map((def) => (
          <ClassNode
            key={def.name}
            def={def}
            isUsed={usedClassNames?.has(def.name) ?? false}
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
