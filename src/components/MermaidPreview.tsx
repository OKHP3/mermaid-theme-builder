import { useCallback, useEffect, useRef, useState, useId } from "react";

interface MermaidPreviewProps {
  code: string;
  className?: string;
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
    mermaidInstance.initialize({
      startOnLoad: false,
      securityLevel: "loose",
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
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
      <line x1="6.5" y1="4.5" x2="6.5" y2="8.5" />
      <line x1="4.5" y1="6.5" x2="8.5" y2="6.5" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
      <line x1="4.5" y1="6.5" x2="8.5" y2="6.5" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8a5.5 5.5 0 1 0 1.1-3.3" />
      <polyline points="2.5 3 2.5 6 5.5 6" />
    </svg>
  );
}

export function MermaidPreview({ code, className }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panAnchor = useRef<{ mouseX: number; mouseY: number; tx: number; ty: number } | null>(null);
  const translateRef = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const uniqueId = useId().replace(/:/g, "");

  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [code, resetView]);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => clamp(Math.round((s + delta) * 100) / 100, MIN_SCALE, MAX_SCALE));
  }, []);

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(-ZOOM_STEP), [zoomBy]);

  // Wheel zoom — must be non-passive to call preventDefault
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
  }, []);

  // Mouse pan start
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    panAnchor.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      tx: translateRef.current.x,
      ty: translateRef.current.y,
    };
    setIsPanning(true);
  }, []);

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

    let cancelled = false;
    const diagramId = `mermaid-${uniqueId}-${Date.now()}`;
    setLoading(true);

    (async () => {
      try {
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(diagramId, code);
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""));
          setSvgContent("");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, uniqueId]);

  const btnBase =
    "flex items-center justify-center w-6 h-6 rounded transition-colors duration-100 text-[#d4c9b5]/70 hover:text-[#c46a2c] hover:bg-white/8 active:bg-white/12 disabled:opacity-30 disabled:cursor-not-allowed";

  if (!code.trim()) {
    return (
      <div className={`flex flex-col items-center justify-center text-muted-foreground gap-2 ${className ?? ""}`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h1M9 12h1M9 15h1M13 9h2M13 12h2M13 15h2" />
        </svg>
        <p className="text-sm">Paste a Mermaid diagram to see the preview</p>
      </div>
    );
  }

  if (loading && !svgContent) {
    return (
      <div className={`flex flex-col items-center justify-center text-muted-foreground gap-3 ${className ?? ""}`}>
        <svg className="animate-spin w-8 h-8 text-primary/60" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-xs">Rendering diagram…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className ?? ""}`}>
        <div className="w-full max-w-lg rounded-lg border border-destructive/30 bg-destructive/8 p-4">
          <p className="text-sm font-semibold text-destructive mb-1">Render Error</p>
          <pre className="text-xs text-destructive/80 whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
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
        className="absolute bottom-2 right-2 z-10 flex items-center gap-0.5 rounded-md border border-white/10 bg-[#0f1f1c]/88 px-1 py-0.5 backdrop-blur-sm shadow-lg"
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
        <span
          className="min-w-[38px] text-center font-mono text-[10px] leading-none text-[#d4c9b5]/55 select-none tabular-nums"
          title="Current zoom level"
        >
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
          onClick={resetView}
          title="Reset view (double-click)"
          aria-label="Reset view"
        >
          <IconReset />
        </button>
      </div>
    </div>
  );
}
