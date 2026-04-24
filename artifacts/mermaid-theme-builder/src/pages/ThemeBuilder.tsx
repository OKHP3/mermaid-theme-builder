import { useState, useCallback, useMemo } from "react";
import {
  BUILTIN_PALETTES,
  BRAND_PALETTES,
  UTILITY_PALETTES,
  type Palette,
  type ThemeColor,
  getEffectiveThemeName,
} from "@/lib/palettes";
import { detectDiagram } from "@/lib/detector";
import {
  generateThemedCode,
  generateMarkdownExport,
  generatePromptScaffold,
  type ExportOptions,
} from "@/lib/themeEngine";
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
  const [selectedPaletteId, setSelectedPaletteId] = useState(BRAND_PALETTES[0].id);
  const [customColors, setCustomColors] = useState<Record<string, ThemeColor[]>>({});
  const [activeTab, setActiveTab] = useState<Tab>("input");
  const [copiedType, setCopiedType] = useState<ExportType | null>(null);
  const [includeMetaComments, setIncludeMetaComments] = useState(true);
  const [includeBadge, setIncludeBadge] = useState(false);
  const [customThemeName, setCustomThemeName] = useState("");

  const selectedPalette = useMemo((): Palette => {
    const base = BUILTIN_PALETTES.find((p) => p.id === selectedPaletteId) ?? BRAND_PALETTES[0];
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

  const hasCustomizations = Boolean(customColors[selectedPaletteId]);

  const detection = useMemo(() => detectDiagram(inputCode), [inputCode]);

  const effectiveThemeName = useMemo(
    () => getEffectiveThemeName(selectedPalette, customThemeName, hasCustomizations),
    [selectedPalette, customThemeName, hasCustomizations],
  );

  const exportOptions = useMemo((): ExportOptions => ({
    palette: selectedPalette,
    diagramFamily: detection.family,
    includeMetaComments,
    includeBadge,
    customThemeName: effectiveThemeName !== selectedPalette.name ? effectiveThemeName : undefined,
  }), [selectedPalette, detection.family, includeMetaComments, includeBadge, effectiveThemeName]);

  const previewOptions = useMemo((): ExportOptions => ({
    ...exportOptions,
    includeBadge: false,
  }), [exportOptions]);

  const themedCode = useMemo(
    () => inputCode.trim() ? generateThemedCode(inputCode, previewOptions) : "",
    [inputCode, previewOptions],
  );

  const exportCode = useMemo(
    () => inputCode.trim() ? generateThemedCode(inputCode, exportOptions) : "",
    [inputCode, exportOptions],
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
    setCustomThemeName("");
  }, [selectedPaletteId]);

  const handleSelectPalette = useCallback((id: string) => {
    setSelectedPaletteId(id);
    setCustomThemeName("");
  }, []);

  const copyToClipboard = useCallback(
    async (type: ExportType) => {
      let text = "";
      if (type === "code") text = exportCode;
      else if (type === "markdown") text = generateMarkdownExport(exportCode, selectedPalette, exportOptions);
      else if (type === "prompt") text = generatePromptScaffold(selectedPalette, exportOptions);

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
    [exportCode, selectedPalette, exportOptions],
  );

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
          <span className="hidden sm:block">v0.1 · local only</span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card/40 flex flex-col overflow-y-auto">

          <div className="p-4 border-b border-border">
            <SectionLabel label="Brand Presets" badge="OKHP3" />
            <div className="grid grid-cols-1 gap-1.5 mt-2">
              {BRAND_PALETTES.map((p) => (
                <BrandPaletteCard
                  key={p.id}
                  palette={p}
                  selected={selectedPaletteId === p.id}
                  customized={Boolean(customColors[p.id])}
                  onClick={() => handleSelectPalette(p.id)}
                />
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <SectionLabel label="Theme Presets" />
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {UTILITY_PALETTES.map((p) => (
                <UtilityPaletteCard
                  key={p.id}
                  palette={p}
                  selected={selectedPaletteId === p.id}
                  customized={Boolean(customColors[p.id])}
                  onClick={() => handleSelectPalette(p.id)}
                />
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-border flex-1">
            <div className="flex items-center justify-between mb-1">
              <SectionLabel label="Color Editor" />
              {hasCustomizations && (
                <button
                  onClick={handleResetPalette}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{selectedPalette.description}</p>
            <div className="space-y-0.5">
              {selectedPalette.colors.map((color) => (
                <ColorSwatch
                  key={color.key}
                  color={customColors[selectedPaletteId]?.find((c) => c.key === color.key) ?? color}
                  onChange={handleColorChange}
                />
              ))}
            </div>
          </div>

          {selectedPalette.themeIntent && (
            <div className="p-4 border-b border-border">
              <SectionLabel label="Theme Details" />
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground w-14 shrink-0">Name</span>
                  <span className="text-foreground font-medium">{selectedPalette.name}</span>
                </div>
                {selectedPalette.brandFamily && (
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground w-14 shrink-0">Brand</span>
                    <span className="text-foreground">OKHP3 Ecosystem</span>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground w-14 shrink-0">For</span>
                  <span className="text-foreground leading-snug">{selectedPalette.themeIntent}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground w-14 shrink-0">Version</span>
                  <span className="text-foreground font-mono">{selectedPalette.version}</span>
                </div>
                {selectedPalette.sourceUrls?.[0] && (
                  <div className="flex gap-1.5">
                    <span className="text-muted-foreground w-14 shrink-0">Source</span>
                    <a
                      href={selectedPalette.sourceUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {selectedPalette.sourceUrls[0].replace("https://", "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4">
            <SectionLabel label="Export Settings" />
            <div className="mt-2 space-y-3">
              <Toggle
                id="meta-comments"
                checked={includeMetaComments}
                onChange={setIncludeMetaComments}
                label="Metadata comments"
                hint="Adds %% theme info to exports"
              />
              <Toggle
                id="attr-badge"
                checked={includeBadge}
                onChange={setIncludeBadge}
                label="Attribution badge"
                hint={detection.family !== "flowchart" && detection.family !== "unknown" ? "Flowchart diagrams only" : "Adds a small linked badge node"}
                disabled={!["flowchart", "unknown"].includes(detection.family)}
              />
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  {hasCustomizations ? "Custom theme name" : "Theme name (optional)"}
                </label>
                <input
                  type="text"
                  value={customThemeName}
                  onChange={(e) => setCustomThemeName(e.target.value)}
                  placeholder={hasCustomizations ? `Custom — based on ${selectedPalette.name}` : selectedPalette.name}
                  className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                {(hasCustomizations || customThemeName.trim()) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Exports will use: <span className="text-foreground font-medium">{effectiveThemeName}</span>
                  </p>
                )}
              </div>
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
                  {activeTab === "output" && effectiveThemeName && (
                    <span className="text-xs text-muted-foreground hidden sm:block truncate">
                      {effectiveThemeName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-muted/20">
                <MermaidPreview code={previewCode} className="min-h-[280px]" />
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
              disabled={!exportCode}
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
              disabled={!exportCode}
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
              disabled={!exportCode}
              onClick={() => copyToClipboard("prompt")}
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              }
            />

            {exportCode && (
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

function SectionLabel({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
      {badge && (
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      )}
    </div>
  );
}

function BrandPaletteCard({
  palette,
  selected,
  customized,
  onClick,
}: {
  palette: Palette;
  selected: boolean;
  customized: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-lg border p-2.5 transition-all ${
        selected
          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1 shrink-0">
          {palette.colors.slice(0, 5).map((c) => (
            <div
              key={c.key}
              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        {customized && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
      </div>
      <div className="mt-1.5">
        <p className="text-xs font-semibold text-foreground leading-none">{palette.name}</p>
        {palette.themeIntent && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">
            {palette.themeIntent.split(",")[0]}
          </p>
        )}
      </div>
    </button>
  );
}

function UtilityPaletteCard({
  palette,
  selected,
  customized,
  onClick,
}: {
  palette: Palette;
  selected: boolean;
  customized: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left rounded-lg border p-2.5 transition-all text-xs ${
        selected
          ? "border-primary bg-primary/8 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <div className="flex gap-1 mb-1.5">
        {palette.colors.slice(0, 4).map((c) => (
          <div
            key={c.key}
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      <p className="font-semibold text-foreground leading-tight">{palette.name}</p>
      {customized && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </button>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${disabled ? "opacity-50" : ""}`}>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors mt-0.5 ${
          checked && !disabled ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-xs font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {hint && <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>}
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
