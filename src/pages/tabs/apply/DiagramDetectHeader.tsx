import { useState, useRef, useEffect } from "react";
import { DIAGRAM_CAPABILITIES, type DiagramFamily } from "@/data/mermaid-capabilities";
import { RENDERER_PROFILES, type RendererProfile } from "@/data/renderer-parity";
import type { DetectionResult } from "@/lib/detector";
import type { MermaidLook } from "@/lib/theme-engine";

interface DiagramDetectHeaderProps {
  detection: DetectionResult;
  effectiveDetection: DetectionResult;
  familyOverride: DiagramFamily | null;
  onFamilyOverrideChange: (family: DiagramFamily | null) => void;
  look: MermaidLook;
  onLookChange: (v: MermaidLook) => void;
  rendererTarget: string;
  onRendererTargetChange: (v: string) => void;
  rendererProfile: RendererProfile | undefined;
  rendererLookWarning: string | null;
}

export function DiagramDetectHeader({
  detection,
  effectiveDetection,
  familyOverride,
  onFamilyOverrideChange,
  look,
  onLookChange,
  rendererTarget,
  onRendererTargetChange,
  rendererProfile,
  rendererLookWarning,
}: DiagramDetectHeaderProps) {
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [familyMenuPos, setFamilyMenuPos] = useState({ top: 0, left: 0 });
  const familyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showFamilyMenu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFamilyMenu(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showFamilyMenu]);

  return (
    <div className="flex-none border-b border-border bg-card/20 px-3 py-1.5 flex items-center gap-x-1.5 sm:gap-x-3 overflow-x-auto print-hide">
      {/* Chart Type */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Type
        </span>
        <div className="relative">
          <button
            ref={familyBtnRef}
            type="button"
            onClick={() => {
              const rect = familyBtnRef.current?.getBoundingClientRect();
              if (rect) setFamilyMenuPos({ top: rect.bottom + 4, left: rect.left });
              setShowFamilyMenu((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={showFamilyMenu}
            title={
              familyOverride
                ? `Family override: ${effectiveDetection.label} (auto-detected: ${detection.label}). Click to change or clear.`
                : detection.family === "unknown"
                  ? "Diagram family not auto-detected — click to set manually."
                  : `Auto-detected family: ${detection.label}. Click to override.`
            }
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 transition-colors ${
              familyOverride
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
                : effectiveDetection.family === "unknown"
                  ? "bg-muted text-muted-foreground border border-border hover:bg-muted/70"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <span>
              {effectiveDetection.family === "unknown" ? "Set family…" : effectiveDetection.label}
            </span>
            {familyOverride && <span className="text-[9px] opacity-70">override</span>}
            <svg
              viewBox="0 0 12 12"
              className="w-2.5 h-2.5 opacity-60"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3 4.5l3 3 3-3z" />
            </svg>
          </button>
          {showFamilyMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFamilyMenu(false)}
                aria-hidden="true"
              />
              <div
                style={{ top: familyMenuPos.top, left: familyMenuPos.left }}
                className="fixed z-40 min-w-[200px] max-h-[320px] overflow-auto rounded-md border border-border bg-popover shadow-lg py-1"
                role="menu"
                aria-label="Override diagram family"
              >
                <button
                  role="menuitemradio"
                  aria-checked={!familyOverride}
                  onClick={() => {
                    onFamilyOverrideChange(null);
                    setShowFamilyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 ${
                    !familyOverride ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span>Auto-detect</span>
                  <span className="text-[10px] opacity-60">
                    {detection.family === "unknown" ? "unknown" : detection.label}
                  </span>
                </button>
                <div className="border-t border-border my-1" aria-hidden="true" />
                {DIAGRAM_CAPABILITIES.map((cap) => {
                  const active = familyOverride === cap.id;
                  return (
                    <button
                      key={cap.id}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onFamilyOverrideChange(cap.id);
                        setShowFamilyMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {cap.displayName}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-px h-3.5 bg-border/60 shrink-0 hidden sm:block" aria-hidden="true" />

      {/* Target */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Target
        </span>
        <select
          value={rendererTarget}
          onChange={(e) => onRendererTargetChange(e.target.value)}
          className="text-[10px] bg-background border border-border rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer max-w-[80px] sm:max-w-none"
          aria-label="Select target renderer"
        >
          <option value="">Generic (most compatible)</option>
          {RENDERER_PROFILES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}
            </option>
          ))}
        </select>
        {rendererLookWarning ? (
          <span className="hidden sm:flex text-[10px] text-amber-600 dark:text-amber-400 items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 5zm0 8.25a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {rendererLookWarning}
          </span>
        ) : (
          rendererProfile && (
            <span className="hidden sm:block text-[10px] text-muted-foreground/50">
              {rendererProfile.mermaidVersionApprox}
            </span>
          )
        )}
      </div>

      <div className="w-px h-3.5 bg-border/60 shrink-0 hidden sm:block" aria-hidden="true" />

      {/* Look */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Look
        </span>
        <div className="flex gap-1 shrink-0">
          {(
            [
              { value: "classic" as MermaidLook, label: "Classic" },
              { value: "neo" as MermaidLook, label: "Neo" },
              { value: "handDrawn" as MermaidLook, label: "Hand Drawn" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onLookChange(opt.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                look === opt.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {look !== "classic" && (
          <span className="hidden sm:block text-[10px] text-muted-foreground/60">
            {look === "neo" ? "v11+ required" : "sketch style"}
          </span>
        )}
      </div>
    </div>
  );
}
