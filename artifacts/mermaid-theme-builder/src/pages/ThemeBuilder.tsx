import { useState, useCallback, useMemo, useEffect } from "react";
import { BUILTIN_PALETTES, type Palette, type ThemeColor } from "@/lib/palettes";
import { detectDiagram } from "@/lib/detector";
import { generateThemedCode, generateMarkdownExport, generatePromptScaffold } from "@/lib/themeEngine";
import { MermaidPreview } from "@/components/MermaidPreview";
import { ColorSwatch } from "@/components/ColorSwatch";
import { WarningBanner } from "@/components/WarningBanner";

const SAMPLE_CODE = `flowchart TD
    A[User Request] --> B{Validate Input}
    B -->|Valid| C[Process Request]
    B -->|Invalid| D[Return Error]
    C --> E[Fetch Data]
    E --> F{Data Found?}
    F -->|Yes| G[Format Response]
    F -->|No| H[Return 404]
    G --> I[Send Response]`;

type Tab = "input" | "output";
type ExportType = "code" | "markdown" | "prompt";

export function ThemeBuilder() {
  const [inputCode, setInputCode] = useState(SAMPLE_CODE);
  const [selectedPaletteId, setSelectedPaletteId] = useState(BUILTIN_PALETTES[0].id);
  const [customColors, setCustomColors] = useState<Record<string, ThemeColor[]>>({});
  const [activeTab, setActiveTab] = useState<Tab>("input");
  const [copiedType, setCopiedType] = useState<ExportType | null>(null);

  const selectedPalette = useMemo((): Palette => {
    const base = BUILTIN_PALETTES.find((p) => p.id === selectedPaletteId) ?? BUILTIN_PALETTES[0];
    const overrides = customColors[selectedPaletteId];
    if (!overrides) return base;
    return {
      ...base,
      colors: base.colors.map((c) => {
        const override = overrides.find((o) => o.key === c.key);
        return override ?? c;
      }),
    };
  }, [selectedPaletteId, customColors]);

  const detection = useMemo(() => detectDiagram(inputCode), [inputCode]);

  const themedCode = useMemo(
    () =>
      inputCode.trim()
        ? generateThemedCode(inputCode, { palette: selectedPalette, diagramFamily: detection.family })
        : "",
    [inputCode, selectedPalette, detection.family],
  );

  const handleColorChange = useCallback(
    (key: string, value: string) => {
      setCustomColors((prev) => {
        const base = BUILTIN_PALETTES.find((p) => p.id === selectedPaletteId)!;
        const existing = prev[selectedPaletteId] ?? base.colors.map((c) => ({ ...c }));
        const updated = existing.map((c) => (c.key === key ? { ...c, value } : c));
        return { ...prev, [selectedPaletteId]: updated };
      });
    },
    [selectedPaletteId],
  );

  const handleResetPalette = useCallback(() => {
    setCustomColors((prev) => {
      const next = { ...prev };
      delete next[selectedPaletteId];
      return next;
    });
  }, [selectedPaletteId]);

  const copyToClipboard = useCallback(
    async (type: ExportType) => {
      let text = "";
      if (type === "code") text = themedCode;
      else if (type === "markdown") text = generateMarkdownExport(themedCode, selectedPalette.name);
      else if (type === "prompt") text = generatePromptScaffold(selectedPalette, detection.family);

      try {
        await navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      } catch {
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      }
    },
    [themedCode, selectedPalette, detection.family],
  );

  const hasCustomizations = Boolean(customColors[selectedPaletteId]);

  const previewCode = activeTab === "output" ? themedCode : inputCode;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M5.636 5.636l2.122 2.122M16.243 16.243l2.121 2.121M5.636 18.364l2.122-2.122M16.243 7.757l2.121-2.121" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-none">Mermaid Theme Builder</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Visual theme control for AI-generated diagrams</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {detection.family !== "unknown" && (
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {detection.label}
            </span>
          )}
          <span className="hidden sm:block">v0.1 — local only</span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card/40 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Theme Palette</h2>
            <div className="grid grid-cols-2 gap-2">
              {BUILTIN_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPaletteId(p.id)}
                  className={`relative text-left rounded-lg border p-2.5 transition-all text-xs ${
                    selectedPaletteId === p.id
                      ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex gap-1 mb-1.5">
                    {p.colors.slice(0, 4).map((c) => (
                      <div
                        key={c.key}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <p className="font-semibold text-foreground leading-tight">{p.name}</p>
                  {customColors[p.id] && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Color Editor
              </h2>
              {hasCustomizations && (
                <button
                  onClick={handleResetPalette}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{selectedPalette.description}</p>
            <div className="space-y-0.5">
              {selectedPalette.colors.map((color) => (
                <ColorSwatch
                  key={color.key}
                  color={
                    customColors[selectedPaletteId]?.find((c) => c.key === color.key) ?? color
                  }
                  onChange={handleColorChange}
                />
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex flex-col md:flex-row flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-card/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-medium text-foreground">Input</span>
                </div>
                <button
                  onClick={() => setInputCode(SAMPLE_CODE)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Load example
                </button>
              </div>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-xs bg-background text-foreground resize-none focus:outline-none placeholder:text-muted-foreground"
                placeholder="Paste your Mermaid diagram code here..."
                spellCheck={false}
              />
              {detection.warnings.length > 0 && (
                <div className="p-3 border-t border-border">
                  <WarningBanner warnings={detection.warnings} />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-card/30">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5 p-0.5 rounded-md bg-muted">
                    {(["input", "output"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all capitalize ${
                          activeTab === t
                            ? "bg-card text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "input" ? "Original" : "Themed"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-muted/20">
                <MermaidPreview
                  code={previewCode}
                  className="min-h-[280px]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card/40 p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:block">
              Export
            </span>

            <CopyButton
              label="Styled Code"
              copied={copiedType === "code"}
              disabled={!themedCode}
              onClick={() => copyToClipboard("code")}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
              }
            />
            <CopyButton
              label="Markdown"
              copied={copiedType === "markdown"}
              disabled={!themedCode}
              onClick={() => copyToClipboard("markdown")}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm3 1h8v2H6V6zm0 3h8v2H6V9zm0 3h5v2H6v-2z" clipRule="evenodd" />
                </svg>
              }
            />
            <CopyButton
              label="Prompt Scaffold"
              copied={copiedType === "prompt"}
              disabled={!themedCode}
              onClick={() => copyToClipboard("prompt")}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              }
            />

            {themedCode && (
              <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Theme ready
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function CopyButton({
  label,
  copied,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  copied: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
        copied
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
          : disabled
          ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
          : "bg-card border-border text-foreground hover:bg-muted hover:border-primary/30"
      }`}
    >
      {copied ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        icon
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}
