import { useMemo } from "react";
import type { Palette } from "@/lib/palettes";
import { getClassDefs } from "@/lib/themeEngine";
import { DiagramInventory } from "@/components/DiagramInventory";
import { ClassBrowser } from "@/components/ClassBrowser";

interface ReferenceTabProps {
  selectedPalette: Palette;
}

export function ReferenceTab({ selectedPalette }: ReferenceTabProps) {
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
            <ClassBrowser classDefs={classDefs} />
          </div>
        </details>
      </div>
    </div>
  );
}
