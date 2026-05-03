import { Component, useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import {
  BUILTIN_PALETTES,
  BRAND_PALETTES,
  type Palette,
  type ThemeColor,
  getEffectiveThemeName,
} from "@/lib/palettes";
import { BRAND_EXAMPLES, GENERIC_EXAMPLE, SHOWCASE_EXAMPLE } from "@/data/examples";
import { EXAMPLE_GROUPS } from "@/data/example-library";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import {
  loadPersistedState,
  savePersistedState,
  decodeShareableTheme,
  type ShareablePayload,
} from "@/lib/persistence";
import {
  paletteFromExtracted,
  makeExtractedPaletteId,
  extractTheme,
  hasExtractableTheme,
} from "@/lib/extractor";

export type AppTab = "apply" | "compose" | "examples" | "reference";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-12 h-12 text-destructive/60"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div className="text-center max-w-md">
            <p className="text-sm font-semibold text-foreground mb-1">Failed to load</p>
            <p className="text-xs text-muted-foreground mb-3">
              Something went wrong initialising the theme builder.
            </p>
            <pre className="text-[10px] text-destructive/70 bg-destructive/8 border border-destructive/20 rounded p-3 text-left whitespace-pre-wrap font-mono max-h-40 overflow-auto">
              {this.state.error.message}
            </pre>
          </div>
          <button
            className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TAB_CONFIG: {
  id: AppTab;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "apply",
    label: "Apply",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  {
    id: "compose",
    label: "Compose",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "examples",
    label: "Examples",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "reference",
    label: "Reference",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
];

function uniquePaletteId(prefix: string, taken: Set<string>): string {
  let id = `${prefix}${Date.now().toString(36)}`;
  let salt = 0;
  while (taken.has(id)) {
    salt++;
    id = `${prefix}${Date.now().toString(36)}-${salt.toString(36)}`;
  }
  return id;
}

function buildPaletteFromShare(payload: ShareablePayload): Palette {
  const name = payload.paletteName || "Shared theme";
  const colors: ThemeColor[] = Object.entries(payload.themeVariables).map(([key, value]) => ({
    key,
    label: key,
    value,
  }));
  // Merge with a sensible label set when keys overlap with the canonical palette schema.
  const canonical = BRAND_PALETTES[0].colors;
  const merged: ThemeColor[] = canonical.map((c) => {
    const override = colors.find((o) => o.key === c.key);
    return override ? { ...c, value: override.value } : c;
  });
  // Add any extra keys beyond the canonical set
  for (const c of colors) {
    if (!merged.find((m) => m.key === c.key)) merged.push(c);
  }
  return {
    id: payload.paletteId && payload.paletteId.startsWith("shared-") ? payload.paletteId : `shared-${Date.now().toString(36)}`,
    name,
    description: "Theme loaded from a shared link.",
    version: "0.0.0",
    colors: merged,
    attribution: {
      enabledByDefault: true,
      label: `Themed with Mermaid Theme Builder · ${name}`,
      url: "https://overkillhill.com/projects/mermaid-theme-builder/",
      themeName: name,
      toolName: "Mermaid Theme Builder",
      toolVersion: "0.3.0",
    },
  };
}

function readShareToken(): ShareablePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("theme");
    if (!token) return null;
    return decodeShareableTheme(token);
  } catch {
    return null;
  }
}

function clearShareToken(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("theme")) return;
    url.searchParams.delete("theme");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("apply");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userPalettes, setUserPalettes] = useState<Palette[]>([]);
  const [selectedPaletteId, setSelectedPaletteId] = useState(BRAND_PALETTES[0].id);
  const [customColors, setCustomColors] = useState<Record<string, ThemeColor[]>>({});
  const [inputCode, setInputCode] = useState(
    BRAND_EXAMPLES[BRAND_PALETTES[0].id]?.flowchart ?? GENERIC_EXAMPLE,
  );
  const [includeMetaComments, setIncludeMetaComments] = useState(true);
  const [includeBadge, setIncludeBadge] = useState(true);
  const [customThemeName, setCustomThemeName] = useState("");

  // Hydrate from URL share token (highest priority) or localStorage on mount.
  useEffect(() => {
    let didApplyShare = false;
    const share = readShareToken();
    if (share) {
      const palette = buildPaletteFromShare(share);
      const taken = new Set<string>(BUILTIN_PALETTES.map((p) => p.id));
      if (taken.has(palette.id)) palette.id = uniquePaletteId("shared-", taken);
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(palette.id);
      if (share.customThemeName) setCustomThemeName(share.customThemeName);
      setToast(`Loaded shared theme: ${palette.name}`);
      clearShareToken();
      didApplyShare = true;
    }

    const persisted = loadPersistedState();
    if (persisted) {
      if (Array.isArray(persisted.userPalettes)) setUserPalettes((prev) => {
        // Dedupe by id; share-token palettes win over persisted duplicates.
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of persisted.userPalettes!) if (!seen.has(p.id)) merged.push(p);
        return merged;
      });
      if (!didApplyShare && typeof persisted.selectedPaletteId === "string") {
        setSelectedPaletteId(persisted.selectedPaletteId);
      }
      if (persisted.customColors && typeof persisted.customColors === "object") {
        setCustomColors(persisted.customColors as Record<string, ThemeColor[]>);
      }
      if (typeof persisted.includeMetaComments === "boolean") setIncludeMetaComments(persisted.includeMetaComments);
      if (typeof persisted.includeBadge === "boolean") setIncludeBadge(persisted.includeBadge);
      if (typeof persisted.customThemeName === "string" && !didApplyShare) setCustomThemeName(persisted.customThemeName);
      if (typeof persisted.inputCode === "string" && persisted.inputCode.trim()) setInputCode(persisted.inputCode);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage after hydration.
  useEffect(() => {
    if (!hydrated) return;
    savePersistedState({
      schemaVersion: 1,
      selectedPaletteId,
      customColors,
      includeMetaComments,
      includeBadge,
      customThemeName,
      inputCode,
      userPalettes,
    });
  }, [hydrated, selectedPaletteId, customColors, includeMetaComments, includeBadge, customThemeName, inputCode, userPalettes]);

  // Auto-clear toast after 3.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const allPalettes = useMemo<Palette[]>(() => [...BUILTIN_PALETTES, ...userPalettes], [userPalettes]);

  const selectedPalette = useMemo((): Palette => {
    const base = allPalettes.find((p) => p.id === selectedPaletteId) ?? BRAND_PALETTES[0];
    const overrides = customColors[selectedPaletteId];
    if (!overrides) return base;
    return {
      ...base,
      colors: base.colors.map((c) => {
        const override = overrides.find((o) => o.key === c.key);
        return override ?? c;
      }),
    };
  }, [allPalettes, selectedPaletteId, customColors]);

  const hasCustomizations = Boolean(customColors[selectedPaletteId]);

  const effectiveThemeName = useMemo(
    () => getEffectiveThemeName(selectedPalette, customThemeName, hasCustomizations),
    [selectedPalette, customThemeName, hasCustomizations],
  );

  const handleSelectPalette = useCallback((id: string) => {
    setSelectedPaletteId(id);
    setCustomThemeName("");
    const isBrandPalette = BRAND_PALETTES.some((p) => p.id === id);
    if (isBrandPalette && BRAND_EXAMPLES[id]) {
      const knownExamples = new Set<string>([
        GENERIC_EXAMPLE,
        SHOWCASE_EXAMPLE,
        ...Object.values(BRAND_EXAMPLES).flatMap(({ flowchart, sequence }) => [
          flowchart,
          sequence,
        ]),
        ...EXAMPLE_GROUPS.flatMap((g) => g.entries.map((e) => e.content)),
      ]);
      setInputCode((current) =>
        current.trim() === "" || knownExamples.has(current)
          ? BRAND_EXAMPLES[id].flowchart
          : current,
      );
    }
  }, []);

  const handleColorChange = useCallback(
    (key: string, value: string) => {
      setCustomColors((prev) => {
        const base = allPalettes.find((p) => p.id === selectedPaletteId);
        if (!base) return prev;
        const existing = prev[selectedPaletteId] ?? base.colors.map((c) => ({ ...c }));
        const updated = existing.map((c) => (c.key === key ? { ...c, value } : c));
        return { ...prev, [selectedPaletteId]: updated };
      });
    },
    [allPalettes, selectedPaletteId],
  );

  const handleResetPalette = useCallback(() => {
    setCustomColors((prev) => {
      const next = { ...prev };
      delete next[selectedPaletteId];
      return next;
    });
    setCustomThemeName("");
  }, [selectedPaletteId]);

  const handleLoadExample = useCallback((code: string) => {
    setInputCode(code);
    setActiveTab("apply");
  }, []);

  /** Theme B: extract theme from current input code into a new user palette. */
  const handleExtractFromCode = useCallback(
    (extractedName?: string): Palette | null => {
      if (!hasExtractableTheme(inputCode)) {
        setToast("No theme directive found in the diagram.");
        return null;
      }
      const extracted = extractTheme(inputCode);
      const palette = paletteFromExtracted(extracted, extractedName ?? "Extracted theme");
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(palette.id);
      setCustomThemeName("");
      setToast(`Extracted ${Object.keys(extracted.themeVariables).length} theme variables.`);
      return palette;
    },
    [inputCode],
  );

  /** Theme C: save the current effective palette (with edits) as a named user palette. */
  const handleSavePalette = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const taken = new Set<string>([
        ...BUILTIN_PALETTES.map((p) => p.id),
        ...userPalettes.map((p) => p.id),
      ]);
      const id = uniquePaletteId("saved-", taken);
      const palette: Palette = {
        ...selectedPalette,
        id,
        name: trimmed,
        description: `User-saved palette · derived from ${selectedPalette.name}`,
        version: "0.0.0",
        attribution: {
          ...selectedPalette.attribution,
          themeName: trimmed,
          label: `Themed with Mermaid Theme Builder · ${trimmed}`,
        },
      };
      setUserPalettes((prev) => [...prev, palette]);
      setSelectedPaletteId(id);
      setCustomThemeName("");
      setToast(`Saved palette: ${trimmed}`);
    },
    [selectedPalette, userPalettes],
  );

  const handleImportPalette = useCallback((palette: Palette) => {
    setUserPalettes((prev) => {
      const taken = new Set<string>([
        ...BUILTIN_PALETTES.map((p) => p.id),
        ...prev.map((p) => p.id),
      ]);
      const safeId = taken.has(palette.id) || !palette.id
        ? uniquePaletteId("imported-", taken)
        : palette.id;
      const safe: Palette = { ...palette, id: safeId };
      // Defer selection until next tick so userPalettes update applies first.
      queueMicrotask(() => {
        setSelectedPaletteId(safeId);
        setCustomThemeName("");
        setToast(`Imported palette: ${safe.name}`);
      });
      return [...prev, safe];
    });
  }, []);

  const handleDeleteUserPalette = useCallback((id: string) => {
    setUserPalettes((prev) => prev.filter((p) => p.id !== id));
    setCustomColors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedPaletteId((current) => (current === id ? BRAND_PALETTES[0].id : current));
    setToast("Palette removed.");
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M5.636 5.636l2.122 2.122M16.243 16.243l2.121 2.121M5.636 18.364l2.122-2.122M16.243 7.757l2.121-2.121" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-none">
              Mermaid Theme Builder
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Visual theme control for AI-generated diagrams
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/50 hidden lg:block">v0.3-alpha</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hidden md:block">
            OKHP3 Personal Project
          </span>
        </div>
      </header>

      <nav className="hidden md:flex border-b border-border bg-card/40 px-4 shrink-0">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-hidden pb-14 md:pb-0 min-h-0">
        {activeTab === "apply" && (
          <ApplyTab
            selectedPalette={selectedPalette}
            selectedPaletteId={selectedPaletteId}
            onSelectPalette={handleSelectPalette}
            customColors={customColors}
            onColorChange={handleColorChange}
            onResetPalette={handleResetPalette}
            hasCustomizations={hasCustomizations}
            inputCode={inputCode}
            onInputChange={setInputCode}
            includeMetaComments={includeMetaComments}
            includeBadge={includeBadge}
            effectiveThemeName={effectiveThemeName}
            onSwitchTab={setActiveTab}
            onExtractTheme={handleExtractFromCode}
            userPalettes={userPalettes}
            onShowToast={showToast}
          />
        )}
        {activeTab === "compose" && (
          <ComposeTab
            selectedPalette={selectedPalette}
            selectedPaletteId={selectedPaletteId}
            onSelectPalette={handleSelectPalette}
            customColors={customColors}
            onColorChange={handleColorChange}
            onResetPalette={handleResetPalette}
            hasCustomizations={hasCustomizations}
            includeMetaComments={includeMetaComments}
            onIncludeMetaCommentsChange={setIncludeMetaComments}
            includeBadge={includeBadge}
            onIncludeBadgeChange={setIncludeBadge}
            customThemeName={customThemeName}
            onCustomThemeNameChange={setCustomThemeName}
            effectiveThemeName={effectiveThemeName}
            userPalettes={userPalettes}
            onSavePalette={handleSavePalette}
            onImportPalette={handleImportPalette}
            onDeleteUserPalette={handleDeleteUserPalette}
            onShowToast={showToast}
          />
        )}
        {activeTab === "examples" && (
          <ExamplesTab
            selectedPalette={selectedPalette}
            onLoadExample={handleLoadExample}
          />
        )}
        {activeTab === "reference" && (
          <ReferenceTab selectedPalette={selectedPalette} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-border bg-card/95 backdrop-blur z-30 shrink-0">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-all ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {toast && (
        <div
          role="status"
          className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-md bg-foreground/90 text-background text-xs font-medium shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
