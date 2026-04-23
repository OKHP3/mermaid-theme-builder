import { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";

interface MermaidPreviewProps {
  code: string;
  className?: string;
}

let initializationDone = false;

export function MermaidPreview({ code, className }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const uniqueId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!initializationDone) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        suppressErrorRendering: true,
      });
      initializationDone = true;
    }
  }, []);

  useEffect(() => {
    if (!code.trim()) {
      setSvgContent("");
      setError(null);
      return;
    }

    let cancelled = false;
    const diagramId = `mermaid-${uniqueId}-${Date.now()}`;

    (async () => {
      try {
        const { svg } = await mermaid.render(diagramId, code);
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""));
          setSvgContent("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, uniqueId]);

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
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-auto ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
