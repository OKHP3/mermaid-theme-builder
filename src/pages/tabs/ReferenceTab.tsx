import { useMemo } from "react";
import type { Palette } from "@/lib/palettes";
import { getClassDefs } from "@/lib/themeEngine";
import { DiagramInventory } from "@/components/DiagramInventory";
import { ClassBrowser } from "@/components/ClassBrowser";
import { RENDERER_PROFILES, supportLabel, supportColor } from "@/data/renderer-parity";

interface ReferenceTabProps {
  selectedPalette: Palette;
  supportsClassDef: boolean;
}

const NOTION_TAXONOMY_URL =
  "https://www.notion.so/overkillhill/Visual-Language-Diagram-Taxonomy-Mermaid-Theme-Builder-34e812e0ced481fb9e31d0fe47562684";
const GITHUB_REPO_URL = "https://github.com/OKHP3/mermaid-theme-builder";

const LOOK_COLS = [
  { key: "classic" as const, label: "Classic" },
  { key: "neo" as const, label: "Neo" },
  { key: "handDrawn" as const, label: "Hand-Drawn" },
];

function SupportBadge({ support }: { support: import("@/data/renderer-parity").RendererSupport }) {
  return (
    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${supportColor(support)}`}>
      {supportLabel(support)}
    </span>
  );
}

export function ReferenceTab({ selectedPalette, supportsClassDef }: ReferenceTabProps) {
  const classDefs = useMemo(() => getClassDefs(selectedPalette), [selectedPalette]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <DiagramInventory embedded />
      </div>

      <div className="flex-none border-t border-border">
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted-foreground">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h3a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
              <span className="text-xs font-medium text-foreground">Renderer Parity Matrix</span>
              <span className="text-[10px] text-muted-foreground">{RENDERER_PROFILES.length} renderers · look + theming support</span>
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
          <div className="border-t border-border overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-[10px] border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-muted/40 sticky top-0">
                  <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">Renderer</th>
                  {LOOK_COLS.map((c) => (
                    <th key={c.key} className="text-center px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="text-center px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">themeVars</th>
                  <th className="text-center px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">CSS inject</th>
                  <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground border-b border-border whitespace-nowrap">Version</th>
                </tr>
              </thead>
              <tbody>
                {RENDERER_PROFILES.map((renderer, i) => (
                  <tr
                    key={renderer.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}
                    title={renderer.notes}
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground whitespace-nowrap">
                      <a
                        href={renderer.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-primary transition-colors"
                      >
                        {renderer.shortName}
                      </a>
                      {renderer.caveats.length > 0 && (
                        <span className="ml-1 text-muted-foreground/50" title={renderer.caveats.join("\n")}>*</span>
                      )}
                    </td>
                    {LOOK_COLS.map((c) => (
                      <td key={c.key} className="px-2 py-1.5 text-center">
                        <SupportBadge support={renderer.looksSupported[c.key]} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      <SupportBadge support={renderer.themeVariableSupport} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <SupportBadge support={renderer.cssInjectionSupport} />
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{renderer.mermaidVersionApprox}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-3 py-1.5 text-[9px] text-muted-foreground/50">
              * Hover renderer name for notes. Caveats marked with asterisk. Data reflects research as of Mermaid 11.15.0 — validate in your target environment.
            </p>
          </div>
        </details>
      </div>

      <div className="flex-none border-t border-border">
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none hover:bg-muted/40 transition-colors select-none">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-muted-foreground">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium text-foreground">Class Library</span>
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
            <ClassBrowser classDefs={classDefs} supportsClassDef={supportsClassDef} />
          </div>
        </details>
      </div>

      <div className="flex-none border-t border-border bg-card/40 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="forge-eyebrow">
          Further reading
        </span>
        <a
          href={NOTION_TAXONOMY_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          Visual Language Diagram Taxonomy (Notion)
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
