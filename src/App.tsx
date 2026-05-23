import { Component, useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useThemeMode, type ThemeMode } from "@/lib/themeMode";
import {
  BUILTIN_PALETTES,
  BRAND_PALETTES,
  type Palette,
  type ThemeColor,
  getEffectiveThemeName,
} from "@/lib/palettes";
import { BRAND_EXAMPLES, GENERIC_EXAMPLE, SHOWCASE_EXAMPLE } from "@/data/examples";
import { EXAMPLE_GROUPS } from "@/data/example-library";
import { AppIcon } from "@/components/AppIcon";
import { ApplyTab } from "@/pages/tabs/ApplyTab";
import { ComposeTab } from "@/pages/tabs/ComposeTab";
import { ExamplesTab } from "@/pages/tabs/ExamplesTab";
import { ReferenceTab } from "@/pages/tabs/ReferenceTab";
import { ExtractTab } from "@/pages/tabs/ExtractTab";
import {
  loadPersistedState,
  savePersistedState,
  decodeShareableTheme,
  type ShareablePayload,
} from "@/lib/persistence";
import { type MermaidLook, CLASSDEF_CAPABLE_FAMILIES } from "@/lib/themeEngine";
import { detectDiagram } from "@/lib/detector";
import { type TypographySettings, DEFAULT_TYPOGRAPHY } from "@/lib/typography";
import {
  paletteFromExtracted,
  makeExtractedPaletteId,
  extractTheme,
  hasExtractableTheme,
} from "@/lib/extractor";

export type AppTab = "apply" | "compose" | "examples" | "reference" | "extract";

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
    id: "apply",
    label: "Apply",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
  },
  {
    id: "extract",
    label: "Extract",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
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

const RECENT_PALETTES_MAX = 5;

function ThemeModeToggle({ mode, cycle, className }: { mode: ThemeMode; cycle: () => void; className?: string }) {
  const label =
    mode === "system"
      ? "System theme (click to switch to light)"
      : mode === "light"
      ? "Light theme (click to switch to dark)"
      : "Dark theme (click to switch to system)";
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={className ?? "p-1.5 rounded-md border border-border/60 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors print-hide"}
    >
      {mode === "light" ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM3.75 9.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zM15 9.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H15zM5.05 5.05a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L5.05 6.11a.75.75 0 010-1.06zM12.83 12.83a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.05 14.95a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM12.83 7.17a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06L13.89 7.17a.75.75 0 01-1.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z"
            clipRule="evenodd"
          />
        </svg>
      ) : mode === "dark" ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5" aria-hidden="true">
          <rect x="2.5" y="4" width="15" height="11" rx="1.5" />
          <path d="M7 18h6M10 15v3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const h = window.location.hash.slice(1);
    const TABS: AppTab[] = ["apply", "compose", "examples", "reference", "extract"];
    return TABS.includes(h as AppTab) ? (h as AppTab) : "apply";
  });
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
  const [recentPaletteIds, setRecentPaletteIds] = useState<string[]>([]);
  const [look, setLook] = useState<MermaidLook>("classic");
  const [fontSize, setFontSize] = useState<string>("");
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [rendererTarget, setRendererTarget] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"original" | "themed" | "diff" | "code">("themed");
  const [lastExampleType, setLastExampleType] = useState<Record<string, "flowchart" | "sequence">>({});
  const [lastSelectedExampleId, setLastSelectedExampleId] = useState<string>("");

  const supportsClassDef = useMemo(
    () => CLASSDEF_CAPABLE_FAMILIES.includes(detectDiagram(inputCode).family),
    [inputCode],
  );
  const tabsRef = useRef<HTMLDivElement>(null);
  const { mode: themeMode, cycle: cycleThemeMode } = useThemeMode();

  // Keep URL hash in sync with active tab so tabs are bookmarkable/shareable.
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

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
      if (Array.isArray(persisted.recentPaletteIds)) {
        setRecentPaletteIds(persisted.recentPaletteIds.filter((s): s is string => typeof s === "string").slice(0, RECENT_PALETTES_MAX));
      }
      if (persisted.look === "neo" || persisted.look === "handDrawn" || persisted.look === "classic") {
        setLook(persisted.look as MermaidLook);
      }
      if (typeof persisted.fontSize === "string") setFontSize(persisted.fontSize);
      if (persisted.typography && typeof persisted.typography === "object") {
        const t = persisted.typography as TypographySettings;
        if (t.diagramTitle && t.subgraphTitle && t.nestedSubgraphTitle && t.nodeLabel && t.edgeLabel) {
          setTypography(t);
        }
      }
      if (typeof persisted.rendererTarget === "string") setRendererTarget(persisted.rendererTarget);
      const VALID_PREVIEW_MODES = ["original", "themed", "diff", "code"] as const;
      if (typeof persisted.previewMode === "string" && (VALID_PREVIEW_MODES as readonly string[]).includes(persisted.previewMode)) {
        setPreviewMode(persisted.previewMode as "original" | "themed" | "diff" | "code");
      }
      if (persisted.lastExampleType && typeof persisted.lastExampleType === "object") {
        const clean: Record<string, "flowchart" | "sequence"> = {};
        for (const [k, v] of Object.entries(persisted.lastExampleType)) {
          if (typeof k === "string" && (v === "flowchart" || v === "sequence")) clean[k] = v;
        }
        setLastExampleType(clean);
      }
      if (typeof persisted.lastSelectedExampleId === "string" && persisted.lastSelectedExampleId) {
        setLastSelectedExampleId(persisted.lastSelectedExampleId);
      }
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
      recentPaletteIds,
      look,
      fontSize,
      typography,
      rendererTarget,
      previewMode,
      lastExampleType,
      lastSelectedExampleId,
    });
  }, [hydrated, selectedPaletteId, customColors, includeMetaComments, includeBadge, customThemeName, inputCode, userPalettes, recentPaletteIds, look, fontSize, typography, rendererTarget, previewMode, lastExampleType, lastSelectedExampleId]);

  // Auto-clear toast after 2.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
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
    setRecentPaletteIds((prev) => {
      const next = [id, ...prev.filter((p) => p !== id)].slice(0, RECENT_PALETTES_MAX);
      return next;
    });
    const knownExamples = new Set<string>([
      GENERIC_EXAMPLE,
      SHOWCASE_EXAMPLE,
      ...Object.values(BRAND_EXAMPLES).flatMap(({ flowchart, sequence }) => [
        flowchart,
        sequence,
      ]),
      ...EXAMPLE_GROUPS.flatMap((g) => g.entries.map((e) => e.content)),
    ]);
    const willReplace = inputCode.trim() === "" || knownExamples.has(inputCode);
    const isBrandPalette = BRAND_PALETTES.some((p) => p.id === id);
    if (isBrandPalette && BRAND_EXAMPLES[id]) {
      const exType = lastExampleType[id] ?? "flowchart";
      if (willReplace) {
        const paletteName = BRAND_PALETTES.find((p) => p.id === id)?.name ?? id;
        setToast(`Loaded ${paletteName} ${exType} example`);
      }
      setInputCode((current) =>
        current.trim() === "" || knownExamples.has(current)
          ? BRAND_EXAMPLES[id][exType]
          : current,
      );
    } else if (!isBrandPalette) {
      if (willReplace) {
        setToast("Loaded Mermaid flowchart example");
      }
      setInputCode((current) =>
        current.trim() === "" || knownExamples.has(current)
          ? GENERIC_EXAMPLE
          : current,
      );
    }
  }, [inputCode, lastExampleType]);

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

  /** Reset a single swatch back to its base palette value. If clearing this
   *  override leaves the palette with no remaining customizations, the
   *  override entry is removed entirely so `hasCustomizations` flips false. */
  const handleResetColor = useCallback(
    (key: string) => {
      setCustomColors((prev) => {
        const base = allPalettes.find((p) => p.id === selectedPaletteId);
        const overrides = prev[selectedPaletteId];
        if (!base || !overrides) return prev;
        const restored = overrides.map((c) => {
          if (c.key !== key) return c;
          const baseColor = base.colors.find((bc) => bc.key === key);
          return baseColor ? { ...c, value: baseColor.value } : c;
        });
        const stillCustomized = restored.some((c) => {
          const baseColor = base.colors.find((bc) => bc.key === c.key);
          return baseColor ? baseColor.value !== c.value : false;
        });
        const next = { ...prev };
        if (stillCustomized) {
          next[selectedPaletteId] = restored;
        } else {
          delete next[selectedPaletteId];
        }
        return next;
      });
    },
    [allPalettes, selectedPaletteId],
  );

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

  /** Extract tab: accept a pre-built Palette from the Extract tab and activate it. */
  const handleUseExtractedTheme = useCallback((palette: Palette) => {
    const taken = new Set<string>([
      ...BUILTIN_PALETTES.map((p) => p.id),
      ...userPalettes.map((p) => p.id),
    ]);
    const safeId = taken.has(palette.id) ? uniquePaletteId("extracted-", taken) : palette.id;
    const safe: Palette = { ...palette, id: safeId };
    setUserPalettes((prev) => [...prev, safe]);
    setSelectedPaletteId(safeId);
    setCustomThemeName("");
  }, [userPalettes]);

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

  const handleRecordExampleType = useCallback((id: string, type: "flowchart" | "sequence") => {
    setLastExampleType((prev) => ({ ...prev, [id]: type }));
  }, []);

  return (
    <div className="forge-shell">
      <header className="forge-header sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between gap-4 shrink-0 print-hide">
        <div className="flex items-center gap-3">
          <AppIcon size={28} aria-hidden="true" />
          <div>
            <div className="flex items-baseline gap-2 leading-none">
              <h1 className="forge-header-title">
                Mermaid Theme Builder
              </h1>
            </div>
            <p className="forge-header-subtitle">
              visual governance for AI-generated Mermaid diagrams
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[10px]">
            <span className="forge-header-badge">OKHP³</span>
            <span className="forge-header-sep">·</span>
            <span className="forge-header-meta">v{__APP_VERSION__}</span>
          </div>
          <ThemeModeToggle
            mode={themeMode}
            cycle={cycleThemeMode}
            className="forge-header-icon-btn print-hide"
          />
        </div>
      </header>

      <nav
        ref={tabsRef}
        className="hidden md:flex border-b border-border bg-card/60 px-4 shrink-0 print-hide"
        role="tablist"
        aria-label="Mermaid Theme Builder sections"
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
          e.preventDefault();
          const idx = TAB_CONFIG.findIndex((t) => t.id === activeTab);
          let next = idx;
          if (e.key === "ArrowLeft") next = (idx - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
          else if (e.key === "ArrowRight") next = (idx + 1) % TAB_CONFIG.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = TAB_CONFIG.length - 1;
          const nextId = TAB_CONFIG[next].id;
          setActiveTab(nextId);
          requestAnimationFrame(() => {
            const btn = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${nextId}"]`);
            btn?.focus();
          });
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`forge-tab${selected ? " forge-tab-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 md:overflow-hidden pb-20 md:pb-0 md:min-h-0">
        {/* ApplyTab is always mounted so its local state (activeDiagramIdx,
            showColorEditor, textareaExpanded, familyOverride, etc.) survives
            tab switches. It is visually hidden via the HTML `hidden` attribute
            when another tab is active. */}
        <div
          role="tabpanel"
          id="tabpanel-apply"
          aria-label="Apply"
          tabIndex={-1}
          className="md:h-full"
          hidden={activeTab !== "apply"}
        >
          <ApplyTab
            selectedPalette={selectedPalette}
            selectedPaletteId={selectedPaletteId}
            onSelectPalette={handleSelectPalette}
            customColors={customColors}
            onColorChange={handleColorChange}
            onResetPalette={handleResetPalette}
            onResetColor={handleResetColor}
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
            recentPaletteIds={recentPaletteIds}
            look={look}
            onLookChange={setLook}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            typography={typography}
            rendererTarget={rendererTarget}
            onRendererTargetChange={setRendererTarget}
            lastExampleType={lastExampleType}
            onRecordExampleType={handleRecordExampleType}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        </div>
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-label={TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? activeTab}
          tabIndex={-1}
          className="md:h-full"
          hidden={activeTab === "apply"}
        >
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
            look={look}
            onLookChange={setLook}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            typography={typography}
            onTypographyChange={setTypography}
            rendererTarget={rendererTarget}
            onRendererTargetChange={setRendererTarget}
          />
        )}
        {activeTab === "examples" && (
          <ExamplesTab
            selectedPalette={selectedPalette}
            onLoadExample={handleLoadExample}
            initialSelectedId={lastSelectedExampleId}
            onExampleSelect={setLastSelectedExampleId}
          />
        )}
        {activeTab === "reference" && (
          <ReferenceTab selectedPalette={selectedPalette} supportsClassDef={supportsClassDef} inputCode={inputCode} />
        )}
        {activeTab === "extract" && (
          <ExtractTab
            onUseExtractedTheme={handleUseExtractedTheme}
            onSwitchTab={setActiveTab}
            onShowToast={showToast}
          />
        )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-14 left-0 right-0 z-20 flex items-center justify-center px-4 py-1 print-hide" style={{background: '#0f1a17', borderTop: '1px solid rgba(212,201,181,0.08)'}}>
        <p className="text-[9px] text-center" style={{color: 'rgba(212,201,181,0.45)', lineHeight: 1.4}}>
          Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai
        </p>
      </div>

      <nav
        className="forge-mobile-nav fixed bottom-0 left-0 right-0 flex md:hidden z-30 shrink-0 print-hide"
        role="tablist"
        aria-label="Mermaid Theme Builder sections (mobile)"
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
          e.preventDefault();
          const idx = TAB_CONFIG.findIndex((t) => t.id === activeTab);
          let next = idx;
          if (e.key === "ArrowLeft") next = (idx - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
          else if (e.key === "ArrowRight") next = (idx + 1) % TAB_CONFIG.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = TAB_CONFIG.length - 1;
          const nextId = TAB_CONFIG[next].id;
          setActiveTab(nextId);
          requestAnimationFrame(() => {
            const btn = document.querySelector<HTMLButtonElement>(`.forge-mobile-nav [data-tab-id="${nextId}"]`);
            btn?.focus();
          });
        }}
      >
        {TAB_CONFIG.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              id={`mobile-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`forge-mobile-nav-item${selected ? " forge-mobile-nav-item-active" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      <footer className="forge-footer flex-none hidden md:flex items-center justify-between px-4 py-1.5 print-hide" style={{minHeight: '34px'}}>
        <div className="flex items-center gap-2 forge-footer-meta">
          <span className="forge-footer-slug">mermaid-theme-builder</span>
          <span>·</span>
          <span>visual governance utility</span>
          <span>·</span>
          <span className="forge-footer-brand">OverKill Hill P³</span>
        </div>
        <div className="flex items-center gap-2 forge-footer-meta" style={{opacity: 0.45, fontSize: '9px'}}>
          Not affiliated with Mermaid, Mermaid Chart, or Mermaid.ai
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/OKHP3/mermaid-theme-builder" target="_blank" rel="noopener noreferrer" className="forge-footer-link">GitHub</a>
          <a href="https://overkillhill.com/projects/mermaid-theme-builder/" target="_blank" rel="noopener noreferrer" className="forge-footer-link">Project Page</a>
          <a href="https://mermaidchart.cello.so/UhVlNtC2MlS" target="_blank" rel="noopener noreferrer" className="forge-footer-link" style={{ color: "#FF3670" }}>Mermaid.ai</a>
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pl-4 pr-2 py-2 rounded-md bg-foreground/90 text-background text-xs font-medium shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
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
