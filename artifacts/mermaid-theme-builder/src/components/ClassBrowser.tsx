import { useState, useCallback } from "react";
import type { ClassDef } from "@/lib/themeEngine";

interface ClassBrowserProps {
  classDefs: ClassDef[];
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

function ClassNode({ def, onCopy }: { def: ClassDef; onCopy: (name: string) => void }) {
  const dashArray = parseDashArray(def.extra);
  const opacity = parseOpacity(def.extra);
  const strokeWidth = parseStrokeWidth(def.extra) ?? "1px";
  const fontWeight = parseFontWeight(def.extra) ?? "normal";
  const fontStyle = parseFontStyle(def.extra) ?? "normal";

  const svgStrokeWidth = strokeWidth === "2px" ? 2 : 1;

  return (
    <button
      onClick={() => onCopy(def.name)}
      title={`Click to copy :::${def.name}`}
      className="group flex flex-col items-stretch gap-0 rounded-lg overflow-hidden border border-border/40 hover:border-primary/50 hover:shadow-md transition-all text-left focus:outline-none focus:ring-1 focus:ring-primary/60"
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
      </div>
      <div className="bg-card/80 px-2 py-1.5 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
          {def.description}
        </p>
        <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 leading-none group-hover:text-primary/70 transition-colors">
          :::{ def.name}
        </p>
      </div>
    </button>
  );
}

export function ClassBrowser({ classDefs }: ClassBrowserProps) {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCopy = useCallback(async (name: string) => {
    const text = `:::${name}`;
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
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 1800);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-auto p-4 bg-muted/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">Class Library</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            16 semantic styles — click any node to copy its{" "}
            <span className="font-mono">:::className</span> syntax
          </p>
        </div>
        {copiedName && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-mono animate-in fade-in duration-150">
            Copied :::{ copiedName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {classDefs.map((def) => (
          <ClassNode key={def.name} def={def} onCopy={handleCopy} />
        ))}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/50 text-center">
        Styles update live as you edit palette colors in the sidebar
      </p>
    </div>
  );
}
