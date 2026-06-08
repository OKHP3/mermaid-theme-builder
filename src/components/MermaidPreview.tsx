import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { type TypographySettings, generateTypographyCss } from "@/lib/typography";

interface MermaidPreviewProps {
  code: string;
  className?: string;
  typography?: TypographySettings;
}

type MermaidType = typeof import("mermaid").default;

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.15;

let mermaidInstance: MermaidType | null = null;
let initializationDone = false;

async function getMermaid(): Promise<MermaidType> {
  if (!mermaidInstance) {
    const mod = await import("mermaid");
    mermaidInstance = mod.default;
  }
  if (!initializationDone) {
    const zenuml = await import("@mermaid-js/mermaid-zenuml");
    await mermaidInstance.registerExternalDiagrams([zenuml.default]);
    mermaidInstance.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
    });
    initializationDone = true;
  }
  return mermaidInstance;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function IconZoomIn() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
      <line x1="6.5" y1="4.5" x2="6.5" y2="8.5" />
      <line x1="4.5" y1="6.5" x2="8.5" y2="6.5" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
      <line x1="4.5" y1="6.5" x2="8.5" y2="6.5" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 8a5.5 5.5 0 1 0 1.1-3.3" />
      <polyline points="2.5 3 2.5 6 5.5 6" />
    </svg>
  );
}

function IconFit() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="1 5 1 1 5 1" />
      <line x1="1" y1="1" x2="5.5" y2="5.5" />
      <polyline points="15 5 15 1 11 1" />
      <line x1="15" y1="1" x2="10.5" y2="5.5" />
      <polyline points="1 11 1 15 5 15" />
      <line x1="1" y1="15" x2="5.5" y2="10.5" />
      <polyline points="15 11 15 15 11 15" />
      <line x1="15" y1="15" x2="10.5" y2="10.5" />
    </svg>
  );
}

function scopedTypographyCss(css: string, scopeId: string): string {
  const scope = `#${scopeId}`;
  return css
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("/*")) return line;
      return `${scope} ${line}`;
    })
    .join("\n");
}

export function MermaidPreview({ code, className, typography }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");

  const panAnchor = useRef<{ mouseX: number; mouseY: number; tx: number; ty: number } | null>(null);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const uniqueId = useId().replace(/:/g, "");

  const typographyCss = useMemo(() => {
    if (!typography) return "";
    const raw = generateTypographyCss(typography);
    const previewScopeId = `mermaid-preview-${uniqueId}`;
    return scopedTypographyCss(raw, previewScopeId);
  }, [typography, uniqueId]);

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const fitToWindow = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    let svgW = 0;
    let svgH = 0;

    // Mermaid sets max-width (CSS pixels) on the SVG element.
    // viewBox may use a different internal coordinate scale, so max-width
    // is a more reliable source for the diagram's natural rendered size.
    const maxWidthStr = svg.style.maxWidth;
    if (maxWidthStr && !maxWidthStr.includes("%")) {
      const mw = parseFloat(maxWidthStr);
      if (mw > 0) {
        svgW = mw;
        const vb = svg.viewBox?.baseVal;
        if (vb && vb.width > 0) {
          svgH = mw * (vb.height / vb.width);
        }
      }
    }

    // Fallback: use viewBox dimensions directly
    if (!svgW || !svgH) {
      svgW = svg.viewBox?.baseVal?.width ?? 0;
      svgH = svg.viewBox?.baseVal?.height ?? 0;
    }

    // Fallback: parse explicit width/height attributes (skip "%" values)
    if (!svgW || !svgH) {
      const aw = parseFloat(svg.getAttribute("width") ?? "0");
      const ah = parseFloat(svg.getAttribute("height") ?? "0");
      if (aw && ah && !svg.getAttribute("width")?.includes("%")) {
        svgW = aw;
        svgH = ah;
      }
    }

    if (!svgW || !svgH) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const fitScale = clamp(
      Math.min(containerW / svgW, containerH / svgH) * 0.9,
      MIN_SCALE,
      MAX_SCALE
    );

    setScale(Math.round(fitScale * 100) / 100);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => clamp(Math.round((s + delta) * 100) / 100, MIN_SCALE, MAX_SCALE));
  }, []);

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(-ZOOM_STEP), [zoomBy]);

  // Wheel zoom — must be non-passive to call preventDefault.
  // Depends on svgContent so the listener re-attaches each time the
  // canvas div mounts (containerRef is null until SVG renders).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setScale((s) => clamp(Math.round((s + delta) * 100) / 100, MIN_SCALE, MAX_SCALE));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [svgContent]);

  // Mouse pan start; middle-button (button 1) resets view
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button === 1) {
        e.preventDefault(); // prevent browser auto-scroll mode
        resetView();
        return;
      }
      if (e.button !== 0) return;
      e.preventDefault();
      panAnchor.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      };
      setIsPanning(true);
    },
    [resetView]
  );

  // Mouse pan move/end at window level so dragging outside container still works
  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      if (!panAnchor.current) return;
      setTranslate({
        x: panAnchor.current.tx + e.clientX - panAnchor.current.mouseX,
        y: panAnchor.current.ty + e.clientY - panAnchor.current.mouseY,
      });
    };
    const onUp = () => {
      panAnchor.current = null;
      setIsPanning(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  // Touch: pinch-to-zoom + double-tap reset
  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDistance.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          resetView();
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
        }
      }
    },
    [resetView]
  );

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const factor = distance / lastPinchDistance.current;
      setScale((s) => clamp(s * factor, MIN_SCALE, MAX_SCALE));
      lastPinchDistance.current = distance;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  const onDoubleClick = useCallback(() => resetView(), [resetView]);

  // Diagram rendering
  useEffect(() => {
    if (!code.trim()) {
      setSvgContent("");
      setError(null);
      setLoading(false);
      return;
    }

    let canceled = false;
    const diagramId = `mermaid-${uniqueId}-${Date.now()}`;
    setLoading(true);

    (async () => {
      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(diagramId, code);
        if (!canceled) {
          setSvgContent(svg);
          setError(null);
          setLoading(false);
          setStatusAnnouncement("Diagram rendered");
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof Error ? err.message : String(err);
          const cleanMessage = message.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
          setError(cleanMessage);
          setSvgContent("");
          setLoading(false);
          setStatusAnnouncement(`Render error: ${cleanMessage.slice(0, 100)}`);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [code, uniqueId]);

  // Auto-fit whenever a new SVG is committed to the DOM
  useEffect(() => {
    if (svgContent) fitToWindow();
  }, [svgContent, fitToWindow]);

  const btnBase = "forge-preview-btn";
  const isEmpty = !code.trim();
  const isLoadingInitial = loading && !svgContent && !error;

  const previewScopeId = `mermaid-preview-${uniqueId}`;

  return (
    <div id={previewScopeId} className={`relative overflow-hidden ${className ?? ""}`}>
      {typographyCss && <style>{typographyCss}</style>}
      {/* Always-mounted screen reader live region — stays in the DOM across all render states */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusAnnouncement}
      </div>

      {isEmpty ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h1M9 12h1M9 15h1M13 9h2M13 12h2M13 15h2" />
          </svg>
          <p className="text-sm">Paste a Mermaid diagram to see the preview</p>
        </div>
      ) : isLoadingInitial ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
          <svg
            className="animate-spin w-8 h-8 text-primary/60"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-xs">Rendering diagram…</p>
        </div>
      ) : error ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <div className="w-full max-w-lg rounded-lg border border-destructive/30 bg-destructive/8 p-4">
            <p className="text-sm font-semibold text-destructive mb-1">Render Error</p>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        </div>
      ) : (
        <>
          {/* Pan/zoom canvas */}
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden select-none flex items-center justify-center"
            style={{ cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            title="Drag to pan · Scroll to zoom · Double-click to reset"
          >
            <div
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "center center",
                flexShrink: 0,
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>

          {/* Controls overlay */}
          <div
            className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 forge-preview-controls"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className={btnBase}
              onClick={zoomOut}
              title="Zoom out (scroll down)"
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom out"
            >
              <IconZoomOut />
            </button>
            <span className="forge-preview-counter tabular-nums" title="Current zoom level">
              {Math.round(scale * 100)}%
            </span>
            <button
              className={btnBase}
              onClick={zoomIn}
              title="Zoom in (scroll up)"
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom in"
            >
              <IconZoomIn />
            </button>
            <div className="mx-0.5 h-3.5 w-px bg-white/15" />
            <button
              className={btnBase}
              onClick={fitToWindow}
              title="Fit to window"
              aria-label="Fit to window"
            >
              <IconFit />
            </button>
            <div className="mx-0.5 h-3.5 w-px bg-white/15" />
            <button
              className={btnBase}
              onClick={resetView}
              title="Reset view (double-click)"
              aria-label="Reset view"
            >
              <IconReset />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
